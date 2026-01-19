# 14 - LLM Interfaces and Types

**Goal:** Define TypeScript interfaces for LLM provider abstraction.

Create `src/llm/index.ts`:

```typescript
export type AgentPreset = 'strict' | 'balanced' | 'permissive';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface Issue {
  severity: IssueSeverity;
  message: string;
  file?: string;
  line?: number;
}

export interface ReviewResult {
  hasIssues: boolean;
  issues: Issue[];
  summary?: string;
}

export interface LLMProvider {
  review(
    diff: string,
    preset: AgentPreset,
    timeout?: number
  ): Promise<ReviewResult>;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
}
```

These interfaces enable a clean provider abstraction for multiple LLM backends.

Next step: [15-strict-review-prompt-template.md](15-strict-review-prompt-template.md)
