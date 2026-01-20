# cli.ts

## Purpose

The `cli.ts` file is the main entry point for the PushGuard CLI application. It defines all command-line commands using the Commander.js framework and handles user interactions. This file is executed when users run the `pushguard` command.

## Entry Point

The file starts with `#!/usr/bin/env node` shebang, making it executable as a script. It's the binary entry point defined in `package.json` as `./dist/cli.js`.

## Exports

This file doesn't export anything - it's a CLI entry point that executes commands.

## Dependencies

- **commander**: CLI framework for command parsing
- **chalk**: Terminal colors and styling
- **inquirer**: Interactive prompts
- **fs**: File system operations
- **path**: Path manipulation
- **os**: Operating system detection
- **zod**: Input validation

## Functions

### showBanner()

**Purpose**: Displays an ASCII art banner for PushGuard.

**Parameters**: None

**Returns**: `void`

**Behavior**: Prints a cyan-colored banner with version and description to the console.

**Usage**: Called at the start of `review` and `config --interactive` commands.

## Commands

The CLI uses Commander.js to define commands. The program is created with:
- **name**: `'pushguard'`
- **description**: `'AI-powered git pre-push hook for code review'`
- **version**: `'1.0.0'`

### review

**Command**: `pushguard review [options]`

**Description**: Sets temporary model/preset override for the next push.

**Options**:
- `-m, --model <model>`: Model to use (e.g., `o1-preview`)
- `-p, --preset <preset>`: Preset (`strict`, `balanced`, or `permissive`)

**Action**:
1. Shows banner
2. Loads current configuration
3. Uses provided options or falls back to config defaults
4. Validates preset using Zod schema
5. Validates model name (1-100 characters)
6. Saves state with overrides and expiration (24 hours)
7. Prints success message with override details

**Validation**:
- Preset must be one of: `strict`, `balanced`, `permissive`
- Model name must be 1-100 characters
- Exits with error code 1 if validation fails

**Usage Example**:
```bash
pushguard review --model o1-preview --preset strict
```

### config

**Command**: `pushguard config [options]`

**Description**: View or edit configuration.

**Options**:
- `-i, --interactive`: Launch interactive config editor

**Action (Non-Interactive)**:
- Loads and prints current configuration as JSON
- Used for viewing current settings

**Action (Interactive)**:
1. Shows banner
2. Loads current configuration
3. Prompts user to select which field to edit:
   - Provider (with current value shown)
   - Model (with current value shown)
   - Preset (with current value shown)
   - Exit without changes
4. For provider: Shows list of providers (openai, anthropic, gemini)
5. For model: Prompts for model name input (with current as default)
6. For preset: Shows list with descriptions:
   - strict: Flags bugs, security, performance, quality
   - balanced: Flags bugs and security
   - permissive: Only critical bugs and security
7. Updates config using `updateConfig()`
8. Shows success message

**Usage Examples**:
```bash
pushguard config                    # View config
pushguard config --interactive      # Edit config
```

### install

**Command**: `pushguard install`

**Description**: Installs the git pre-push hook in the current repository.

**Action**:
1. Determines git directory (`.git/`)
2. Checks if in a git repository (exits with error if not)
3. Determines hook path (`.git/hooks/pre-push`)
4. Detects operating system (Windows vs Unix)
5. Creates hook content:
   - **Windows**: Node.js wrapper script using `spawn`
   - **Unix**: Shell script that executes `pushguard hook`
6. Writes hook file
7. Makes hook executable on Unix systems (chmod 755)
8. Prints success message with hook location
9. On Windows, warns that Node.js must be in PATH

**Hook Content (Windows)**:
```javascript
#!/usr/bin/env node
// PushGuard pre-push hook (Windows-compatible)
const { spawn } = require('child_process');
const pushguard = spawn('pushguard', ['hook', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: false,
});

pushguard.on('exit', (code) => {
  process.exit(code || 0);
});

pushguard.on('error', (err) => {
  console.error('PushGuard error:', err.message);
  process.exit(1);
});
```

**Hook Content (Unix)**:
```bash
#!/bin/sh
# PushGuard pre-push hook
exec pushguard hook "$@" || exit 1
```

**Error Handling**:
- Not in git repo: Exits with error code 1 and helpful message
- File write errors: Propagate (would show error)

**Usage Example**:
```bash
pushguard install
```

### hook

**Command**: `pushguard hook`

**Description**: Internal command called by git. Runs the review process.

**Action**:
- Calls `runHook()` from `src/hook.ts`
- This is the main review execution logic

**Note**: This command is not meant to be called directly by users - it's invoked by the git pre-push hook.

## Validation Schemas

### PresetSchema
- Zod enum: `['strict', 'balanced', 'permissive']`
- Used to validate preset values

### ModelSchema
- Zod string with min length 1, max length 100
- Used to validate model names

## Cross-Platform Support

The `install` command handles Windows and Unix differences:
- **Windows**: Uses Node.js wrapper (works without shell)
- **Unix**: Uses shell script (simpler, more efficient)
- **Executable permissions**: Only set on Unix (Windows doesn't use them)

## Error Handling

- Invalid preset: Prints error and exits with code 1
- Invalid model: Prints error and exits with code 1
- Not in git repo: Prints error and exits with code 1
- Missing git directory: Prints error and exits with code 1

## Dependencies

- `src/state.ts`: For saving temporary overrides
- `src/config.ts`: For loading and updating configuration
- `src/hook.ts`: For running the review process
- `src/constants.ts`: For `STATE_EXPIRATION_MS`

## Usage Flow

1. User runs `pushguard <command>`
2. Commander.js parses arguments
3. Appropriate command action is executed
4. Commands may:
   - Read/write configuration
   - Save temporary state
   - Install git hooks
   - Run reviews

## Examples

### Setting a temporary override
```bash
pushguard review --model o1-preview --preset strict
# Next push will use o1-preview with strict preset
```

### Viewing configuration
```bash
pushguard config
# Outputs JSON configuration
```

### Installing hook
```bash
pushguard install
# Creates .git/hooks/pre-push
```
