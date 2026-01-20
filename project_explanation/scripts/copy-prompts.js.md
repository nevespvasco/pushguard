# copy-prompts.js

## Purpose

The `copy-prompts.js` script copies prompt template files from the `src/prompts/` directory to the `dist/prompts/` directory during the build process. This ensures that prompt files are available in the built package for runtime use.

## Execution

This script is run automatically as part of the build process:
- Called by `npm run build` (via `npm run copy-prompts`)
- Runs after TypeScript compilation
- Ensures prompt files are available in the built package

## Behavior

1. **Determines Paths**:
   - Gets script directory using `fileURLToPath(import.meta.url)`
   - Calculates project root (parent of `scripts/`)
   - Sets source directory: `src/prompts/`
   - Sets destination directory: `dist/prompts/`

2. **Creates Directory**:
   - Creates `dist/prompts/` directory if it doesn't exist
   - Uses `mkdirSync` with `recursive: true`

3. **Copies Files**:
   - Iterates over prompt files:
     - `strict-review.txt`
     - `balanced-review.txt`
     - `permissive-review.txt`
   - For each file:
     - Checks if source file exists
     - Copies file from `src/prompts/` to `dist/prompts/`
     - Logs success message
     - Logs warning if source file not found

4. **Completion**:
   - Logs success message when all files are copied

## Files Copied

- `strict-review.txt` → `dist/prompts/strict-review.txt`
- `balanced-review.txt` → `dist/prompts/balanced-review.txt`
- `permissive-review.txt` → `dist/prompts/permissive-review.txt`

## Error Handling

- **Missing Source File**: Logs warning but continues (doesn't fail build)
- **Directory Creation**: Fails if directory can't be created (propagates error)
- **File Copy**: Fails if file can't be copied (propagates error)

## Dependencies

- `fs` (Node.js): For file system operations
- `path` (Node.js): For path manipulation
- `url` (Node.js): For file URL resolution

## Usage

This script is typically not run directly. It's executed automatically during build:

```bash
npm run build
# Runs: tsc && npm run copy-prompts
```

## Why This Script Exists

- **Build Process**: Prompt files are not compiled by TypeScript (they're text files)
- **Runtime Access**: `src/prompts/builder.ts` needs to read prompt files at runtime
- **Package Distribution**: Built package needs prompt files in `dist/` directory
- **Path Resolution**: Runtime code expects prompts in `dist/prompts/` (relative to compiled code)

## Notes

- Script uses ES modules (`import.meta.url`)
- Creates destination directory if needed
- Continues even if some files are missing (warns but doesn't fail)
- Part of the build pipeline (not used at runtime)
