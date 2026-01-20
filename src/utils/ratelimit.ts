/**
 * Rate limiting utility for hook invocations
 */

import { loadState, saveState } from '../state.js';
import { MIN_REVIEW_INTERVAL_MS } from '../constants.js';

/**
 * Check if review can proceed based on rate limiting
 * @returns true if review can proceed, false if rate limited
 */
export function canProceedWithReview(): boolean {
  const state = loadState();
  
  if (!state?.lastReviewTime) {
    // No previous review, allow
    return true;
  }
  
  const timeSinceLastReview = Date.now() - state.lastReviewTime;
  
  if (timeSinceLastReview < MIN_REVIEW_INTERVAL_MS) {
    // Rate limited - too soon since last review
    return false;
  }
  
  return true;
}

/**
 * Record that a review has been completed
 */
export function recordReviewCompletion(): void {
  const state = loadState() || {};
  saveState({
    ...state,
    lastReviewTime: Date.now(),
  });
}

/**
 * Get time until next review can proceed (in milliseconds)
 * @returns 0 if review can proceed, otherwise milliseconds until next allowed review
 */
export function getTimeUntilNextReview(): number {
  const state = loadState();
  
  if (!state?.lastReviewTime) {
    return 0;
  }
  
  const timeSinceLastReview = Date.now() - state.lastReviewTime;
  const timeUntilNext = MIN_REVIEW_INTERVAL_MS - timeSinceLastReview;
  
  return Math.max(0, timeUntilNext);
}