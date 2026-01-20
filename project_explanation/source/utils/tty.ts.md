# tty.ts

## Purpose

The `tty.ts` file provides utilities for detecting terminal capabilities and CI environments. It helps determine whether interactive mode should be allowed and whether output should be silent.

## Exports

### Functions
- **isTTY()**: Checks if running in a TTY (terminal)
- **isCI()**: Checks if running in a CI environment
- **shouldAllowInteractive()**: Determines if interactive mode is allowed
- **forceSilentMode()**: Determines if silent mode should be forced

## Functions

### isTTY()

**Purpose**: Checks if the process is running in a TTY (interactive terminal).

**Parameters**: None

**Returns**: `boolean` - `true` if TTY, `false` otherwise

**Behavior**:
- Checks `process.stdout.isTTY === true`
- Returns `true` if stdout is a TTY (interactive terminal)
- Returns `false` if stdout is not a TTY (piped, redirected, etc.)

**Usage**: Used to determine if interactive features (prompts, colors) should be enabled.

### isCI()

**Purpose**: Checks if the process is running in a CI (Continuous Integration) environment.

**Parameters**: None

**Returns**: `boolean` - `true` if CI, `false` otherwise

**Behavior**:
- Checks for common CI environment variables:
  - `CI` (generic CI indicator)
  - `GITHUB_ACTIONS` (GitHub Actions)
  - `GITLAB_CI` (GitLab CI)
  - `JENKINS_URL` (Jenkins)
  - `BUILDKITE` (Buildkite)
  - `TEAMCITY_VERSION` (TeamCity)
- Returns `true` if any CI variable is set
- Returns `false` otherwise

**Usage**: Used to disable interactive features and force silent mode in CI.

### shouldAllowInteractive()

**Purpose**: Determines if interactive mode should be allowed.

**Parameters**: None

**Returns**: `boolean` - `true` if interactive mode is allowed, `false` otherwise

**Behavior**:
- Returns `true` if:
  - Running in a TTY (interactive terminal)
  - AND not in a CI environment
- Returns `false` otherwise

**Usage**: Used in `src/hook.ts` to determine if interactive prompts should be shown.

### forceSilentMode()

**Purpose**: Determines if silent mode should be forced (no output except errors).

**Parameters**: None

**Returns**: `boolean` - `true` if silent mode should be forced, `false` otherwise

**Behavior**:
- Returns `true` if:
  - NOT running in a TTY (piped/redirected output)
  - OR running in a CI environment
- Returns `false` if running in an interactive terminal

**Usage**: Used in `src/hook.ts` to force silent mode in non-interactive environments.

## Environment Detection

The functions check for these CI environments:
- **GitHub Actions**: `GITHUB_ACTIONS`
- **GitLab CI**: `GITLAB_CI`
- **Jenkins**: `JENKINS_URL`
- **Buildkite**: `BUILDKITE`
- **TeamCity**: `TEAMCITY_VERSION`
- **Generic**: `CI` (many CI systems set this)

## Usage Examples

### Checking if interactive
```typescript
import { shouldAllowInteractive } from './utils/tty.js';

if (shouldAllowInteractive()) {
  // Show interactive prompts
}
```

### Forcing silent mode
```typescript
import { forceSilentMode } from './utils/tty.js';

if (forceSilentMode()) {
  logger.setSilent(true);
}
```

## Dependencies

This file has no dependencies - it only uses Node.js built-in `process` object.

## Design Decisions

- **TTY Detection**: Uses `process.stdout.isTTY` (standard Node.js approach)
- **CI Detection**: Checks multiple environment variables (covers most CI systems)
- **Conservative Approach**: Prefers silent mode when uncertain (better for automation)
