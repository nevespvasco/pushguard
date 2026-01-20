# constants.ts

## Purpose

The `constants.ts` file defines application-wide constants used throughout the PushGuard codebase. These constants control limits, timeouts, and other configuration values that affect the behavior of the application.

## Exports

All constants are exported and can be imported by other modules.

## Constants

### Diff Limits
- **MAX_DIFF_CHARS**: `100000` (100,000 characters)
  - Maximum size of git diff to process
  - Roughly equivalent to ~25,000 tokens (estimated at 4 characters per token)
  - Diffs larger than this are truncated to prevent API limits and excessive costs
  - Used in `src/hook.ts` when processing diffs

### State Management
- **STATE_EXPIRATION_MS**: `24 * 60 * 60 * 1000` (86,400,000 milliseconds = 24 hours)
  - Time-to-live for temporary state overrides
  - State files (`.pushguard/.state.json`) expire after 24 hours
  - Used in `src/state.ts` to check if state has expired
  - Allows temporary model/preset overrides to automatically expire

### Config File Limits
- **MAX_CONFIG_SIZE**: `100 * 1024` (102,400 bytes = 100 KB)
  - Maximum size for configuration files
  - Prevents memory exhaustion from maliciously large config files
  - Used in `src/config.ts` when reading config files
  - Throws error if config file exceeds this limit

### Timeout Values per Preset
- **PRESET_TIMEOUTS**: Object with timeout values in milliseconds
  - **strict**: `45000` (45 seconds)
    - Longest timeout for thorough analysis
    - Allows complex code reviews to complete
  - **balanced**: `30000` (30 seconds)
    - Medium timeout for balanced reviews
  - **permissive**: `15000` (15 seconds)
    - Shortest timeout for quick reviews
    - Faster feedback for permissive mode
  - Used in `src/prompts/builder.ts` via `getTimeoutForPreset()`
  - Applied when calling LLM providers in `src/hook.ts`

### Rate Limiting
- **MIN_REVIEW_INTERVAL_MS**: `5000` (5 seconds)
  - Minimum time between reviews
  - Prevents excessive API calls and rate limiting
  - Used in `src/utils/ratelimit.ts` to enforce rate limits
  - If a review is attempted within 5 seconds of the last one, it's blocked

### Git Operation Limits
- **MAX_GIT_BUFFER_SIZE**: `10 * 1024 * 1024` (10,485,760 bytes = 10 MB)
  - Maximum buffer size for git command output
  - Prevents memory issues from extremely large git diffs
  - Used in `src/utils/git.ts` when executing git commands
  - Applied to `spawnSync` maxBuffer option

## Usage

These constants are imported throughout the codebase:

```typescript
import { MAX_DIFF_CHARS, STATE_EXPIRATION_MS } from './constants.js';
```

## Design Decisions

- **Diff truncation**: 100KB limit balances thoroughness with API costs
- **State expiration**: 24 hours prevents stale overrides from persisting indefinitely
- **Config size limit**: 100KB prevents DoS attacks via large config files
- **Preset timeouts**: Vary by preset to match expected review complexity
- **Rate limiting**: 5 seconds prevents accidental rapid-fire reviews
- **Git buffer**: 10MB handles most real-world diffs while preventing memory issues

## Dependencies

This file has no dependencies - it's a pure constants file.
