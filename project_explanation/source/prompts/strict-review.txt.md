# strict-review.txt

## Purpose

The `strict-review.txt` file contains the system prompt template used for strict code reviews. This prompt instructs the AI to perform a thorough analysis, flagging bugs, security vulnerabilities, performance issues, and code quality problems.

## Content

The prompt instructs the AI to:
1. Act as an expert code reviewer analyzing a git diff
2. Identify multiple categories of issues:
   - Security vulnerabilities (SQL injection, XSS, auth flaws, etc.)
   - Bugs and logic errors
   - Performance issues (inefficient algorithms, N+1 queries, etc.)
   - Code quality problems (complexity, maintainability)
   - Best practice violations
3. Respond in a specific JSON format
4. Use severity levels appropriately
5. Be thorough but concise

## Expected Response Format

The prompt specifies the exact JSON structure expected:

```json
{
  "hasIssues": boolean,
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "message": "Clear description of the issue",
      "file": "path/to/file.ts",
      "line": 42
    }
  ],
  "summary": "Brief overall assessment"
}
```

## Severity Guidelines

The prompt defines severity levels:
- **"error"**: Critical bugs, security vulnerabilities, broken functionality
- **"warning"**: Potential issues, code smells, minor security concerns
- **"info"**: Style suggestions, optimization opportunities

## Review Scope

The strict preset is the most comprehensive:
- **Security**: All security vulnerabilities
- **Bugs**: All logic errors and bugs
- **Performance**: All performance issues
- **Quality**: Code quality and maintainability concerns
- **Best Practices**: Violations of best practices

## Usage

This prompt is loaded by `src/prompts/builder.ts` when `loadPrompt('strict')` is called. It's used as the system prompt in LLM API calls when the `'strict'` preset is selected.

## Differences from Other Presets

- **More comprehensive**: Flags more types of issues than balanced/permissive
- **Includes quality**: Flags code quality and best practice issues
- **Includes performance**: Flags performance concerns
- **Most thorough**: Most detailed review of all presets

## Notes

- The prompt emphasizes being "thorough but concise"
- Only genuine issues should be flagged
- File and line numbers are optional but helpful
- Summary provides overall assessment
