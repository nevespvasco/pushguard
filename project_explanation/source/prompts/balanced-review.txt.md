# balanced-review.txt

## Purpose

The `balanced-review.txt` file contains the system prompt template used for balanced code reviews. This prompt instructs the AI to focus on bugs and security issues while ignoring style, formatting, and minor code quality concerns.

## Content

The prompt instructs the AI to:
1. Act as a code reviewer focused on bugs and security
2. Review the git diff
3. Identify:
   - Security vulnerabilities
   - Logic errors and bugs
   - Critical performance issues
4. Ignore style, formatting, and minor code quality concerns
5. Respond in JSON format

## Expected Response Format

The prompt specifies the JSON structure:

```json
{
  "hasIssues": boolean,
  "issues": [
    {
      "severity": "error" | "warning",
      "message": "...",
      "file": "...",
      "line": N
    }
  ],
  "summary": "..."
}
```

## Severity Guidelines

The balanced preset uses:
- **"error"**: Critical issues
- **"warning"**: Important but not critical issues
- **"info"**: Not used in balanced preset (focuses on errors and warnings)

## Review Scope

The balanced preset focuses on:
- **Security**: Security vulnerabilities
- **Bugs**: Logic errors and bugs
- **Performance**: Critical performance issues only
- **Ignores**: Style, formatting, minor code quality

## Usage

This prompt is loaded by `src/prompts/builder.ts` when `loadPrompt('balanced')` is called. It's used as the system prompt in LLM API calls when the `'balanced'` preset is selected.

## Differences from Other Presets

- **More focused than strict**: Ignores style and minor quality issues
- **More thorough than permissive**: Includes performance issues and warnings
- **Middle ground**: Balances thoroughness with noise reduction

## Notes

- Focuses on actionable issues (bugs and security)
- Ignores stylistic concerns
- Still flags critical performance problems
- Provides a good balance for most teams
