# hook.ts

## Purpose

The `hook.ts` file contains the core logic for executing the pre-push hook. It orchestrates the entire review process: loading configuration, getting git diffs, calling LLM providers, and handling results. This is the main entry point when the git pre-push hook is triggered.

## Exports

### Functions
- **runHook()**: Main hook execution function (async)

## Main Function

### runHook()

**Purpose**: Executes the complete pre-push hook workflow.

**Parameters**: None

**Returns**: `Promise<void>`

**Behavior**:
1. **Cleanup**: Calls `cleanupExpiredState()` to remove expired state
2. **Silent Mode**: Forces silent mode in non-TTY/CI environments
3. **Interactive Check**: Checks if interactive mode is allowed (TTY + env var)
4. **Rate Limiting**: Checks if review can proceed (minimum 5 seconds between reviews)
5. **Load Config**: Loads configuration from `.pushguard/config.yml`
6. **Load State**: Loads temporary state (overrides)
7. **Determine Model**: Resolves which model to use (override, interactive, or config default)
8. **Determine Preset**: Resolves which preset to use (override or config default)
9. **Model Warning**: Warns if model is unknown (not in known models list)
10. **Get Diff**: Extracts git diff for review
11. **Perform Review**: Calls LLM provider to review the diff
12. **Handle Result**: Displays results and exits with appropriate code

**Exit Codes**:
- `0`: Success (no issues found or rate limited)
- `1`: Issues found (push blocked)

**Error Handling**: 
- Fail-open design: If review fails, allows push to continue with warning
- Rate limiting: Allows push if too soon since last review
- Missing diff: Allows push if diff can't be obtained
- API errors: Allows push with warning message

## Helper Functions

### determineModel()

**Purpose**: Determines which model to use for the review.

**Parameters**:
- **config**: `Config` - Current configuration
- **state**: `State | null` - Temporary state (may be null)
- **canBeInteractive**: `boolean` - Whether interactive mode is allowed

**Returns**: `Promise<string>` - Model name to use

**Behavior**:
1. Checks if state has expired (clears if expired)
2. If state has `overrideModel`, returns it
3. If interactive mode is allowed:
   - Shows prompt with model choices:
     - Default model from config
     - Model presets from config (if any)
     - Custom model option
   - Returns selected model
4. Otherwise, returns config default model

**Usage**: Called in `runHook()` to resolve model selection.

### getReviewDiff()

**Purpose**: Gets the git diff to review, with size limits applied.

**Parameters**: None

**Returns**: `Promise<string>` - Git diff string

**Behavior**:
1. Calls `getDiff()` from `src/utils/git.ts`
2. Checks if diff exceeds `MAX_DIFF_CHARS` (100KB)
3. If too large, truncates and appends truncation notice
4. If diff is empty, logs message and exits with code 0
5. Returns the diff (possibly truncated)

**Error Handling**:
- Git errors: Logs warning and exits with code 0 (fail-open)
- Empty diff: Exits with code 0 (nothing to review)

**Usage**: Called in `runHook()` to get code changes for review.

### performReview()

**Purpose**: Calls the LLM provider to review the diff.

**Parameters**:
- **diff**: `string` - Git diff to review
- **model**: `string` - Model name to use
- **preset**: `AgentPreset` - Review preset
- **provider**: `Provider` - LLM provider

**Returns**: `Promise<ReviewResult>` - Review results

**Behavior**:
1. Gets API key environment variable name for provider
2. Checks if API key is set (throws error if missing)
3. Creates LLM provider instance using factory
4. Gets timeout for preset
5. Calls `llmProvider.review()` with diff, preset, and timeout
6. Returns review result

**Error Handling**:
- Missing API key: Throws error with helpful message
- Review errors: Catches and wraps in fail-open behavior
  - Logs warning with provider/model context
  - Provides hints based on error type (timeout vs API error)
  - Returns `{ hasIssues: false, issues: [] }` to allow push

**Usage**: Called in `runHook()` to perform the actual AI review.

### formatIssue()

**Purpose**: Formats an issue for display in the console.

**Parameters**:
- **issue**: `Issue` - Issue object to format

**Returns**: `string` - Formatted issue string

**Behavior**:
1. Determines color based on severity:
   - `error`: Red
   - `warning`: Yellow
   - `info`: Blue
2. Creates severity prefix with color
3. Adds file location if available (gray color)
4. Combines prefix, location, and message

**Format**: `[SEVERITY] file:line message`

**Usage**: Called in `handleReviewResult()` to format each issue.

### handleReviewResult()

**Purpose**: Processes review results and exits with appropriate code.

**Parameters**:
- **result**: `ReviewResult` - Review results from LLM

**Returns**: `void` (exits process)

**Behavior**:
1. Displays summary if present and not in silent mode
2. Records review completion for rate limiting
3. If no issues:
   - Logs success message
   - Clears state
   - Exits with code 0
4. If issues found:
   - Displays "Issues found:" header (red, bold)
   - Formats and displays each issue
   - Shows push blocked message with bypass hint
   - Clears state
   - Exits with code 1

**Exit Codes**:
- `0`: No issues (push allowed)
- `1`: Issues found (push blocked)

**Usage**: Called in `runHook()` as the final step.

## Flow Diagram

```
runHook()
  ├─> cleanupExpiredState()
  ├─> forceSilentMode()
  ├─> Check rate limiting
  ├─> loadConfig()
  ├─> loadState()
  ├─> determineModel()
  │    ├─> Check state override
  │    ├─> Interactive prompt (if allowed)
  │    └─> Return model
  ├─> getReviewDiff()
  │    ├─> getDiff()
  │    ├─> Truncate if too large
  │    └─> Return diff
  ├─> performReview()
  │    ├─> Get API key
  │    ├─> Create provider
  │    ├─> Call review()
  │    └─> Return result
  └─> handleReviewResult()
       ├─> Display results
       ├─> Record completion
       └─> Exit with code
```

## Dependencies

- `src/config.ts`: Configuration loading
- `src/state.ts`: State management
- `src/utils/tty.ts`: TTY/CI detection
- `src/utils/logger.ts`: Logging
- `src/utils/git.ts`: Git operations
- `src/llm/factory.ts`: Provider creation
- `src/prompts/builder.ts`: Timeout utilities
- `src/llm/index.ts`: Type definitions
- `src/constants.ts`: Constants (MAX_DIFF_CHARS)
- `src/utils/ratelimit.ts`: Rate limiting
- `chalk`: Terminal colors
- `inquirer`: Interactive prompts

## Error Handling Strategy

PushGuard uses a **fail-open** design:
- If review fails (timeout, API error, etc.), the push is allowed with a warning
- This prevents blocking workflows when services are unavailable
- Users can still bypass with `git push --no-verify` if needed

## Rate Limiting

Reviews are rate-limited to prevent excessive API calls:
- Minimum 5 seconds between reviews
- If rate limited, push is allowed (with warning)
- Rate limit is tracked in state file

## Interactive Mode

Interactive mode allows model selection during hook execution:
- Enabled via `PUSHGUARD_INTERACTIVE=1` environment variable
- Only works in TTY environments (not CI)
- Shows model selection prompt
- Useful for one-off model selection without setting override

## Usage

This function is called by:
- Git pre-push hook (via `pushguard hook` command)
- Can be called directly for testing

The hook is triggered automatically when `git push` is executed (if hook is installed).
