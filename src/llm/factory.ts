import type { LLMProvider } from './index.js';
import type { Provider } from '../config.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';

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
      return new AnthropicProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
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
    case 'gemini':
      return 'GEMINI_API_KEY';
  }
}
