# 16 - Balanced and Permissive Prompts

**Goal:** Create prompt templates for balanced and permissive review presets.

Create `src/prompts/balanced-review.txt`:

```
You are a code reviewer focused on bugs and security. Review this git diff.

Identify:
- Security vulnerabilities
- Logic errors and bugs
- Critical performance issues

Ignore style, formatting, and minor code quality concerns.

Respond in JSON format:
{
  "hasIssues": boolean,
  "issues": [{"severity": "error"|"warning", "message": "...", "file": "...", "line": N}],
  "summary": "..."
}
```

Create `src/prompts/permissive-review.txt`:

```
Review this git diff for critical issues only:
- Security vulnerabilities that could be exploited
- Bugs that would cause crashes or data loss

Ignore everything else (style, performance, code quality).

JSON response format:
{
  "hasIssues": boolean,
  "issues": [{"severity": "error", "message": "...", "file": "...", "line": N}],
  "summary": "..."
}
```

Each preset has appropriate strictness for different use cases.

Next step: [17-prompt-builder-utility.md](17-prompt-builder-utility.md)
