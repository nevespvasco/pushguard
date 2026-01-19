---
name: PushGuard Implementation Plan
overview: Create a production-quality Node.js/TypeScript git pre-push hook tool that is non-interactive by default, uses LLM to review code changes, blocks pushes when issues are found (with bypass via --no-verify), and provides explicit opt-in interactive mode.
todos:
  - id: setup-project
    content: Initialize Node.js project with package.json, tsconfig.json, and basic folder structure
    status: pending
  - id: config-schema
    content: Implement config.ts with Zod schemas, config loader/writer, and validation
    status: pending
  - id: utils-core
    content: "Create utility modules: tty.ts (TTY detection), git.ts (diff extraction), logger.ts (colored output)"
    status: pending
  - id: llm-provider
    content: Implement LLM factory pattern and OpenAI provider with timeout handling and error recovery
    status: pending
  - id: prompts
    content: Create review prompt templates for strict/balanced/permissive presets
    status: pending
  - id: hook-core
    content: "Implement hook.ts with decision tree: mode detection, diff extraction, LLM review, result handling"
    status: pending
  - id: cli-interface
    content: "Create cli.ts with commander.js: review, config, install, test commands"
    status: pending
  - id: state-management
    content: Implement state.ts for temporary override handling (.pushguard/.state.json)
    status: pending
  - id: install-script
    content: Create install-hook.js script to set up git pre-push hook
    status: pending
  - id: default-config
    content: Create .pushguard/config.yml with commented default configuration
    status: pending
---

# PushGuard Implementation Plan

## Architecture Overview

PushGuard is a git pre-push hook that reviews code changes using LLM providers (OpenAI, Anthropic, etc.) before allowing pushes. The core design principle is **non-interactive by default** - all operations are silent and fast unless explicitly opted into.

### Key Decision Flow

```
git push
  ↓
Is .git/hooks/pre-push executable?
  ↓ YES
Read config (.pushguard/config.yml)
  ↓
Check for temporary override (.pushguard/.state.json)
  ↓
Determine mode: Interactive (if PUSHGUARD_INTERACTIVE=1 or CLI override) OR Silent
  ↓
If Interactive: Prompt for model selection
If Silent: Use config.model
  ↓
Get git diff (files to be pushed)
  ↓
Call LLM provider (with timeout)
  ↓
Parse LLM response
  ↓
If issues found:
 - Show issues (with nice formatting)
 - Exit with non-zero (block push)
 - User can bypass with: git push --no-verify
If no issues:
 - Exit with zero (allow push)
```

## Folder Structure

```
pushguard/
├── src/
│   ├── cli.ts                 # Main entry + commander setup
│   ├── config.ts              # Config loader + Zod schemas
│   ├── state.ts               # Temporary state overrides
│   ├── hook.ts                # Pre-push hook core logic
│   ├── llm/
│   │   ├── index.ts           # LLM provider interfaces
│   │   ├── openai.ts          # OpenAI implementation
│   │   ├── anthropic.ts       # Anthropic implementation (stub)
│   │   └── factory.ts         # Provider factory
│   ├── prompts/
│   │   ├── strict-review.txt
│   │   ├── balanced-review.txt
│   │   ├── permissive-review.txt
│   │   └── builder.ts         # Prompt builder utilities
│   └── utils/
│       ├── tty.ts             # TTY detection + safety checks
│       ├── git.ts             # Git operations (diff, branch, etc.)
│       └── logger.ts          # Colored output + formatting
├── .pushguard/
│   ├── config.yml             # Default config (committed)
│   └── .state.json            # Temporary overrides (gitignored)
├── scripts/
│   └── install-hook.js        # Hook installation helper
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Core Implementation Files

### 1. [src/config.ts](src/config.ts) - Configuration Management

**Purpose**: Load, validate, and manage configuration using Zod schemas.

**Key Components**:

- Zod schema for config validation:
                                                                - `provider`: enum ('openai' | 'anthropic' | 'groq')
                                                                - `model`: string (e.g., "gpt-4o-mini")
                                                                - `agent_preset`: enum ('strict' | 'balanced' | 'permissive')
                                                                - `interactive`: boolean (default: false)
                                                                - `models`: optional map for preset models
- Config loader that:
                                                                - Checks `.pushguard/config.yml` (YAML) or `.pushguard/config.json` (JSON)
                                                                - Falls back to default config if not found
                                                                - Validates using Zod with helpful error messages
- Config writer for interactive mode to save preferences

**Safety**: Never throws on missing config - uses sensible defaults.

### 2. [src/hook.ts](src/hook.ts) - Pre-Push Hook Logic

**Purpose**: Core hook execution logic with decision tree.

**Key Flow**:

1. **Environment Detection**:

                                                                                                - Check if TTY: `process.stdout.isTTY`
                                                                                                - Check CI: `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `JENKINS_URL` env vars
                                                                                                - If non-TTY or CI → force silent mode, never prompt

2. **Mode Determination**:

                                                                                                - If `PUSHGUARD_INTERACTIVE=1` AND TTY → interactive mode
                                                                                                - Else if `.pushguard/.state.json` exists with `overrideModel` → use override
                                                                                                - Else → silent mode (use config.model)

3. **Git Diff Extraction**:

                                                                                                - Use `git diff origin/branch..HEAD` to get staged changes
                                                                                                - Filter out binary files, large files (>1MB), or ignored patterns
                                                                                                - Truncate if total diff exceeds token limits

