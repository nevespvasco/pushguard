# git.ts

## Purpose

The `git.ts` file provides safe git operations for PushGuard. It handles extracting git diffs, detecting branches, and validating inputs to prevent security vulnerabilities like command injection and path traversal attacks.

## Exports

### Functions
- **getGitRoot()**: Gets the git repository root directory
- **getCurrentBranch()**: Gets the current git branch name
- **getRemoteBranch()**: Gets the remote branch name for the current branch
- **getDiff()**: Gets the git diff for review

## Functions

### getGitRoot()

**Purpose**: Gets the absolute path of the git repository root directory.

**Parameters**: None

**Returns**: `string` - Absolute path to git root

**Behavior**:
1. Executes `git rev-parse --show-toplevel`
2. Returns trimmed output (absolute path)
3. If not in git repo, returns `process.cwd()` as fallback

**Error Handling**: 
- Git errors: Returns `process.cwd()` (graceful fallback)
- Not in git repo: Returns current working directory

**Usage**: Used throughout the codebase to find repository root for config/state files.

### getCurrentBranch()

**Purpose**: Gets the name of the current git branch.

**Parameters**: None

**Returns**: `string` - Branch name

**Behavior**:
1. Executes `git rev-parse --abbrev-ref HEAD`
2. Returns trimmed branch name

**Error Handling**:
- Not in git repo: Throws error with helpful message
- Git errors: Throws error

**Usage**: Used to determine which branch is being pushed.

### getRemoteBranch()

**Purpose**: Gets the remote branch name for the current branch (e.g., `origin/main`).

**Parameters**:
- **remote**: `string` (optional) - Remote name (default: `'origin'`)

**Returns**: `string | null` - Remote branch name or `null` if doesn't exist

**Behavior**:
1. Validates remote name (alphanumeric, underscores, hyphens only)
2. Gets current branch name
3. Validates branch name format
4. Checks if remote branch exists using `git rev-parse --verify`
5. Returns `remote/branch` if exists, `null` otherwise

**Error Handling**:
- Invalid remote: Throws error
- Invalid branch: Throws error
- Remote branch doesn't exist: Returns `null` (not an error)
- Other errors: Returns `null`

**Security**: Validates remote and branch names to prevent command injection.

### getDiff()

**Purpose**: Gets the git diff between the current branch and its remote counterpart.

**Parameters**:
- **remote**: `string` (optional) - Remote name (default: `'origin'`)

**Returns**: `string` - Git diff output

**Behavior**:
1. Validates remote name
2. Gets git repository root
3. Gets remote branch name
4. If no remote branch exists (first push):
   - Uses empty tree hash (`4b825dc642cb6eb9a060e54bf8d69288fbee4904`)
   - Executes `git diff <empty-tree> HEAD` to get all changes
   - Fallback methods if that fails:
     - `git diff-tree -p --root -r HEAD`
     - Manual diff construction for all files
5. If remote branch exists:
   - Executes `git diff <remote-branch> HEAD`
6. Returns diff output

**Error Handling**:
- Sanitizes error messages (removes paths, limits length)
- Provides helpful error message with troubleshooting tips
- Throws error with sanitized message

**Security**:
- Validates remote name
- Validates file paths (prevents path traversal)
- Uses `spawnSync` with `shell: false` (prevents command injection)
- Limits buffer size (prevents memory exhaustion)

**First Push Handling**: Special handling for first push (no remote branch):
- Uses empty tree to get all changes
- Multiple fallback methods
- Handles edge cases gracefully

### Private Helper Functions

#### gitExec()

**Purpose**: Safe wrapper for executing git commands.

**Parameters**:
- **args**: `string[]` - Git command arguments
- **options**: Object with:
  - **maxBuffer**: `number` (optional) - Maximum buffer size
  - **stdio**: `'pipe' | 'ignore' | 'inherit'` (optional) - stdio configuration

**Returns**: `string` - Command output

**Behavior**:
1. Executes `git` command using `spawnSync`
2. Uses `shell: false` (prevents command injection)
3. Applies buffer size limit (default: 10MB)
4. Returns stdout or throws error

**Security**:
- `shell: false` prevents shell injection
- Buffer limits prevent memory exhaustion
- Error handling prevents information leakage

#### validateRemote()

**Purpose**: Validates remote name to prevent command injection.

**Parameters**:
- **remote**: `string` - Remote name to validate

**Returns**: `void`

**Throws**: `Error` if remote name is invalid

**Validation**: Remote name must match regex: `^[a-zA-Z0-9_-]+$`
- Only alphanumeric characters, underscores, and hyphens
- Prevents command injection via remote name

#### validateFilePath()

**Purpose**: Validates file path to prevent path traversal attacks.

**Parameters**:
- **filePath**: `string` - File path to validate
- **repoRoot**: `string` - Repository root directory

**Returns**: `boolean` - `true` if valid, `false` otherwise

**Validation Checks**:
1. Rejects null bytes (`\0`)
2. Normalizes path
3. Rejects paths with `..` (path traversal)
4. Rejects absolute paths
5. Rejects UNC paths (Windows network paths)
6. Ensures path stays within repository boundaries
7. Checks relative path doesn't start with `..`

**Security**: Comprehensive path validation prevents:
- Path traversal attacks
- Accessing files outside repository
- UNC path attacks (Windows)

## Security Considerations

### Command Injection Prevention
- Uses `spawnSync` with `shell: false`
- Validates remote and branch names
- No user input in command construction

### Path Traversal Prevention
- Validates all file paths
- Ensures paths stay within repository
- Rejects `..` sequences
- Normalizes paths before validation

### Memory Protection
- Limits buffer size to 10MB
- Prevents memory exhaustion from large diffs
- Uses `maxBuffer` option in `spawnSync`

### Error Sanitization
- Removes path information from errors
- Limits error message length
- Provides generic error messages

## Dependencies

- `child_process` (Node.js): For `spawnSync`
- `path` (Node.js): For path manipulation
- `src/constants.ts`: For `MAX_GIT_BUFFER_SIZE`

## Usage Examples

### Getting git root
```typescript
import { getGitRoot } from './utils/git.js';

const root = getGitRoot();
// '/path/to/repository'
```

### Getting current branch
```typescript
import { getCurrentBranch } from './utils/git.js';

const branch = getCurrentBranch();
// 'main'
```

### Getting diff
```typescript
import { getDiff } from './utils/git.js';

const diff = getDiff('origin');
// Git diff output
```

## Notes

- All git operations use `spawnSync` (synchronous, blocking)
- Security is a primary concern (validates all inputs)
- Handles first push scenario (no remote branch)
- Error messages are sanitized to prevent information leakage
