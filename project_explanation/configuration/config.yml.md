# config.yml

## Purpose

The `.pushguard/config.yml` file stores user configuration for PushGuard. It defines which LLM provider to use, which model to use by default, and which review preset to apply. This file is read by `src/config.ts` and can be edited directly or via the interactive config command.

## Location

- **Path**: `.pushguard/config.yml` (relative to git repository root)
- **Format**: YAML (YAML Ain't Markup Language)
- **Version Control**: This file can be committed to git to share configuration with the team

## Configuration Fields

### Provider
- **Field**: `provider`
- **Type**: String (enum: `openai` | `anthropic` | `gemini`)
- **Default**: `openai`
- **Description**: Specifies which LLM provider to use for code reviews
- **Example**: `provider: openai`

### Model
- **Field**: `model`
- **Type**: String
- **Default**: `gpt-4o-mini`
- **Description**: Default model to use in silent mode (non-interactive)
- **Example**: `model: gpt-4o-mini`
- **Note**: Model names vary by provider (see `src/llm/models.ts` for valid models)

### Agent Preset
- **Field**: `agent_preset`
- **Type**: String (enum: `strict` | `balanced` | `permissive`)
- **Default**: `strict`
- **Description**: Determines how strict the code review should be
  - **strict**: Flags bugs, security, performance, code quality issues
  - **balanced**: Flags bugs and security issues
  - **permissive**: Only flags critical bugs and security
- **Example**: `agent_preset: strict`

### Interactive Mode
- **Field**: `interactive`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable interactive mode by default (almost never set to true)
- **Note**: Interactive mode is typically controlled via `PUSHGUARD_INTERACTIVE=1` environment variable instead
- **Example**: `interactive: false`

### Model Presets (Optional)
- **Field**: `models`
- **Type**: Object (key-value pairs)
- **Default**: Not set
- **Description**: Optional model presets for different use cases
- **Structure**:
  ```yaml
  models:
    fast: gpt-4o-mini      # Fast, cheap model
    deep: o1-preview        # Deep analysis model
    cheap: gpt-3.5-turbo    # Cost-effective model
  ```
- **Usage**: These presets can be selected in interactive mode or via temporary overrides

## Example Configuration

```yaml
# LLM Provider (openai | anthropic | gemini)
provider: openai

# Default model to use (silent mode)
model: gpt-4o-mini

# Agent preset (strict | balanced | permissive)
agent_preset: strict

# Enable interactive mode by default (almost never set to true)
# Use PUSHGUARD_INTERACTIVE=1 env var or CLI commands instead
interactive: false

# Optional: Model presets for different use cases
models:
  fast: gpt-4o-mini
  deep: o1-preview
  cheap: gpt-3.5-turbo
```

## How It's Used

1. **Loading**: `src/config.ts` reads this file using `loadConfig()`
2. **Validation**: Configuration is validated against a Zod schema
3. **Defaults**: Missing fields use default values defined in `src/config.ts`
4. **Updates**: Can be updated via `pushguard config --interactive` command

## Environment Variables Override

Some settings can be overridden by environment variables:
- **Interactive Mode**: `PUSHGUARD_INTERACTIVE=1` (not controlled by config file)
- **API Keys**: Must be set as environment variables (not in config file for security)
  - `OPENAI_API_KEY` for OpenAI
  - `ANTHROPIC_API_KEY` for Anthropic
  - `GEMINI_API_KEY` for Gemini

## Temporary Overrides

The configuration can be temporarily overridden via:
- `pushguard review --model <model> --preset <preset>` - Sets temporary override in `.pushguard/.state.json`
- Temporary overrides expire after 24 hours

## Security Notes

- API keys are **never** stored in this file (they're in environment variables)
- This file can be safely committed to git (no secrets)
- User-specific runtime state is stored in `.pushguard/.state.json` (gitignored)
