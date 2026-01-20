# ratelimit.ts

## Purpose

The `ratelimit.ts` file provides rate limiting utilities to prevent excessive API calls. It enforces a minimum interval between reviews (5 seconds) to avoid hitting API rate limits and to prevent accidental rapid-fire reviews.

## Exports

### Functions
- **canProceedWithReview()**: Checks if a review can proceed based on rate limiting
- **recordReviewCompletion()**: Records that a review has been completed
- **getTimeUntilNextReview()**: Gets the time until the next review can proceed

## Functions

### canProceedWithReview()

**Purpose**: Checks if a review can proceed based on rate limiting rules.

**Parameters**: None

**Returns**: `boolean` - `true` if review can proceed, `false` if rate limited

**Behavior**:
1. Loads state from `.pushguard/.state.json`
2. If no `lastReviewTime` in state, returns `true` (no previous review)
3. Calculates time since last review
4. If time since last review is less than `MIN_REVIEW_INTERVAL_MS` (5 seconds), returns `false` (rate limited)
5. Otherwise, returns `true` (can proceed)

**Usage**: Called at the start of `runHook()` in `src/hook.ts` to check if review should proceed.

**Rate Limit**: Minimum 5 seconds between reviews (defined in `src/constants.ts`).

### recordReviewCompletion()

**Purpose**: Records that a review has been completed, updating the last review time.

**Parameters**: None

**Returns**: `void`

**Behavior**:
1. Loads current state (or creates empty object if none)
2. Updates state with `lastReviewTime: Date.now()`
3. Saves state to `.pushguard/.state.json`
4. Preserves other state fields (overrides, expiration, etc.)

**Usage**: Called in `handleReviewResult()` in `src/hook.ts` after review completes (regardless of success/failure).

### getTimeUntilNextReview()

**Purpose**: Calculates how long to wait until the next review can proceed.

**Parameters**: None

**Returns**: `number` - Milliseconds until next review (0 if can proceed now)

**Behavior**:
1. Loads state from `.pushguard/.state.json`
2. If no `lastReviewTime` in state, returns `0` (can proceed now)
3. Calculates time since last review
4. Calculates time until next allowed review: `MIN_REVIEW_INTERVAL_MS - timeSinceLastReview`
5. Returns `Math.max(0, timeUntilNext)` (never negative)

**Usage**: Called in `src/hook.ts` to display wait time when rate limited.

## Rate Limiting Strategy

- **Minimum Interval**: 5 seconds between reviews
- **Fail-Open**: If rate limited, push is allowed (not blocked)
- **Warning**: User is warned about rate limit and wait time
- **State-Based**: Rate limit is tracked in state file (persists across processes)

## Dependencies

- `src/state.ts`: For loading and saving state
- `src/constants.ts`: For `MIN_REVIEW_INTERVAL_MS` constant

## Usage Examples

### Checking if can proceed
```typescript
import { canProceedWithReview } from './utils/ratelimit.js';

if (!canProceedWithReview()) {
  const waitTime = getTimeUntilNextReview();
  console.log(`Wait ${waitTime}ms before next review`);
}
```

### Recording completion
```typescript
import { recordReviewCompletion } from './utils/ratelimit.js';

// After review completes
recordReviewCompletion();
```

### Getting wait time
```typescript
import { getTimeUntilNextReview } from './utils/ratelimit.js';

const waitMs = getTimeUntilNextReview();
const waitSeconds = Math.ceil(waitMs / 1000);
console.log(`Wait ${waitSeconds} seconds`);
```

## Design Decisions

- **Fail-Open**: Rate limiting doesn't block pushes (allows with warning)
- **State Persistence**: Rate limit tracked in state file (works across git commands)
- **Minimum Interval**: 5 seconds prevents accidental rapid reviews
- **User-Friendly**: Shows wait time in seconds for better UX

## Notes

- Rate limit is per-repository (state file is in `.pushguard/`)
- Rate limit applies to all reviews (not per-branch)
- State file persists across git operations
- Rate limit is checked before API calls (saves API quota)
