# models.ts

## Purpose

The `models.ts` file provides model validation and suggestion utilities for LLM providers. It defines known model names for each provider and provides functions to validate model names and get suggestions.

## Exports

### Constants
- **OpenAI_MODELS**: Array of known OpenAI models
- **Anthropic_MODELS**: Array of known Anthropic models
- **Gemini_MODELS**: Array of known Gemini models

### Schemas
- **OpenAI_MODEL_SCHEMA**: Zod schema for OpenAI models
- **Anthropic_MODEL_SCHEMA**: Zod schema for Anthropic models
- **Gemini_MODEL_SCHEMA**: Zod schema for Gemini models

### Functions
- **validateModel()**: Validates a model name for a provider
- **getSuggestedModels()**: Gets suggested models for a provider
- **warnIfModelUnknown()**: Returns warning message if model is unknown

## Constants

### OpenAI_MODELS

Array of known OpenAI model names:
- `'gpt-4o'`
- `'gpt-4o-mini'`
- `'gpt-4-turbo'`
- `'gpt-4'`
- `'gpt-3.5-turbo'`
- `'o1-preview'`
- `'o1-mini'`

### Anthropic_MODELS

Array of known Anthropic model names:
- `'claude-3-5-sonnet-20241022'`
- `'claude-3-5-sonnet-20240620'`
- `'claude-3-opus-20240229'`
- `'claude-3-sonnet-20240229'`
- `'claude-3-haiku-20240307'`

### Gemini_MODELS

Array of known Gemini model names:
- `'gemini-2.0-flash-exp'`
- `'gemini-1.5-pro'`
- `'gemini-1.5-flash'`
- `'gemini-pro'`

## Schemas

### ModelNameSchema

Zod schema for model names:
- String with minimum length 1
- Maximum length 100
- Regex pattern: `^[a-zA-Z0-9._-]+$` (alphanumeric, dots, underscores, hyphens)

### Provider Model Schemas

Each provider has a schema that accepts:
- Known models from the provider's model array, OR
- Any string matching `ModelNameSchema` (for custom/unknown models)

This allows:
- Validation of known models
- Acceptance of custom model names (for new models or typos)

## Functions

### validateModel()

**Purpose**: Validates a model name for a specific provider.

**Parameters**:
- **provider**: `'openai' | 'anthropic' | 'gemini'` - Provider type
- **model**: `string` - Model name to validate

**Returns**: `boolean` - `true` if valid, `false` otherwise

**Behavior**:
1. Selects appropriate schema based on provider
2. Attempts to parse model name with schema
3. Returns `true` if parsing succeeds, `false` if it fails

**Usage**: Can be used to validate model names before making API calls.

### getSuggestedModels()

**Purpose**: Gets the list of suggested models for a provider.

**Parameters**:
- **provider**: `'openai' | 'anthropic' | 'gemini'` - Provider type

**Returns**: `readonly string[]` - Array of model names

**Behavior**:
- Returns the appropriate model array based on provider
- Returns readonly array to prevent modification

**Usage**: Used in interactive mode to show model options.

### warnIfModelUnknown()

**Purpose**: Returns a warning message if a model is not in the known models list.

**Parameters**:
- **provider**: `'openai' | 'anthropic' | 'gemini'` - Provider type
- **model**: `string` - Model name to check

**Returns**: `string | null` - Warning message if unknown, `null` if known

**Behavior**:
1. Gets suggested models for provider
2. Checks if model is in the list
3. If not found, returns warning message with first 3 known models
4. If found, returns `null`

**Warning Message Format**:
```
Model "<model>" is not in the known <provider> models list. Common models: <model1>, <model2>, <model3>...
```

**Usage**: Called in `src/hook.ts` to warn users about potentially invalid model names.

## Design Decisions

- **Flexible Validation**: Schemas accept both known and custom models
  - Allows new models to work without code updates
  - Still validates format (alphanumeric, dots, underscores, hyphens)
- **Warning, Not Error**: Unknown models generate warnings, not errors
  - Users can use new models before they're added to the list
  - Helps catch typos without blocking valid use cases

## Dependencies

- `zod`: For schema validation

## Usage Examples

### Validating a model
```typescript
import { validateModel } from './llm/models.js';

if (validateModel('openai', 'gpt-4o-mini')) {
  // Model is valid
}
```

### Getting suggestions
```typescript
import { getSuggestedModels } from './llm/models.js';

const models = getSuggestedModels('anthropic');
// ['claude-3-5-sonnet-20241022', ...]
```

### Warning about unknown model
```typescript
import { warnIfModelUnknown } from './llm/models.js';

const warning = warnIfModelUnknown('openai', 'custom-model');
if (warning) {
  console.warn(warning);
}
```
