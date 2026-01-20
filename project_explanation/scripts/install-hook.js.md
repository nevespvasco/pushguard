# install-hook.js

## Purpose

The `install-hook.js` script is an alternative hook installation script. It creates a git pre-push hook that calls PushGuard. This script provides a simpler alternative to the `pushguard install` command, though the main CLI command (`src/cli.ts`) is the recommended way to install hooks.

## Execution

This script can be run directly:
```bash
node scripts/install-hook.js
```

Or via npm (if configured):
```bash
npm run install-hook
```

## Behavior

1. **Checks Git Repository**:
   - Verifies that `.git/` directory exists
   - Exits with error if not in a git repository

2. **Determines Hook Path**:
   - Calculates hook path: `.git/hooks/pre-push`
   - Uses project root (parent of `scripts/`)

3. **Creates Hook Content**:
   - Creates shell script content:
     ```bash
     #!/bin/sh
     # PushGuard pre-push hook
     exec pushguard hook "$@"
     ```
   - Simple shell script that executes `pushguard hook`

4. **Writes Hook File**:
   - Creates `.git/hooks/` directory if needed
   - Writes hook content to file
   - Makes hook executable (`chmod 755`)

5. **Completion**:
   - Logs success message with hook location
   - Provides usage information

## Hook Content

The created hook is a simple shell script:
```bash
#!/bin/sh
# PushGuard pre-push hook
exec pushguard hook "$@"
```

**Behavior**:
- Executes `pushguard hook` command
- Passes all arguments through (`"$@"`)
- Exits with hook's exit code (`|| exit 1`)

## Error Handling

- **Not in Git Repo**: Exits with error code 1 and error message
- **Directory Creation**: Fails if directory can't be created
- **File Write**: Fails if file can't be written
- **chmod**: Fails if permissions can't be set

## Dependencies

- `fs` (Node.js): For file system operations
- `path` (Node.js): For path manipulation
- `url` (Node.js): For file URL resolution

## Limitations

This script has some limitations compared to `pushguard install`:
- **Unix Only**: Only creates shell script (doesn't handle Windows)
- **No Cross-Platform**: Doesn't detect OS or create Windows-compatible hook
- **Simpler**: Less sophisticated than main install command

## Comparison with Main Install Command

| Feature | install-hook.js | pushguard install |
|---------|----------------|-------------------|
| Cross-platform | No (Unix only) | Yes (Windows + Unix) |
| Hook type | Shell script | OS-appropriate |
| Error handling | Basic | Comprehensive |
| Recommended | No | Yes |

## Usage

```bash
# Run directly
node scripts/install-hook.js

# Or if configured in package.json
npm run install-hook
```

## Notes

- This script is provided as an alternative/simpler option
- The main `pushguard install` command is recommended (handles Windows)
- Hook must be executable for git to run it
- Hook location: `.git/hooks/pre-push` (relative to repository root)
