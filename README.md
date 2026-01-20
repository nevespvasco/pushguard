# PushGuard

> AI-powered git pre-push hook for automated code review

PushGuard automatically reviews your code changes before pushing to a remote repository using AI language models. It helps catch bugs, security issues, and code quality problems before they reach your repository.

## Features

- 🤖 **AI-Powered Reviews**: Uses OpenAI, Anthropic, or Gemini models to review code changes
- 🎯 **Three Review Presets**: Choose from strict, balanced, or permissive review modes
- ⚙️ **Configurable**: Flexible configuration with support for multiple models and providers
- 🔄 **Git Integration**: Seamless integration with git pre-push hooks
- 🎨 **Beautiful CLI**: Interactive commands with colored output and helpful messages
- 🚀 **Fail-Open**: Won't block your workflow if the review service is unavailable

## Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **Git**: A git repository initialized in your project
- **API Key**: An API key for your chosen LLM provider (OpenAI, Anthropic, or Gemini)

## Installation

### Global Installation (Recommended)

```bash
npm install -g pushguard
```

### Local Installation

```bash
npm install --save-dev pushguard
```

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/pushguard.git
cd pushguard

# Install dependencies
npm install

# Build the project
npm run build
```

## Setup

### 1. Configure Your API Key

Set your API key as an environment variable based on your provider:

**For OpenAI:**
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

**For Anthropic:**
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

**For Gemini:**
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

On Windows (PowerShell):
```powershell
$env:OPENAI_API_KEY="your-openai-api-key"
```

On Windows (CMD):
```cmd
set OPENAI_API_KEY=your-openai-api-key
```

### 2. Configure PushGuard

Run the interactive configuration editor:

```bash
pushguard config --interactive
```

This will allow you to:
- Select your LLM provider (OpenAI, Anthropic, or Gemini)
- Choose your default model
- Set your agent preset (strict, balanced, or permissive)

### 3. Install the Git Hook

Install the pre-push hook in your repository:

```bash
pushguard install
```

This creates a `.git/hooks/pre-push` file that will automatically run PushGuard before each push.

### 4. Verify Installation

Test that everything is working:

```bash
pushguard review
```

## Configuration

PushGuard stores its configuration in `.pushguard/config.yml`. You can edit this file directly or use the interactive config command.

### Configuration File Structure

```yaml
# LLM Provider (openai | anthropic | gemini)
provider: openai

# Default model to use (silent mode)
model: gpt-4o-mini

# Agent preset (strict | balanced | permissive)
agent_preset: strict

# Optional: Model presets for different use cases
models:
  fast: gpt-4o-mini
  deep: o1-preview
  cheap: gpt-3.5-turbo
```

**Note**: Interactive mode is controlled via the `PUSHGUARD_INTERACTIVE=1` environment variable, not through the config file.

### Review Presets

- **strict**: Flags bugs, security vulnerabilities, performance issues, and code quality problems
- **balanced**: Flags bugs and security issues
- **permissive**: Only flags critical bugs and security vulnerabilities

## Usage

### Basic Usage

Once installed, PushGuard runs automatically when you push:

```bash
git push
```

The hook will review your changes and block the push if issues are found.

### Manual Review

Run a review without pushing:

```bash
pushguard review
```

This sets a temporary override for your next push. You can also specify options:

```bash
# Use a specific model
pushguard review --model o1-preview

# Use a specific preset
pushguard review --preset balanced

# Combine options
pushguard review --model o1-preview --preset strict
```

### View Configuration

View your current configuration:

```bash
pushguard config
```

### Edit Configuration

Launch the interactive configuration editor:

```bash
pushguard config --interactive
```

## Commands

### `pushguard review [options]`

Set temporary model/preset override for the next push.

**Options:**
- `-m, --model <model>`: Model to use (e.g., `o1-preview`)
- `-p, --preset <preset>`: Preset (`strict`, `balanced`, or `permissive`)

### `pushguard config [options]`

View or edit configuration.

**Options:**
- `-i, --interactive`: Launch interactive config editor

### `pushguard install`

Install the git pre-push hook in the current repository.

### `pushguard hook`

Internal command called by git. Runs the review process.

## How It Works

1. **Trigger**: When you run `git push`, the pre-push hook is triggered
2. **Diff Extraction**: PushGuard extracts the diff of changes you're about to push
3. **AI Review**: The diff is sent to your configured LLM provider for review
4. **Issue Detection**: The AI analyzes the code for bugs, security issues, and quality problems
5. **Result Handling**: 
   - If no issues are found, the push continues
   - If issues are found, they're displayed and the push is blocked

## Development

### Building the Project

```bash
npm run build
```

### Development Mode

Run the CLI in development mode (using `tsx` for TypeScript execution):

```bash
npm run dev
```

### Project Structure

```
pushguard/
├── src/
│   ├── cli.ts              # CLI command definitions
│   ├── hook.ts             # Pre-push hook logic
│   ├── config.ts           # Configuration management
│   ├── state.ts            # Temporary state management
│   ├── llm/                # LLM provider implementations
│   ├── prompts/            # Review prompt templates
│   └── utils/              # Utility functions
├── .pushguard/
│   └── config.yml          # User configuration
├── package.json
└── tsconfig.json
```

## Security

PushGuard implements several security measures to protect your codebase:

- **Safe YAML parsing**: Uses secure YAML schema to prevent code execution vulnerabilities
- **Input validation**: Validates git commands and file paths to prevent command injection and path traversal attacks
- **Error sanitization**: Error messages are sanitized to prevent information leakage
- **Fail-open design**: If the review service fails, pushes are allowed (with warnings) to prevent blocking your workflow

## Troubleshooting

### Hook Not Running

If the hook doesn't run when you push:

1. Verify the hook is installed: `ls .git/hooks/pre-push`
2. Check the hook is executable: `chmod +x .git/hooks/pre-push`
3. Ensure PushGuard is in your PATH

### API Key Not Found

If you see an error about a missing API key:

1. Verify the environment variable is set: `echo $OPENAI_API_KEY`
2. Make sure you're using the correct variable name for your provider
3. Restart your terminal session after setting the variable

### Review Taking Too Long

If reviews are slow:

1. Try a faster model like `gpt-4o-mini` or `gpt-3.5-turbo`
2. Switch to a more permissive preset
3. Large diffs may be truncated automatically

### Bypassing the Hook (Not Recommended)

If you need to bypass the hook temporarily:

```bash
git push --no-verify
```

**Warning**: This defeats the purpose of PushGuard. Only use this in emergencies.

## Environment Variables

- `OPENAI_API_KEY`: API key for OpenAI provider
- `ANTHROPIC_API_KEY`: API key for Anthropic provider
- `GEMINI_API_KEY`: API key for Gemini provider
- `PUSHGUARD_INTERACTIVE`: Set to `1` to enable interactive mode (allows model selection prompts during hook execution). This is required for interactive mode as the config file does not support this setting.

## 🚀 Future enhancements
- Caching: Cache review results for unchanged diffs
- Incremental reviews: Only review changed files
- Custom rules: Allow user-defined rules/configs
- Integration: Support GitHub Actions, GitLab CI, etc.
- Metrics: Track review stats (issues found, time, etc.)
- Parallel reviews: Use multiple models for validation
- Local models: Support local LLMs (Ollama, etc.)
- Diff filtering: Ignore certain file patterns/types
- Webhook support: Review PRs automatically
- Database: Store review history for analytics
- Retry logic: Automatic retries with exponential backoff
- Batch mode: Review multiple branches at once

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.