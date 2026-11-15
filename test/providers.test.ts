import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProvider, getApiKeyEnvVar } from '../src/llm/factory.js';
import { OpenAIProvider } from '../src/llm/openai.js';
import { AnthropicProvider } from '../src/llm/anthropic.js';
import { GeminiProvider } from '../src/llm/gemini.js';
import { ReviewError } from '../src/utils/timeout.js';
import { loadPrompt } from '../src/prompts/builder.js';
import type { Provider } from '../src/config.js';

// The SDKs are replaced with fakes: these tests never touch the network.
const sdk = vi.hoisted(() => ({
  openaiCreate: vi.fn(),
  anthropicCreate: vi.fn(),
  geminiGenerate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: sdk.openaiCreate } };
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: sdk.anthropicCreate };
  },
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: sdk.geminiGenerate };
  },
}));

interface ProviderCase {
  name: Provider;
  label: string;
  /** Makes the fake SDK resolve with `text` as the model's reply. */
  respond: (text: string) => void;
  /** Makes the fake SDK reject with `error`. */
  fail: (error: unknown) => void;
  /** Makes the fake SDK hang until the timeout the provider asked for elapses. */
  hang: () => void;
  sdkCall: () => ReturnType<typeof vi.fn>;
}

const abortError = () => Object.assign(new Error('Request aborted'), { name: 'AbortError' });

/** Hung request that only settles when the provider's abort signal fires (OpenAI, Anthropic). */
const hangUntilSignal = (_body: unknown, options: { signal: AbortSignal }) =>
  new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(abortError()));
  });

const CASES: ProviderCase[] = [
  {
    name: 'openai',
    label: 'OpenAI',
    respond: (text) =>
      sdk.openaiCreate.mockResolvedValue({ choices: [{ message: { content: text } }] }),
    fail: (error) => sdk.openaiCreate.mockRejectedValue(error),
    hang: () => sdk.openaiCreate.mockImplementation(hangUntilSignal),
    sdkCall: () => sdk.openaiCreate,
  },
  {
    name: 'anthropic',
    label: 'Anthropic',
    respond: (text) =>
      sdk.anthropicCreate.mockResolvedValue({ content: [{ type: 'text', text }] }),
    fail: (error) => sdk.anthropicCreate.mockRejectedValue(error),
    hang: () => sdk.anthropicCreate.mockImplementation(hangUntilSignal),
    sdkCall: () => sdk.anthropicCreate,
  },
  {
    name: 'gemini',
    label: 'Gemini',
    respond: (text) => sdk.geminiGenerate.mockResolvedValue({ text }),
    fail: (error) => sdk.geminiGenerate.mockRejectedValue(error),
    // @google/genai takes no signal: it aborts its own fetch after config.httpOptions.timeout
    hang: () =>
      sdk.geminiGenerate.mockImplementation(
        (params: { config?: { httpOptions?: { timeout?: number } } }) =>
          new Promise((_resolve, reject) => {
            const timeout = params.config?.httpOptions?.timeout;
            if (timeout) setTimeout(() => reject(abortError()), timeout);
            else reject(new Error('request would hang: no httpOptions given'));
          })
      ),
    sdkCall: () => sdk.geminiGenerate,
  },
];

const DIFF = 'diff --git a/app.ts b/app.ts\n+eval(userInput)';

beforeEach(() => {
  sdk.openaiCreate.mockReset();
  sdk.anthropicCreate.mockReset();
  sdk.geminiGenerate.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('provider factory', () => {
  it.each([
    ['openai', OpenAIProvider],
    ['anthropic', AnthropicProvider],
    ['gemini', GeminiProvider],
  ] as const)('creates the %s provider', (name, Provider) => {
    expect(createProvider(name, { apiKey: 'test-key', model: 'm' })).toBeInstanceOf(Provider);
  });

  it('throws for an unknown provider', () => {
    expect(() => createProvider('ollama' as Provider, { apiKey: 'k', model: 'm' })).toThrow(
      /Unknown provider/
    );
  });

  it.each([
    ['openai', 'OPENAI_API_KEY'],
    ['anthropic', 'ANTHROPIC_API_KEY'],
    ['gemini', 'GEMINI_API_KEY'],
  ] as const)('reads the %s key from %s', (name, envVar) => {
    expect(getApiKeyEnvVar(name)).toBe(envVar);
  });
});

describe.each(CASES)('$label provider', ({ name, label, respond, fail, sdkCall }) => {
  const provider = () => createProvider(name, { apiKey: 'test-key', model: 'test-model' });

  it('sends the diff with the preset prompt and parses the JSON reply', async () => {
    respond(
      JSON.stringify({
        hasIssues: true,
        issues: [{ severity: 'error', message: 'eval on user input', file: 'app.ts', line: 1 }],
        summary: 'One critical issue',
      })
    );

    const result = await provider().review(DIFF, 'balanced', 1000);

    expect(result).toEqual({
      hasIssues: true,
      issues: [{ severity: 'error', message: 'eval on user input', file: 'app.ts', line: 1 }],
      summary: 'One critical issue',
    });
    const request = JSON.stringify(sdkCall().mock.calls[0][0]);
    expect(request).toContain('eval(userInput)');
    expect(request).toContain(JSON.stringify(loadPrompt('balanced')).slice(1, 60));
    expect(request).toContain('test-model');
  });

  it('drops issues that are missing a severity or message', async () => {
    respond(
      JSON.stringify({
        hasIssues: true,
        issues: [
          { severity: 'warning', message: 'kept' },
          { message: 'no severity' },
          { severity: 'error' },
          { severity: 'error', message: 42 },
          'not an object',
          null,
        ],
      })
    );

    const result = await provider().review(DIFF, 'strict', 1000);

    expect(result.issues).toEqual([{ severity: 'warning', message: 'kept' }]);
    expect(result.hasIssues).toBe(true);
  });

  it('does not block when hasIssues is true but no issue is valid', async () => {
    respond(JSON.stringify({ hasIssues: true, issues: [{ foo: 'bar' }] }));
    const result = await provider().review(DIFF, 'strict', 1000);
    expect(result).toEqual({ hasIssues: false, issues: [], summary: undefined });
  });

  it.each([
    ['malformed JSON', '{"hasIssues": tru'],
    ['a JSON array', '[]'],
    ['a JSON null', 'null'],
    ['plain prose', 'Looks good to me!'],
  ])('fails open on %s', async (_label, reply) => {
    respond(reply);
    const result = await provider().review(DIFF, 'strict', 1000);
    expect(result.hasIssues).toBe(false);
    expect(result.issues).toEqual([]);
  });

  it.each([
    ['api', new Error('401 Unauthorized: invalid API key')],
    ['timeout', Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })],
    ['unknown', new Error('socket hang up')],
  ])('wraps SDK failures in a ReviewError (%s)', async (errorType, sdkError) => {
    fail(sdkError);

    const error = await provider()
      .review(DIFF, 'permissive', 1000)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ReviewError);
    expect((error as ReviewError).message).toContain(`${label} review failed`);
    expect((error as ReviewError).context).toMatchObject({
      provider: name,
      model: 'test-model',
      preset: 'permissive',
      errorType,
    });
  });
});

describe.each(CASES)('$label request timeout', ({ name, hang }) => {
  it('aborts the request when the preset timeout elapses', async () => {
    hang();

    const error = await createProvider(name, { apiKey: 'k', model: 'm' })
      .review(DIFF, 'strict', 20)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ReviewError);
    expect((error as ReviewError).context.errorType).toBe('timeout');
  });
});
