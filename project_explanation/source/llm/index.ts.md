# index.ts

## Purpose

The `index.ts` file in the `llm` directory defines the core type definitions and interfaces for LLM providers. It serves as the public API for the LLM provider system, defining the contract that all providers must implement.

## Exports

### Types
- **AgentPreset**: Review preset type
- **IssueSeverity**: Issue severity level type
- **Issue**: Issue object interface
- **ReviewResult**: Review result interface
- **LLMProvider**: Provider interface

## Type Definitions

### AgentPreset

```typescript
type AgentPreset = 'strict' | 'balanced' | 'permissive';
```

**Values**:
- **strict**: Flags bugs, security, performance, code quality issues
- **balanced**: Flags bugs and security issues
- **permissive**: Only flags critical bugs and security

**Usage**: Passed to providers to determine review strictness.

### IssueSeverity

```typescript
type IssueSeverity = 'error' | 'warning' | 'info';
```

**Values**:
- **error**: Critical bugs, security vulnerabilities, broken functionality
- **warning**: Potential issues, code smells, minor security concerns
- **info**: Style suggestions, optimization opportunities

**Usage**: Indicates the severity level of a detected issue.

### Issue

```typescript
interface Issue {
  severity: IssueSeverity;
  message: string;
  file?: string;
  line?: number;
}
```

**Fields**:
- **severity**: Required severity level
- **message**: Required description of the issue
- **file**: Optional file path where issue occurs
- **line**: Optional line number where issue occurs

**Usage**: Represents a single issue found during code review.

### ReviewResult

```typescript
interface ReviewResult {
  hasIssues: boolean;
  issues: Issue[];
  summary?: string;
}
```

**Fields**:
- **hasIssues**: Boolean indicating if any issues were found
- **issues**: Array of Issue objects (empty if no issues)
- **summary**: Optional overall assessment summary

**Usage**: Returned by LLM providers after reviewing code.

### LLMProvider

```typescript
interface LLMProvider {
  review(
    diff: string,
    preset: AgentPreset,
    timeout?: number
  ): Promise<ReviewResult>;
}
```

**Purpose**: Interface that all LLM providers must implement.

**Methods**:
- **review()**: Reviews a git diff and returns results
  - **diff**: Git diff string to review
  - **preset**: Review preset to use
  - **timeout**: Optional timeout in milliseconds
  - **Returns**: Promise resolving to ReviewResult

**Implementation**: Implemented by:
- `OpenAIProvider` in `src/llm/openai.ts`
- `AnthropicProvider` in `src/llm/anthropic.ts`
- `GeminiProvider` in `src/llm/gemini.ts`

## Design Pattern

This file uses the **Strategy Pattern**:
- `LLMProvider` interface defines the contract
- Each provider implements the interface differently
- Factory pattern (`src/llm/factory.ts`) creates appropriate provider
- Code using providers depends on interface, not implementation

## Usage

These types are imported throughout the codebase:

```typescript
import type { LLMProvider, ReviewResult, AgentPreset } from './llm/index.js';
```

## Dependencies

This file has no dependencies - it's pure type definitions.
