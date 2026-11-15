import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { makeTempRepo } from './helpers.js';
import { loadState, saveState, clearState, cleanupExpiredState } from '../src/state.js';
import {
  canProceedWithReview,
  getTimeUntilNextReview,
  recordReviewCompletion,
} from '../src/utils/ratelimit.js';
import { MIN_REVIEW_INTERVAL_MS } from '../src/constants.js';

const git = vi.hoisted(() => ({ root: '' }));

vi.mock('../src/utils/git.js', () => ({
  getGitRoot: () => git.root,
}));

describe('temporary state', () => {
  let cleanup: () => void;
  let statePath: string;

  beforeEach(() => {
    const repo = makeTempRepo();
    git.root = repo.root;
    cleanup = repo.cleanup;
    statePath = join(repo.root, '.pushguard', '.state.json');
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('round-trips a saved override', () => {
    const state = { overrideModel: 'gpt-4o', overridePreset: 'balanced' as const, expiresAt: Date.now() + 1000 };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('returns null when there is no state file', () => {
    expect(loadState()).toBeNull();
  });

  it('discards and deletes an expired override', () => {
    saveState({ overrideModel: 'gpt-4o', expiresAt: Date.now() - 1 });
    expect(loadState()).toBeNull();
    expect(existsSync(statePath)).toBe(false);
  });

  it('removes a corrupt state file instead of crashing', () => {
    mkdirSync(join(git.root, '.pushguard'), { recursive: true });
    writeFileSync(statePath, '{not json');
    expect(loadState()).toBeNull();
    expect(existsSync(statePath)).toBe(false);
  });

  it('cleanupExpiredState keeps live state and removes expired state', () => {
    saveState({ overrideModel: 'gpt-4o', expiresAt: Date.now() + 60_000 });
    cleanupExpiredState();
    expect(existsSync(statePath)).toBe(true);

    saveState({ overrideModel: 'gpt-4o', expiresAt: Date.now() - 1 });
    cleanupExpiredState();
    expect(existsSync(statePath)).toBe(false);
  });

  it('clearState is a no-op when nothing is stored', () => {
    expect(() => clearState()).not.toThrow();
  });

  describe('rate limiting', () => {
    it('allows the first review', () => {
      expect(canProceedWithReview()).toBe(true);
      expect(getTimeUntilNextReview()).toBe(0);
    });

    it('blocks a second review inside the minimum interval, then allows it', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

      recordReviewCompletion();
      expect(canProceedWithReview()).toBe(false);
      expect(getTimeUntilNextReview()).toBe(MIN_REVIEW_INTERVAL_MS);

      vi.advanceTimersByTime(MIN_REVIEW_INTERVAL_MS);
      expect(canProceedWithReview()).toBe(true);
      expect(getTimeUntilNextReview()).toBe(0);
    });

    it('keeps existing overrides when recording a review', () => {
      saveState({ overrideModel: 'gpt-4o', expiresAt: Date.now() + 60_000 });
      recordReviewCompletion();
      expect(loadState()).toMatchObject({ overrideModel: 'gpt-4o', lastReviewTime: expect.any(Number) });
    });
  });
});
