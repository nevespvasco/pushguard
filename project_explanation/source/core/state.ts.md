# state.ts

## Purpose

The `state.ts` file manages temporary runtime state for PushGuard. It handles storing and retrieving temporary overrides (model and preset selections) that expire after 24 hours, as well as rate limiting information. The state is stored in `.pushguard/.state.json` (which is gitignored).

## Exports

### Types
- **State**: Interface defining the state structure

### Functions
- **cleanupExpiredState()**: Removes expired state files
- **loadState()**: Loads state from disk
- **saveState()**: Saves state to disk
- **clearState()**: Deletes state file

## State Interface

```typescript
interface State {
  overrideModel?: string;           // Temporary model override
  overridePreset?: 'strict' | 'balanced' | 'permissive';  // Temporary preset override
  expiresAt?: number;                // Timestamp when state expires (milliseconds)
  lastReviewTime?: number;           // Timestamp of last review (for rate limiting)
}
```

### Fields
- **overrideModel**: Optional string specifying a model to use instead of the config default
  - Set via `pushguard review --model <model>`
  - Overrides `config.model` when present
- **overridePreset**: Optional preset to use instead of the config default
  - Set via `pushguard review --preset <preset>`
  - Overrides `config.agent_preset` when present
- **expiresAt**: Optional timestamp (milliseconds since epoch) when state expires
  - Default expiration is 24 hours from creation
  - Expired state is automatically cleaned up
- **lastReviewTime**: Optional timestamp of the last review completion
  - Used for rate limiting in `src/utils/ratelimit.ts`
  - Updated after each review completes

## Functions

### cleanupExpiredState()

**Purpose**: Proactively removes expired state files.

**Parameters**: None

**Returns**: `void`

**Behavior**:
- Checks if state file exists
- Reads and parses the state
- If `expiresAt` is set and current time exceeds it, calls `clearState()`
- Handles errors gracefully (removes invalid state files)

**Usage**: Called at the start of `runHook()` in `src/hook.ts` to clean up expired state.

### loadState()

**Purpose**: Loads state from `.pushguard/.state.json`.

**Parameters**: None

**Returns**: `State | null`
- Returns the state object if valid and not expired
- Returns `null` if file doesn't exist, is invalid, or has expired

**Behavior**:
1. Gets the state file path (relative to git root)
2. Checks if file exists
3. Reads and parses JSON
4. Checks if state has expired (if `expiresAt` is set)
5. If expired, calls `clearState()` and returns `null`
6. Returns the state object if valid
7. On error, removes invalid file and returns `null`

**Error Handling**: 
- Invalid JSON: Removes file and returns `null`
- Expired state: Clears file and returns `null`
- File not found: Returns `null` (not an error)

**Usage**: Called in `src/hook.ts` to check for temporary overrides and in `src/utils/ratelimit.ts` to check last review time.

### saveState()

**Purpose**: Saves state to `.pushguard/.state.json`.

**Parameters**:
- **state**: `State` - The state object to save

**Returns**: `void`

**Behavior**:
1. Gets the state file path
2. Creates `.pushguard/` directory if it doesn't exist
3. Writes state as formatted JSON (2-space indent)
4. Creates directory recursively if needed

**Error Handling**: 
- Directory creation errors are ignored (directory might already exist)
- File write errors propagate (caller should handle)

**Usage**: 
- Called in `src/cli.ts` when setting temporary overrides via `pushguard review`
- Called in `src/utils/ratelimit.ts` to record review completion time

### clearState()

**Purpose**: Deletes the state file.

**Parameters**: None

**Returns**: `void`

**Behavior**:
- Gets the state file path
- Deletes the file if it exists
- No error if file doesn't exist

**Usage**: 
- Called when state expires
- Called after hook execution completes (success or failure)
- Called in `cleanupExpiredState()` when expired state is detected

## State File Location

The state file is located at `.pushguard/.state.json` relative to the git repository root. The path is determined by:
1. Finding the git root using `getGitRoot()` from `src/utils/git.ts`
2. Appending `.pushguard/.state.json`

If not in a git repository, falls back to `process.cwd()/.pushguard/.state.json`.

## State Lifecycle

1. **Creation**: State is created when user runs `pushguard review --model X --preset Y`
2. **Usage**: State is read during hook execution to apply overrides
3. **Expiration**: State expires after 24 hours (checked on load)
4. **Cleanup**: Expired state is automatically removed
5. **Deletion**: State is cleared after hook execution completes

## Security Considerations

- State file is gitignored (contains user-specific runtime data)
- State expires automatically (prevents stale overrides)
- Invalid state files are removed (prevents corruption issues)
- File path is validated (uses git root, prevents path traversal)

## Dependencies

- `fs` (Node.js): For file system operations
- `path` (Node.js): For path manipulation
- `src/utils/git.ts`: For getting git root directory

## Usage Examples

### Setting a temporary override
```typescript
import { saveState } from './state.js';
import { STATE_EXPIRATION_MS } from './constants.js';

saveState({
  overrideModel: 'o1-preview',
  overridePreset: 'strict',
  expiresAt: Date.now() + STATE_EXPIRATION_MS,
});
```

### Loading state
```typescript
import { loadState } from './state.js';

const state = loadState();
if (state?.overrideModel) {
  // Use override model
}
```

### Clearing state
```typescript
import { clearState } from './state.js';

clearState(); // Remove state file
```
