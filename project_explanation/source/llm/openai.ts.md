# openai.ts

## Purpose

The `openai.ts` file implements the OpenAI provider for PushGuard. It provides the `OpenAIProvider` class that implements the `LLMProvider` interface, handling communication with OpenAI's API to review code changes.

## Exports

### Classes
- **OpenAIProvider**: OpenAI LLM provider implementation

## OpenAIProvider Class

### Constructor

**Purpose**: Creates a new OpenAI provider instance.

**Parameters**:
- **config**: `ProviderConfig` - Configuration object with `apiKey` and `model`

**Behavior**:
- Initializes OpenAI client with API key
- Stores model name for use in API calls

**Fields**:
- **client**: `OpenAI` - OpenAI SDK client instance
- **model**: `string` - Model name to use

### Methods

#### review()

**Purpose**: Reviews a git diff using OpenAI's API.

**Parameters**:
- **diff**: `string` - Git diff to review
- **preset**: `AgentPreset` - Review preset (`'strict' | 'balanced' | 'permissive'`)
- **timeout**: `number` - Optional timeout in milliseconds (default: 30000)

**Returns**: `Promise<ReviewResult>` - Review results

**Behavior**:
1. Creates `AbortController` for timeout handling
2. Sets timeout using `setTimeout` to abort request
3. Loads preset-specific system prompt using `loadPrompt()`
4. Calls OpenAI API with:
   - Model name
   - System prompt (preset-specific)
   - User message containing diff (wrapped in code block)
   - `response_format: { type: 'json_object' }` (forces JSON response)
   - `temperature: 0.1` (low temperature for consistent results)
   - Abort signal for timeout
5. Extracts content from response
6. Parses JSON response using `parseResponse()`
7. Returns parsed result
8. Cleans up timeout on completion

**Error Handling**:
- **Timeout**: Detects `AbortError` or timeout message, wraps in `ReviewError` with `errorType: 'timeout'`
- **API Errors**: Detects 401/403 or "API" in message, wraps in `ReviewError` with `errorType: 'api'`
- **Other Errors**: Wraps in `ReviewError` with `errorType: 'unknown'`
- All errors include context (provider, model, preset, errorType, originalError)

**Timeout**: Uses `AbortController` to cancel request if timeout is exceeded.

### Private Methods

#### parseResponse()

**Purpose**: Parses OpenAI API response JSON into `ReviewResult`.

**Parameters**:
- **content**: `string` - JSON string from API response

**Returns**: `ReviewResult` - Parsed review result

**Behavior**:
1. Parses JSON string
2. Validates structure (must be object, not null)
3. Extracts `issues` array (defaults to empty array if not array)
4. Validates each issue:
   - Must be object
   - Must have `severity` field
   - Must have `message` field (string)
   - Optional `file` and `line` fields
5. Filters out invalid issues
6. Determines `hasIssues`:
   - `true` if `parsed.hasIssues === true` AND validated issues exist
   - `false` otherwise
7. Extracts `summary` if present and is string
8. Returns `ReviewResult` object

**Error Handling**:
- **Parse Errors**: Catches JSON parse errors, logs warning, returns `{ hasIssues: false, issues: [] }` (fail-open)
- **Invalid Structure**: Returns safe default result

**Fail-Open Design**: If parsing fails, assumes no issues (allows push to continue).

## API Configuration

### Request Format

```typescript
{
  model: string,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `\`\`\`diff\n${diff}\n\`\`\`` }
  ],
  response_format: { type: 'json_object' },
  temperature: 0.1
}
```

### Response Format

Expected JSON response:
```json
{
  "hasIssues": boolean,
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "message": "string",
      "file": "string (optional)",
      "line": number (optional)
    }
  ],
  "summary": "string (optional)"
}
```

## Dependencies

- `openai`: OpenAI SDK package
- `src/llm/index.ts`: For `LLMProvider`, `ReviewResult`, `AgentPreset` types
- `src/llm/factory.ts`: For `ProviderConfig` type
- `src/prompts/builder.ts`: For `loadPrompt()` function
- `src/utils/timeout.ts`: For `ReviewError` class

## Error Handling

All errors are wrapped in `ReviewError` with context:
- **provider**: `'openai'`
- **model**: Model name used
- **preset**: Preset used
- **errorType**: `'timeout' | 'api' | 'parse' | 'unknown'`
- **originalError**: Original error object

This allows callers to provide helpful error messages and hints.

## Usage

```typescript
import { OpenAIProvider } from './llm/openai.js';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

const result = await provider.review(diff, 'strict', 45000);
```

## Notes

- Uses `response_format: { type: 'json_object' }` to force JSON responses
- Low temperature (0.1) for consistent, deterministic results
- Timeout is enforced using `AbortController` for proper cancellation
- Fail-open design: parsing errors don't block pushes
