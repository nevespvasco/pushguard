# config.ts

## Purpose

The `config.ts` file handles loading, validating, and managing PushGuard configuration from `.pushguard/config.yml`. It provides type-safe configuration access with Zod schema validation and default values.

## Exports

### Types
- **Config**: The validated configuration type
- **Provider**: LLM provider type (`'openai' | 'anthropic' | 'gemini'`)
- **AgentPreset**: Review preset type (`'strict' | 'balanced' | 'permissive'`)

### Functions
- **loadConfig()**: Loads and validates configuration
- **saveConfig()**: Saves configuration to file
- **updateConfig()**: Updates configuration with partial values

## Type Definitions

### Config

```typescript
interface Config {
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  agent_preset: 'strict' | 'balanced' | 'permissive';
  models?: Record<string, string>;  // Optional model presets
}
```

**Fields**:
- **provider**: Required LLM provider identifier
- **model**: Required default model name (must be non-empty string)
- **agent_preset**: Required review preset
- **models**: Optional object mapping preset names to model names (e.g., `{ fast: 'gpt-4o-mini' }`)

### Provider

Type alias for the provider enum: `'openai' | 'anthropic' | 'gemini'`

### AgentPreset

Type alias for the preset enum: `'strict' | 'balanced' | 'permissive'`

## Functions

### loadConfig()

**Purpose**: Loads configuration from `.pushguard/config.yml` or `.pushguard/config.json`, validates it, and returns a Config object with defaults applied.

**Parameters**: None

**Returns**: `Config` - Validated configuration object

**Behavior**:
1. Determines config directory (`.pushguard/` relative to git root)
2. Checks for `config.yml` first, then `config.json` as fallback
3. Validates file size (max 100KB) to prevent memory exhaustion
4. Parses YAML or JSON
5. Validates against Zod schema
6. Returns validated config or default config if validation fails

**Default Configuration**:
```typescript
{
  provider: 'openai',
  model: 'gpt-4o-mini',
  agent_preset: 'strict',
}
```

**Error Handling**:
- File not found: Returns default config (not an error)
- File too large: Throws error with size limit message
- Invalid YAML/JSON: Returns default config with warning
- Invalid schema: Returns default config with warning message

**Security**:
- Uses `yaml.DEFAULT_SCHEMA` (safe, no code execution)
- Validates file size before reading
- Sanitizes error messages

**Usage**: Called throughout the codebase to get current configuration.

### saveConfig()

**Purpose**: Saves a complete Config object to `.pushguard/config.yml`.

**Parameters**:
- **config**: `Config` - The configuration object to save

**Returns**: `void`

**Behavior**:
1. Gets config directory path
2. Creates `.pushguard/` directory if it doesn't exist
3. Converts config to YAML format (2-space indent, 80 char line width)
4. Writes to `config.yml`

**Error Handling**: 
- Directory creation errors propagate
- File write errors propagate

**Usage**: Called by `updateConfig()` and potentially by interactive config editor.

### updateConfig()

**Purpose**: Updates configuration with partial values, merging with existing config.

**Parameters**:
- **updates**: `Partial<Config>` - Partial configuration object with fields to update

**Returns**: `Config` - The updated configuration object

**Behavior**:
1. Loads current configuration
2. Merges updates with current config (updates take precedence)
3. Saves merged config to file
4. Returns the updated config

**Usage**: Called by `src/cli.ts` when updating config via interactive editor.

## Configuration Schema

The configuration is validated using Zod schemas:

- **ProviderSchema**: Enum of `'openai' | 'anthropic' | 'gemini'`
- **AgentPresetSchema**: Enum of `'strict' | 'balanced' | 'permissive'`
- **ModelsSchema**: Optional record of string to string
- **ConfigSchema**: Main schema combining all fields with defaults

## Configuration File Location

The config file is located at `.pushguard/config.yml` relative to the git repository root. The path is determined by:
1. Finding the git root using `getGitRoot()` from `src/utils/git.ts`
2. Appending `.pushguard/config.yml`

If not in a git repository, falls back to `process.cwd()/.pushguard/config.yml`.

## File Format

The config file uses YAML format:

```yaml
provider: openai
model: gpt-4o-mini
agent_preset: strict
models:
  fast: gpt-4o-mini
  deep: o1-preview
```

## Security Considerations

- **File size limit**: 100KB maximum prevents DoS attacks
- **Safe YAML parsing**: Uses `DEFAULT_SCHEMA` (no code execution)
- **Input validation**: Zod schema ensures type safety
- **Error sanitization**: Error messages don't leak sensitive paths

## Dependencies

- `zod`: For schema validation
- `js-yaml`: For YAML parsing
- `fs` (Node.js): For file system operations
- `path` (Node.js): For path manipulation
- `src/utils/git.ts`: For getting git root directory
- `src/constants.ts`: For `MAX_CONFIG_SIZE` constant

## Usage Examples

### Loading configuration
```typescript
import { loadConfig } from './config.js';

const config = loadConfig();
console.log(config.provider);  // 'openai'
console.log(config.model);     // 'gpt-4o-mini'
```

### Updating configuration
```typescript
import { updateConfig } from './config.js';

const updated = updateConfig({ 
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022'
});
```

### Checking provider type
```typescript
import { loadConfig, type Provider } from './config.js';

const config = loadConfig();
const provider: Provider = config.provider;
```
