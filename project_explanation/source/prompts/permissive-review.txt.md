# permissive-review.txt

## Purpose

The `permissive-review.txt` file contains the system prompt template used for permissive code reviews. This prompt instructs the AI to only flag critical bugs and security vulnerabilities that could be exploited or cause crashes/data loss.

## Content

The prompt instructs the AI to:
1. Review the git diff for critical issues only
2. Identify:
   - Security vulnerabilities that could be exploited
   - Bugs that would cause crashes or data loss
3. Ignore everything else (style, performance, code quality)
4. Respond in JSON format

## Expected Response Format

The prompt specifies the JSON structure:

```json
{
  "hasIssues": boolean,
  "issues": [
    {
      "severity": "error",
      "message": "...",
      "file": "...",
      "line": N
    }
  ],
  "summary": "..."
}
```

## Severity Guidelines

The permissive preset uses:
- **"error"**: Only critical issues (exploitable security, crashes, data loss)
- **"warning"**: Not used (only errors)
- **"info"**: Not used (only errors)

## Review Scope

The permissive preset is the most minimal:
- **Security**: Only exploitable vulnerabilities
- **Bugs**: Only crashes or data loss
- **Ignores**: Style, performance, code quality, minor bugs, warnings

## Usage

This prompt is loaded by `src/prompts/builder.ts` when `loadPrompt('permissive')` is called. It's used as the system prompt in LLM API calls when the `'permissive'` preset is selected.

## Differences from Other Presets

- **Most minimal**: Only flags critical issues
- **Fastest**: Shortest timeout (15 seconds)
- **Least noise**: Ignores most issues
- **Critical only**: Focuses on issues that must be fixed

## Use Cases

The permissive preset is useful for:
- Quick reviews during development
- Teams that prefer minimal feedback
- Situations where only critical issues matter
- Fast feedback loops

## Notes

- Only flags issues that must be addressed
- Ignores all non-critical concerns
- Fastest review time
- Minimal noise in output
