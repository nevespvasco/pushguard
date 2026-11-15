import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExitCalled } from './helpers.js';
import { MAX_DIFF_CHARS, PRESET_TIMEOUTS } from '../src/constants.js';
import { ReviewError } from '../src/utils/timeout.js';
import type { Config } from '../src/config.js';
import type { State } from '../src/state.js';
import type { ReviewResult } from '../src/llm/index.js';

const mocks = vi.hoisted(() => ({
  config: {} as Config,
  state: null as State | null,
  getDiff: vi.fn<() => string>(),
  review: vi.fn(),
  createProvider: vi.fn(),
  canProceed: vi.fn(() => true),
  clearState: vi.fn(),
}));

vi.mock('../src/config.js', () => ({ loadConfig: () => mocks.config }));

vi.mock('../src/state.js', () => ({
  loadState: () => mocks.state,
  clearState: mocks.clearState,
  cleanupExpiredState: vi.fn(),
}));

vi.mock('../src/utils/git.js', () => ({ getDiff: mocks.getDiff }));

vi.mock('../src/utils/tty.js', () => ({
  forceSilentMode: () => true,
  shouldAllowInteractive: () => false,
}));

vi.mock('../src/utils/ratelimit.js', () => ({
  canProceedWithReview: mocks.canProceed,
  recordReviewCompletion: vi.fn(),
  getTimeUntilNextReview: () => 3000,
}));

vi.mock('../src/llm/factory.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/llm/factory.js')>()),
  createProvider: mocks.createProvider,
}));

const { runHook } = await import('../src/hook.js');
const { logger } = await import('../src/utils/logger.js');

/** Runs the hook and returns the exit code it asked for. */
async function runHookExitCode(): Promise<number | undefined> {
  try {
    await runHook();
  } catch (error) {
    if (error instanceof ExitCalled) return error.code;
    throw error;
  }
  throw new Error('runHook returned without calling process.exit');
}

function warnings(): string[] {
  return vi.mocked(logger.warning).mock.calls.map(([message]) => message);
}

const CLEAN: ReviewResult = { hasIssues: false, issues: [] };

