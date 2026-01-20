# factory.ts

## Purpose

The `factory.ts` file provides a factory function to create LLM provider instances and utilities for getting API key environment variable names. It abstracts provider creation and allows the codebase to work with providers through a common interface.

## Exports

### Types
- **ProviderConfig**: Configuration for creating a provider

### Functions
- **createProvider()**: Creates an LLM provider instance
- **getApiKeyEnvVar()**: Gets the API key environment variable name for a provider

## Type Definitions

### ProviderConfig

```typescript
interface ProviderConfig {
  apiKey: string;
  model: string;
}
```

**Fields**:
- **apiKey**: API key for the provider
- **model**: Model name to use

**Usage**: Passed to `createProvider()` to configure the provider instance.

## Functions

### createProvider()

**Purpose**: Creates an LLM provider instance based on the provider type.

**Parameters**:
- **provider**: `Provider` - Provider type (`'openai' | 'anthropic' | 'gemini'`)
- **config**: `ProviderConfig` - Provider configuration (API key and model)

**Returns**: `LLMProvider` - Provider instance implementing the LLMProvider interface

**Behavior**:
- Uses a switch statement to create the appropriate provider:
  - `'openai'`: Creates `OpenAIProvider` instance
  - `'anthropic'`: Creates `AnthropicProvider` instance
  - `'gemini'`: Creates `GeminiProvider` instance
- Throws error if provider is unknown

**Error Handling**:
- Unknown provider: Throws `Error` with message `"Unknown provider: <provider>"`

**Usage**: Called in `src/hook.ts` to create provider instances:

```typescript
const llmProvider = createProvider(provider, { apiKey, model });
```

### getApiKeyEnvVar()

**Purpose**: Gets the environment variable name for a provider's API key.

**Parameters**:
- **provider**: `Provider` - Provider type

**Returns**: `string` - Environment variable name

**Behavior**:
- Returns the appropriate environment variable name:
  - `'openai'`: `'OPENAI_API_KEY'`
  - `'anthropic'`: `'ANTHROPIC_API_KEY'`
  - `'gemini'`: `'GEMINI_API_KEY'`

**Usage**: Called in `src/hook.ts` to get the API key:

```typescript
const apiKeyEnvVar = getApiKeyEnvVar(provider);
const apiKey = process.env[apiKeyEnvVar];
```

## Design Pattern

This file implements the **Factory Pattern**:
- Centralizes provider creation logic
- Abstracts implementation details
- Allows easy addition of new providers
- Returns common interface (`LLMProvider`)

## Dependencies

- `src/llm/index.ts`: For `LLMProvider` interface
- `src/config.ts`: For `Provider` type
- `src/llm/openai.ts`: For `OpenAIProvider` class
- `src/llm/anthropic.ts`: For `AnthropicProvider` class
- `src/llm/gemini.ts`: For `GeminiProvider` class

## Usage Examples

### Creating a provider
```typescript
import { createProvider } from './llm/factory.js';

const provider = createProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

const result = await provider.review(diff, 'strict', 30000);
```

### Getting API key variable name
```typescript
import { getApiKeyEnvVar } from './llm/factory.js';

const envVar = getApiKeyEnvVar('anthropic'); // 'ANTHROPIC_API_KEY'
const apiKey = process.env[envVar];
```

## Adding New Providers

To add a new provider:
1. Create provider class implementing `LLMProvider` interface
2. Add case to `createProvider()` switch statement
3. Add case to `getApiKeyEnvVar()` switch statement
4. Update `Provider` type in `src/config.ts`
