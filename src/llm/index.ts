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
