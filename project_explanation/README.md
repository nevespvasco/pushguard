# PushGuard Project Documentation

This directory contains detailed documentation for every file in the PushGuard codebase. PushGuard is an AI-powered git pre-push hook that automatically reviews code changes using language models from OpenAI, Anthropic, or Google Gemini.

## Project Overview

PushGuard integrates with git's pre-push hook system to automatically review code changes before they are pushed to a remote repository. It uses AI language models to detect bugs, security vulnerabilities, performance issues, and code quality problems.

## Documentation Structure

### [Configuration Files](./configuration/)
- [`package.json`](./configuration/package.json.md) - Project metadata, dependencies, and build scripts
- [`tsconfig.json`](./configuration/tsconfig.json.md) - TypeScript compiler configuration
- [`.gitignore`](./configuration/.gitignore.md) - Git ignore patterns
- [`config.yml`](./configuration/config.yml.md) - User configuration file

### [Core Source Files](./source/core/)
- [`cli.ts`](./source/core/cli.ts.md) - CLI command definitions and entry point
- [`hook.ts`](./source/core/hook.ts.md) - Pre-push hook execution logic
- [`config.ts`](./source/core/config.ts.md) - Configuration loading and management
- [`state.ts`](./source/core/state.ts.md) - Temporary state management (overrides, rate limiting)
- [`constants.ts`](./source/core/constants.ts.md) - Application-wide constants

### [LLM Provider Files](./source/llm/)
- [`index.ts`](./source/llm/index.ts.md) - Type definitions and interfaces for LLM providers
- [`factory.ts`](./source/llm/factory.ts.md) - Provider factory and API key utilities
- [`models.ts`](./source/llm/models.ts.md) - Model validation and suggestions
- [`openai.ts`](./source/llm/openai.ts.md) - OpenAI provider implementation
- [`anthropic.ts`](./source/llm/anthropic.ts.md) - Anthropic provider implementation
- [`gemini.ts`](./source/llm/gemini.ts.md) - Gemini provider implementation

### [Prompt Files](./source/prompts/)
- [`builder.ts`](./source/prompts/builder.ts.md) - Prompt loading and timeout utilities
- [`strict-review.txt`](./source/prompts/strict-review.txt.md) - Strict review prompt template
- [`balanced-review.txt`](./source/prompts/balanced-review.txt.md) - Balanced review prompt template
- [`permissive-review.txt`](./source/prompts/permissive-review.txt.md) - Permissive review prompt template

### [Utility Files](./source/utils/)
- [`git.ts`](./source/utils/git.ts.md) - Git operations (diff extraction, branch detection)
- [`logger.ts`](./source/utils/logger.ts.md) - Logging utility with levels and colors
- [`ratelimit.ts`](./source/utils/ratelimit.ts.md) - Rate limiting for reviews
- [`timeout.ts`](./source/utils/timeout.ts.md) - Timeout wrapper and error handling
- [`tty.ts`](./source/utils/tty.ts.md) - TTY/CI detection utilities

### [Scripts](./scripts/)
- [`copy-prompts.js`](./scripts/copy-prompts.js.md) - Build script to copy prompt files
- [`install-hook.js`](./scripts/install-hook.js.md) - Alternative hook installation script

## Architecture Overview

```
┌─────────────┐
│   git push  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  pre-push   │
│    hook     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   hook.ts   │────▶│   git.ts    │
│             │     │  (get diff) │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  factory.ts │────▶│  Provider   │
│             │     │ (OpenAI/    │
│             │     │ Anthropic/  │
│             │     │  Gemini)    │
└─────────────┘     └─────────────┘
```

## Key Concepts

### Review Presets
- **strict**: Flags bugs, security vulnerabilities, performance issues, and code quality problems
- **balanced**: Flags bugs and security issues
- **permissive**: Only flags critical bugs and security vulnerabilities

### State Management
Temporary overrides (model/preset) are stored in `.pushguard/.state.json` and expire after 24 hours. This allows users to set one-time overrides via `pushguard review --model X --preset Y`.

### Fail-Open Design
If the review service fails (timeout, API error, etc.), PushGuard allows the push to continue with a warning. This prevents blocking workflows when services are unavailable.

### Rate Limiting
Reviews are rate-limited to prevent excessive API calls. Minimum interval between reviews is 5 seconds.

## How to Use This Documentation

Each documentation file provides:
- **Purpose**: What the file does and its role in the system
- **Exports/Public API**: All exported functions, classes, types, constants
- **Detailed Function/Class Documentation**: Parameters, return values, behavior, error handling
- **Type Definitions**: Explanation of all interfaces and types
- **Dependencies**: What other modules the file depends on
- **Usage Examples**: How the file is used in the codebase
