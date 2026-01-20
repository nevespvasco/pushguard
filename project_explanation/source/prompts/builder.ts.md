# builder.ts

## Purpose

The `builder.ts` file provides utilities for loading prompt templates and getting timeout values for different review presets. It handles reading prompt files from disk and caching them in memory for performance.

## Exports

### Functions
- **loadPrompt()**: Loads a prompt template for a preset
- **getTimeoutForPreset()**: Gets the timeout value for a preset

## Functions

### loadPrompt()

**Purpose**: Loads a preset-specific prompt template from disk, with in-memory caching.

**Parameters**:
- **preset**: `AgentPreset` - Review preset (`'strict' | 'balanced' | 'permissive'`)

**Returns**: `string` - Prompt template content

**Behavior**:
1. Checks in-memory cache for the preset
2. If cached, returns cached prompt immediately
3. If not cached:
   - Determines file path based on preset
   - Reads prompt file from disk
   - Trims whitespace
   - Caches the prompt in memory
   - Returns the prompt
4. Subsequent calls for the same preset return cached version

**File Mapping**:
- `'strict'` → `strict-review.txt`
- `'balanced'` → `balanced-review.txt`
- `'permissive'` → `permissive-review.txt`

**Caching**: Prompts are cached in memory to avoid repeated file reads. This improves performance since prompts are loaded on every review.

**Error Handling**: File read errors propagate (caller should handle).

**Usage**: Called by LLM providers to get the system prompt for their API calls.

### getTimeoutForPreset()

**Purpose**: Gets the timeout value (in milliseconds) for a review preset.

**Parameters**:
- **preset**: `AgentPreset` - Review preset

**Returns**: `number` - Timeout in milliseconds

**Behavior**:
- Returns the timeout value from `PRESET_TIMEOUTS` constant in `src/constants.ts`
- Timeout values:
  - `'strict'`: 45000 ms (45 seconds)
  - `'balanced'`: 30000 ms (30 seconds)
  - `'permissive'`: 15000 ms (15 seconds)

**Usage**: Called in `src/hook.ts` to determine timeout for LLM API calls.

## File Path Resolution

Prompt files are located in the same directory as `builder.ts`:
- `src/prompts/strict-review.txt`
- `src/prompts/balanced-review.txt`
- `src/prompts/permissive-review.txt`

The file path is resolved using:
- `fileURLToPath(import.meta.url)` to get current file path
- `dirname()` to get directory
- `join()` to construct file path

## Caching Strategy

Prompts are cached in a module-level object:
```typescript
const promptCache: Partial<Record<AgentPreset, string>> = {};
```

**Benefits**:
- Avoids repeated file system reads
- Improves performance (prompts loaded on every review)
- Memory footprint is small (prompts are text files)

**Cache Lifetime**: Cached for the lifetime of the Node.js process (cleared on restart).

## Dependencies

- `fs` (Node.js): For reading files
- `path` (Node.js): For path manipulation
- `url` (Node.js): For file URL resolution
- `src/llm/index.ts`: For `AgentPreset` type
- `src/constants.ts`: For `PRESET_TIMEOUTS` constant

## Usage Examples

### Loading a prompt
```typescript
import { loadPrompt } from './prompts/builder.js';

const prompt = loadPrompt('strict');
// Returns prompt content from strict-review.txt
```

### Getting timeout
```typescript
import { getTimeoutForPreset } from './prompts/builder.js';

const timeout = getTimeoutForPreset('balanced');
// Returns 30000 (30 seconds)
```

## Notes

- Prompts are loaded synchronously (blocking I/O)
- Caching ensures this only happens once per preset per process
- Prompt files must exist in `src/prompts/` directory
- Prompt content is trimmed of leading/trailing whitespace