4. **LLM Review**:

                                                                                                - Load appropriate prompt based on `agent_preset`
                                                                                                - Call LLM provider with timeout (15s for fast models, 45s for deep models)
                                                                                                - Parse structured response (JSON or markdown with issues list)

5. **Result Handling**:

                                                                                                - If issues found → display formatted output, exit code 1 (block push)
                                                                                                - If no issues → exit code 0 (allow push)
                                                                                                - If LLM fails/timeout → warn but allow push (exit code 0) - failsafe

**Safety Checks**:

- Never prompt in non-TTY/CI
- Always allow push on LLM failure (fail-open)
- Timeout protection
- Graceful degradation

### 3. [src/cli.ts](src/cli.ts) - CLI Interface

**Purpose**: Commander.js setup for `pushguard` command.

**Commands**:

- `pushguard review [--model <model>] [--preset <preset>]`: Set temporary override for next push
- `pushguard config [--interactive]`: View/edit config
- `pushguard install`: Install the pre-push hook
- `pushguard test`: Test hook without actual push

**Key Features**:

- Nice ASCII art banner
- Colored output using chalk
- Helpful error messages
- Validates options before setting state

### 4. [src/llm/factory.ts](src/llm/factory.ts) & [src/llm/openai.ts](src/llm/openai.ts) - LLM Integration

**Purpose**: Provider abstraction and OpenAI implementation.

**Interface**:

```typescript
interface LLMProvider {
  review(diff: string, preset: 'strict' | 'balanced' | 'permissive'): Promise<ReviewResult>;
}

interface ReviewResult {
  hasIssues: boolean;
  issues: Issue[];
  summary?: string;
}

interface Issue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
}
```

**OpenAI Implementation**:

- Uses `openai` package
- Reads `OPENAI_API_KEY` from environment
- Timeout handling with AbortController
- Structured output parsing (tries JSON first, falls back to markdown parsing)
- Defensive error handling

**Safety**:

- Timeout defaults based on preset (strict=45s, balanced=30s, permissive=15s)
- Invalid API key → warn, allow push
- Network errors → warn, allow push
- Malformed response → try to parse, if fails → allow push

### 5. [src/prompts/strict-review.txt](src/prompts/strict-review.txt) - Review Prompts

**Content**: High-quality system prompts for each preset that:

- Clearly define the review scope
- Request structured output format
- Set appropriate severity thresholds
- Include examples of good vs bad code

**Strict Preset**:

- Flags security vulnerabilities, bugs, performance issues
- Suggests improvements for code quality
- JSON output format preferred

**Balanced Preset**:

- Focuses on bugs and security
- Less strict on style/formatting

**Permissive Preset**:

- Only flags critical bugs and security issues

## Configuration File

### [.pushguard/config.yml](.pushguard/config.yml)

```yaml
# PushGuard Configuration

# LLM Provider (openai | anthropic | groq)
provider: openai

# Default model to use (silent mode)
model: gpt-4o-mini

# Agent preset (strict | balanced | permissive)
# - strict: Flags bugs, security, performance, code quality issues
# - balanced: Flags bugs and security issues
# - permissive: Only flags critical bugs and security
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

## Installation Script

### [scripts/install-hook.js](scripts/install-hook.js)

**Purpose**: Helper script to install the pre-push hook.

**Functionality**:

- Detects `.git` directory
- Creates `.git/hooks/pre-push` if not exists
- Makes it executable (`chmod +x`)
- Injects call to `pushguard hook` command
- Handles Windows (Git Bash) and Unix systems

## Safety Mechanisms

### 1. **TTY and CI Detection**

- Always check `process.stdout.isTTY` before prompting
- Detect CI environments via env vars
- Force silent mode in non-TTY/CI contexts
- **Decision**: Prevents hangs in automation scripts

### 2. **Fail-Open on LLM Errors**

- If LLM call fails (network, timeout, API error) → warn but allow push
- Only exit non-zero if catastrophic config error (invalid schema)
- **Decision**: Prevents blocking developers when external service is down

### 3. **Timeout Protection**

- Preset-based timeouts (strict=45s, balanced=30s, permissive=15s)
- Uses AbortController for clean cancellation
- **Decision**: Prevents hanging indefinitely on slow/frozen LLM responses

### 4. **Non-Interactive by Default**

- `interactive: false` in config default
- Only prompts when `PUSHGUARD_INTERACTIVE=1` is explicitly set
- CLI `review` command sets temporary state (not persistent config)
- **Decision**: Ensures git operations in IDEs/scripts never get blocked by prompts

## Additional Features

### Model Presets

- Predefined model mappings (fast/cheap/deep) for easy switching
- Used in interactive mode for quick selection

### Temporary State Overrides

- `.pushguard/.state.json` stores one-time overrides
- Cleared after successful push or explicit reset
- Allows `pushguard review --model o1-preview` to work

### Nice Output Formatting

- ASCII art banner (when not silent)
- Colored severity indicators (red/yellow/green)
- File/line references for issues
- Summary statistics

## Dependencies

```json
{
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "inquirer": "^9.2.15",
    "js-yaml": "^4.1.0",
    "openai": "^4.24.1",
    "@anthropic-ai/sdk": "^0.20.0",
    "zod": "^3.22.4",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.7",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

## TypeScript Configuration

- Target: ES2022
- Module: ESNext (for ESM support)
- Strict mode enabled
- Node.js 20+ types