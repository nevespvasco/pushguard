# timeout.ts

## Purpose

The `timeout.ts` file provides timeout utilities and a custom error class for handling timeouts in LLM API calls. It includes a `ReviewError` class for structured error handling and a `withTimeout()` function for wrapping promises with timeouts.

## Exports

### Classes
- **ReviewError**: Custom error class for review failures

### Functions
- **withTimeout()**: Wraps a promise with a timeout

## ReviewError Class

### Purpose

Custom error class that extends `Error` and includes context about the review failure (provider, model, preset, error type, original error).

### Constructor

**Parameters**:
- **message**: `string` - Error message
- **context**: Object with:
  - **provider**: `string` - LLM provider name
  - **model**: `string` - Model name used
  - **preset**: `string` - Review preset used
  - **errorType**: `'timeout' | 'api' | 'parse' | 'unknown'` - Type of error
  - **originalError**: `unknown` (optional) - Original error object

**Behavior**:
- Calls `super(message)` to set error message
- Sets `name` to `'ReviewError'`
- Stores context object
- Maintains stack trace (if `Error.captureStackTrace` is available)

### Properties

- **context**: Readonly object containing error context
  - **provider**: Provider that failed
  - **model**: Model that was used
  - **preset**: Preset that was used
  - **errorType**: Type of error (timeout, API, parse, unknown)
  - **originalError**: Original error (if any)

### Error Types

- **timeout**: Request timed out
- **api**: API error (401, 403, etc.)
- **parse**: Response parsing error
- **unknown**: Other errors

### Usage

Used by LLM providers to wrap errors with context:

```typescript
throw new ReviewError(
  'OpenAI review failed: Timeout',
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    preset: 'strict',
    errorType: 'timeout',
    originalError: error,
  }
);
```

## Functions

### withTimeout()

**Purpose**: Wraps a promise with a timeout, rejecting if the timeout is exceeded.

**Parameters**:
- **promise**: `Promise<T>` - Promise to wrap
- **timeoutMs**: `number` - Timeout in milliseconds
- **errorMessage**: `string` (optional) - Custom error message (default: `'Operation timed out'`)

**Returns**: `Promise<T>` - Promise that rejects on timeout

**Behavior**:
1. Creates `AbortController` for cancellation
2. Sets timeout using `setTimeout` to abort after `timeoutMs`
3. Races the original promise against a timeout promise
4. If timeout wins, rejects with error message
5. If original promise wins, resolves with its value
6. Cleans up timeout on completion

**Error Handling**:
- Timeout: Rejects with error message
- Original promise rejection: Propagates rejection

**Usage**: Can be used to add timeouts to any promise (though LLM providers use `AbortController` directly).

## Dependencies

This file has no external dependencies - it only uses JavaScript built-ins.

## Design Decisions

- **AbortController**: Uses modern `AbortController` API for cancellation
- **Custom Error**: `ReviewError` provides structured error information
- **Error Context**: Includes provider/model/preset for better error messages
- **Stack Traces**: Maintains stack traces for debugging

## Usage Examples

### Throwing ReviewError
```typescript
import { ReviewError } from './utils/timeout.js';

throw new ReviewError(
  'API request failed',
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    preset: 'strict',
    errorType: 'api',
    originalError: error,
  }
);
```

### Using withTimeout
```typescript
import { withTimeout } from './utils/timeout.js';

const result = await withTimeout(
  someAsyncOperation(),
  5000,
  'Operation timed out after 5 seconds'
);
```

## Notes

- `ReviewError` is used extensively by LLM providers
- `withTimeout()` is provided but not currently used (providers use `AbortController` directly)
- Error context helps provide helpful error messages to users
