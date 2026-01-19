# 19 - LLM Factory Implementation

**Goal:** Create factory function to instantiate the correct LLM provider.

Create `src/llm/factory.ts`:

```typescript
import type { LLMProvider, AgentPreset } from './index.js';
import type { Provider } from '../config.js';
import { OpenAIProvider } from './openai.js';

export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export function createProvider(
  provider: Provider,
  config: ProviderConfig
): LLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented');
    case 'groq':
      throw new Error('Groq provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getApiKeyEnvVar(provider: Provider): string {
  switch (provider) {
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'groq':
      return 'GROQ_API_KEY';
  }
}
```

This factory pattern allows easy addition of new providers.

Next step: [20-hook-environment-detection.md](20-hook-environment-detection.md)
