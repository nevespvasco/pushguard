# gemini.ts

## Purpose

The `gemini.ts` file implements the Google Gemini provider for PushGuard. It provides the `GeminiProvider` class that implements the `LLMProvider` interface, handling communication with Google's Gemini API to review code changes.

## Exports

### Classes
- **GeminiProvider**: Gemini LLM provider implementation

## GeminiProvider Class

### Constructor

**Purpose**: Creates a new Gemini provider instance.

**Parameters**:
- **config**: `ProviderConfig` - Configuration object with `apiKey` and `model`

**Behavior**:
- Initializes Gemini client with API key
- Stores model name for use in API calls

**Fields**:
- **client**: `GoogleGenAI` - Gemini SDK client instance
- **model**: `string` - Model name to use

### Methods

#### review()

**Purpose**: Reviews a git diff using Gemini's API.

**Parameters**:
- **diff**: `string` - Git diff to review
- **preset**: `AgentPreset` - Review preset (`'strict' | 'balanced' | 'permissive'`)
- **timeout**: `number` - Optional timeout in milliseconds (default: 30000)

**Returns**: `Promise<ReviewResult>` - Review results

**Behavior**:
1. Creates `AbortController` for timeout handling
2. Sets timeout using `setTimeout` to abort request
3. Loads preset-specific system prompt using `loadPrompt()`
4. Formats user message with diff (wrapped in code block)
5. Calls Gemini API with:
   - Model name
   - Contents (user message)
   - Config object:
     - `systemInstruction`: System prompt (preset-specific)
     - `responseMimeType: 'application/json'` (forces JSON response)
     - `temperature: 0.1` (low temperature for consistent results)
   - Abort signal for timeout
6. Extracts text from response (directly available as `response.text`)
7. Parses JSON response using `parseResponse()`
8. Returns parsed result
9. Cleans up timeout on completion

**Error Handling**:
- **Timeout**: Detects `AbortError` or timeout message, wraps in `ReviewError` with `errorType: 'timeout'`
- **API Errors**: Detects 401/403 or "API" in message, wraps in `ReviewError` with `errorType: 'api'`
- **Other Errors**: Wraps in `ReviewError` with `errorType: 'unknown'`
- All errors include context (provider, model, preset, errorType, originalError)

**Timeout**: Uses `AbortController` to cancel request if timeout is exceeded.

### Private Methods

#### parseResponse()

**Purpose**: Parses Gemini API response JSON into `ReviewResult`.

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
  contents: userMessage,
  config: {
    systemInstruction: systemPrompt,
    responseMimeType: 'application/json',
    temperature: 0.1
  }
}
```

### Response Format

Gemini returns text directly via `response.text` property. Expected JSON response:
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

## Differences from Other Providers

1. **System Instruction**: Gemini uses `systemInstruction` in config, not separate system message
2. **Response Format**: Gemini returns text directly via `response.text` (simpler than Anthropic's blocks)
3. **JSON Mode**: Uses `responseMimeType: 'application/json'` (similar to OpenAI's `response_format`)
4. **API Structure**: Uses `models.generateContent()` method with config object

## Dependencies

- `@google/genai`: Google Gemini SDK package
- `src/llm/index.ts`: For `LLMProvider`, `ReviewResult`, `AgentPreset` types
- `src/llm/factory.ts`: For `ProviderConfig` type
- `src/prompts/builder.ts`: For `loadPrompt()` function
- `src/utils/timeout.ts`: For `ReviewError` class

## Error Handling

All errors are wrapped in `ReviewError` with context:
- **provider**: `'gemini'`
- **model**: Model name used
- **preset**: Preset used
- **errorType**: `'timeout' | 'api' | 'parse' | 'unknown'`
- **originalError**: Original error object

This allows callers to provide helpful error messages and hints.

## Usage

```typescript
import { GeminiProvider } from './llm/gemini.js';

const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-1.5-pro',
});

const result = await provider.review(diff, 'strict', 45000);
```

## Notes

- Uses `responseMimeType: 'application/json'` to force JSON responses
- Low temperature (0.1) for consistent, deterministic results
- System instruction is passed in config (Gemini-specific)
- Response text is directly available (simpler than Anthropic)
- Timeout is enforced using `AbortController` for proper cancellation
- Fail-open design: parsing errors don't block pushes
