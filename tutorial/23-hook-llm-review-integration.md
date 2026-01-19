# 23 - Hook LLM Review Integration

**Goal:** Integrate LLM review call with timeout and error handling.

Add to `src/hook.ts`:

```typescript
import { createProvider, getApiKeyEnvVar } from './llm/factory.js';
import { getTimeoutForPreset } from './prompts/builder.js';
import { loadConfig } from './config.js';

async function performReview(
  diff: string,
  model: string,
  preset: AgentPreset,
  provider: Provider
): Promise<ReviewResult> {
  const apiKey = process.env[getApiKeyEnvVar(provider)];
  
  if (!apiKey) {
    throw new Error(`Missing API key: ${getApiKeyEnvVar(provider)}`);
  }
  
  const llmProvider = createProvider(provider, { apiKey, model });
  const timeout = getTimeoutForPreset(preset);
  
  try {
    logger.info('Reviewing code changes...');
    // Provider handles preset-specific prompt building internally
    return await llmProvider.review(diff, preset, timeout);
  } catch (error) {
    // Fail-open: if LLM fails, warn but allow push
    logger.warning(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.warning('Allowing push to continue (fail-open behavior)');
    return { hasIssues: false, issues: [] };
  }
}
```

This implements the critical fail-open safety mechanism.

Next step: [24-hook-result-handling.md](24-hook-result-handling.md)
