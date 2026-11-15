import { spawnSync } from 'child_process';
import { resolve, normalize, isAbsolute, relative } from 'path';
import { MAX_GIT_BUFFER_SIZE } from '../constants.js';

/**
 * Safe wrapper for git commands using spawnSync
 */
function gitExec(args: string[], options: { maxBuffer?: number; stdio?: 'pipe' | 'ignore' | 'inherit' } = {}): string {
  const result = spawnSync('git', args, {
    encoding: 'utf-8',
    shell: false,
    stdio: options.stdio || ['ignore', 'pipe', 'ignore'],
    maxBuffer: options.maxBuffer || MAX_GIT_BUFFER_SIZE,
  });
  
  if (result.error) {
    throw result.error;
  }
  
  if (result.status !== 0) {
    throw new Error(`git command failed: ${args.join(' ')}`);
  }
  
  return result.stdout || '';
}

/**
 * Gets the git repository root directory
 */
export function getGitRoot(): string {
  try {
    return gitExec(['rev-parse', '--show-toplevel']).trim();
  } catch {
    // If not in git repo, use current directory
    return process.cwd();
  }
}

/**
 * Validates a git remote name to prevent command injection
 */
export function validateRemote(remote: string): void {
  // A leading dash would let git read the name as an option
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(remote)) {
    throw new Error(`Invalid remote name: ${remote}`);
  }
}

/**
 * Validates a file path to prevent path traversal attacks
 */
export function validateFilePath(filePath: string, repoRoot: string): boolean {
  // Reject null bytes
  if (filePath.includes('\0')) {
    return false;
  }
  
  // Normalize the path
  const normalized = normalize(filePath);
  
  // Reject paths with path traversal sequences (even after normalization)
  if (normalized.includes('..')) {
    return false;
  }
  
  // Prevent absolute paths
  if (isAbsolute(normalized)) {
    return false;
  }
  
  // Prevent UNC paths on Windows
  if (normalized.startsWith('\\\\')) {
    return false;
  }
  
  // Ensure path stays within repo boundaries
  const resolved = resolve(repoRoot, normalized);
  const repoResolved = resolve(repoRoot);
  
  // Check that resolved path starts with repo root (within repo)
  if (!resolved.startsWith(repoResolved)) {
    return false;
  }
  
  // Additional check: relative path should not start with ..
  const relativePath = relative(repoRoot, resolved);
  if (relativePath.startsWith('..')) {
    return false;
  }
  
  return true;
}

export function getCurrentBranch(): string {
  try {
    return gitExec(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  } catch {
    throw new Error(
      'Not in a git repository.\n' +
      'PushGuard requires a git repository to work. Please run this command from within a git repository.'
    );
  }
}

export function getRemoteBranch(remote: string = 'origin'): string | null {
  try {
    validateRemote(remote);
    const branch = getCurrentBranch();
    // Validate branch name format
    if (!/^[a-zA-Z0-9/_-]+$/.test(branch)) {
      throw new Error('Invalid branch name');
    }
    // Check if remote branch exists by trying to get its commit hash
    try {
      gitExec(['rev-parse', '--verify', `${remote}/${branch}`], { stdio: 'ignore' });
      return `${remote}/${branch}`;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export function getDiff(remote: string = 'origin'): string {
  try {
    validateRemote(remote);
    const repoRoot = getGitRoot();
    const remoteBranch = getRemoteBranch(remote);
    
    if (!remoteBranch) {
      // First push - no remote branch exists yet
      // Compare all changes in HEAD (all files will be new)
      // Use git diff with empty tree (4b825dc642cb6eb9a060e54bf8d69288fbee4904)
      // This is more efficient than manually constructing the diff
      try {
        // Empty tree hash - this gives us a diff of all files as new
        const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
        return gitExec(['diff', emptyTree, 'HEAD'], { maxBuffer: MAX_GIT_BUFFER_SIZE });
      } catch {
        // Fallback: Use diff-tree with patch format
        try {
          return gitExec(['diff-tree', '-p', '--root', '-r', 'HEAD'], { maxBuffer: MAX_GIT_BUFFER_SIZE });
        } catch {
          // Last resort: manually construct diff for all files
          try {
            const filesOutput = gitExec(['ls-tree', '-r', '--name-only', 'HEAD']);
            const files = filesOutput.trim().split('\n').filter(Boolean);
            
            let diffOutput = '';
            for (const file of files) {
              if (file && validateFilePath(file, repoRoot)) {
                diffOutput += `diff --git a/${file} b/${file}\n`;
                diffOutput += `new file mode 100644\n`;
                diffOutput += `index 0000000..0000000\n`;
                diffOutput += `--- /dev/null\n`;
                diffOutput += `+++ b/${file}\n`;
                try {
                  // Use safe git exec - no need for escaping
                  const content = gitExec(['show', 'HEAD', '--', file]);
                  const lines = content.split('\n');
                  for (const line of lines) {
                    diffOutput += `+${line}\n`;
                  }
                } catch {
                  // Skip files that can't be read
                }
              }
            }
            return diffOutput;
          } catch {
            throw new Error(
              'Failed to get diff for first push.\n' +
              'This might be because there are no files in the repository.\n' +
              'If this is unexpected, check your git repository status with: git status'
            );
          }
        }
      }
    }
    
    return gitExec(['diff', remoteBranch, 'HEAD'], { maxBuffer: MAX_GIT_BUFFER_SIZE });
  } catch (error) {
    // Sanitize error message to prevent information leakage
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Remove potentially sensitive path information
    const sanitized = message.replace(/\/[^\s]+\/[^\s]+/g, '[path]').substring(0, 200);
    throw new Error(
      `Failed to get git diff: ${sanitized}\n` +
      `This might be because:\n` +
      `  - The remote branch doesn't exist (first push)\n` +
      `  - Git is not installed or not in PATH\n` +
      `  - There are no changes to review\n` +
      `Try running: git status`
    );
  }
}