describe('runHook', () => {
  beforeEach(() => {
    mocks.config = { provider: 'openai', model: 'gpt-4o-mini', agent_preset: 'strict' };
    mocks.state = null;
    mocks.getDiff.mockReset().mockReturnValue('diff --git a/x b/x\n+change');
    mocks.review.mockReset().mockResolvedValue(CLEAN);
    mocks.createProvider.mockReset().mockReturnValue({ review: mocks.review });
    mocks.canProceed.mockReset().mockReturnValue(true);
    mocks.clearState.mockReset();

    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('PUSHGUARD_INTERACTIVE', '');

    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new ExitCalled(code);
    }) as typeof process.exit);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(logger, 'warning').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  describe('fail-open behaviour', () => {
    it('allows the push when the provider returns an API error', async () => {
      mocks.review.mockRejectedValue(
        new ReviewError('OpenAI review failed: 401', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          preset: 'strict',
          errorType: 'api',
        })
      );

      expect(await runHookExitCode()).toBe(0);
      expect(warnings()).toContain('Allowing push to continue (fail-open behavior)');
      expect(warnings().some((w) => w.includes('Check your API key'))).toBe(true);
    });

    it('allows the push when the review times out', async () => {
      mocks.review.mockRejectedValue(
        new ReviewError('OpenAI review failed: aborted', {
          provider: 'openai',
          model: 'gpt-4o-mini',
          preset: 'strict',
          errorType: 'timeout',
        })
      );

      expect(await runHookExitCode()).toBe(0);
      expect(warnings().some((w) => w.includes('Review timed out'))).toBe(true);
    });

    it('allows the push on an unexpected error', async () => {
      mocks.review.mockRejectedValue(new Error('ECONNRESET'));

      expect(await runHookExitCode()).toBe(0);
      expect(warnings()).toContain('Review failed: ECONNRESET');
    });

    it('allows the push when something other than an Error is thrown', async () => {
      mocks.review.mockRejectedValue('boom');

      expect(await runHookExitCode()).toBe(0);
      expect(warnings()).toContain('Review failed: Unknown error');
    });

    it('allows the push when the diff cannot be read', async () => {
      mocks.getDiff.mockImplementation(() => {
        throw new Error('Failed to get git diff: [path]');
      });

      expect(await runHookExitCode()).toBe(0);
      expect(mocks.createProvider).not.toHaveBeenCalled();
    });

    it('allows the push while rate limited, without calling the provider', async () => {
      mocks.canProceed.mockReturnValue(false);

      expect(await runHookExitCode()).toBe(0);
      expect(warnings().some((w) => w.includes('Rate limit: Please wait 3 seconds'))).toBe(true);
      expect(mocks.createProvider).not.toHaveBeenCalled();
    });

    it('allows the push when there is nothing to review', async () => {
      mocks.getDiff.mockReturnValue('   \n');

      expect(await runHookExitCode()).toBe(0);
      expect(mocks.review).not.toHaveBeenCalled();
    });
  });

  describe('review outcome', () => {
    it('allows the push and clears overrides when no issues are found', async () => {
      expect(await runHookExitCode()).toBe(0);
      expect(mocks.clearState).toHaveBeenCalled();
    });

    it('blocks the push when the review reports issues', async () => {
      mocks.review.mockResolvedValue({
        hasIssues: true,
        issues: [{ severity: 'error', message: 'SQL injection', file: 'db.ts', line: 7 }],
      });

      expect(await runHookExitCode()).toBe(1);
      expect(mocks.clearState).toHaveBeenCalled();
    });

    it('refuses to run without an API key and never creates a provider', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');

      await expect(runHook()).rejects.toThrow(/Missing API key: OPENAI_API_KEY/);
      expect(mocks.createProvider).not.toHaveBeenCalled();
    });

    it('truncates oversized diffs before sending them to the provider', async () => {
      mocks.getDiff.mockReturnValue('x'.repeat(MAX_DIFF_CHARS + 500));

      await runHookExitCode();

      const sentDiff: string = mocks.review.mock.calls[0][0];
      expect(sentDiff.startsWith('x'.repeat(MAX_DIFF_CHARS))).toBe(true);
      expect(sentDiff.endsWith('... (truncated)')).toBe(true);
      expect(sentDiff.length).toBeLessThan(MAX_DIFF_CHARS + 100);
    });
  });

  describe('preset and model selection', () => {
    it('uses the configured provider, model and preset with its timeout', async () => {
      mocks.config = { provider: 'anthropic', model: 'claude-3-haiku-20240307', agent_preset: 'balanced' };

      await runHookExitCode();

      expect(mocks.createProvider).toHaveBeenCalledWith('anthropic', {
        apiKey: 'test-key',
        model: 'claude-3-haiku-20240307',
      });
      expect(mocks.review).toHaveBeenCalledWith(
        expect.any(String),
        'balanced',
        PRESET_TIMEOUTS.balanced
      );
    });

    it('lets a temporary override from `pushguard review` win over the config', async () => {
      mocks.state = {
        overrideModel: 'gpt-4o',
        overridePreset: 'permissive',
        expiresAt: Date.now() + 60_000,
      };

      await runHookExitCode();

      expect(mocks.createProvider).toHaveBeenCalledWith('openai', { apiKey: 'test-key', model: 'gpt-4o' });
      expect(mocks.review).toHaveBeenCalledWith(
        expect.any(String),
        'permissive',
        PRESET_TIMEOUTS.permissive
      );
    });

    it('ignores and clears an expired model override', async () => {
      mocks.state = { overrideModel: 'gpt-4o', expiresAt: Date.now() - 1 };

      await runHookExitCode();

      expect(mocks.clearState).toHaveBeenCalled();
      expect(mocks.createProvider).toHaveBeenCalledWith('openai', {
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
      });
    });
  });
});
