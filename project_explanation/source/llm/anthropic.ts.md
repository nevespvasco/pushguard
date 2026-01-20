# anthropic.ts

## Purpose

The `anthropic.ts` file implements the Anthropic provider for PushGuard. It provides the `AnthropicProvider` class that implements the `LLMProvider` interface, handling communication with Anthropic's Claude API to review code changes.

## Exports

### Classes
- **AnthropicProvider**: Anthropic LLM provider implementation

## AnthropicProvider Class

### Constructor

**Purpose**: Creates a new Anthropic provider instance.

**Parameters**:
- **config**: `ProviderConfig` - Configuration object with `apiKey` and `model`

**Behavior**:
- Initializes Anthropic client with API key
- Stores model name for use in API calls

**Fields**:
- **client**: `Anthropic` - Anthropic SDK client instance
- **model**: `string` - Model name to use

### Methods

#### review()

**Purpose**: Reviews a git diff using Anthropic's API.

**Parameters**:
- **diff**: `string` - Git diff to review
- **preset**: `AgentPreset` - Review preset (`'strict' | 'balanced' | 'permissive'`)
- **timeout**: `number` - Optional timeout in milliseconds (default: 30000)

**Returns**: `Promise<ReviewResult>` - Review results

**Behavior**:
1. Creates `AbortController` for timeout handling
2. Sets timeout using `setTimeout` to abort request
3. Loads preset-specific system prompt using `loadPrompt()`
4. Calls Anthropic API with:
   - Model name
   - System prompt (preset-specific)
   - Messages array with user message containing diff (wrapped in code block)
   - `max_tokens: 4096` (response length limit)
   - Abort signal for timeout
5. Extracts text from response:
   - Filters content blocks to text type
   - Extracts text from each `TextBlock`
   - Joins text blocks
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

**Purpose**: Parses Anthropic API response JSON into `ReviewResult`.

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
  max_tokens: 4096,
  system: systemPrompt,
  messages: [
    { role: 'user', content: `\`\`\`diff\n${diff}\n\`\`\`` }
  ]
}
```

### Response Format

Anthropic returns content as an array of content blocks. The implementation:
1. Filters for text blocks
2. Extracts text from each block
3. Joins all text
4. Parses as JSON

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

## Differences from OpenAI

1. **System Prompt**: Anthropic uses `system` parameter instead of system message in messages array
2. **Response Format**: Anthropic returns content blocks array, not direct text
3. **Max Tokens**: Explicitly set to 4096 (OpenAI handles this differently)
4. **JSON Mode**: Anthropic doesn't have explicit JSON mode like OpenAI's `response_format`

## Dependencies

- `@anthropic-ai/sdk`: Anthropic SDK package
- `src/llm/index.ts`: For `LLMProvider`, `ReviewResult`, `AgentPreset` types
- `src/llm/factory.ts`: For `ProviderConfig` type
- `src/prompts/builder.ts`: For `loadPrompt()` function
- `src/utils/timeout.ts`: For `ReviewError` class

## Error Handling

All errors are wrapped in `ReviewError` with context:
- **provider**: `'anthropic'`
- **model**: Model name used
- **preset**: Preset used
- **errorType**: `'timeout' | 'api' | 'parse' | 'unknown'`
- **originalError**: Original error object

This allows callers to provide helpful error messages and hints.

## Usage

```typescript
import { AnthropicProvider } from './llm/anthropic.js';

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022',
});

const result = await provider.review(diff, 'strict', 45000);
```

## Notes

- Uses `max_tokens: 4096` to limit response length
- System prompt is passed as `system` parameter (Anthropic-specific)
- Response extraction handles content blocks array
- Timeout is enforced using `AbortController` for proper cancellation
- Fail-open design: parsing errors don't block pushes
