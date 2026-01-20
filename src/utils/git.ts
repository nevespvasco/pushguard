import { execSync } from 'child_process';

/**
 * Validates a git remote name to prevent command injection
 */
function validateRemote(remote: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(remote)) {
    throw new Error(`Invalid remote name: ${remote}`);
  }
}

/**
 * Validates a file path to prevent path traversal attacks
 */
function validateFilePath(filePath: string): boolean {
  // Reject paths with path traversal sequences
  if (filePath.includes('..') || filePath.includes('\0')) {
    return false;
  }
  // Reject absolute paths (should only work with relative paths from repo root)
  if (filePath.startsWith('/') || /^[a-zA-Z]:\\/.test(filePath)) {
    return false;
  }
  return true;
}

export function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim();
  } catch {
    throw new Error('Not in a git repository');
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
      execSync(`git rev-parse --verify ${remote}/${branch}`, {
        encoding: 'utf-8',
        stdio: 'ignore',
      });
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
    const remoteBranch = getRemoteBranch(remote);
    
    if (!remoteBranch) {
      // First push - no remote branch exists yet
      // Compare all changes in HEAD (all files will be new)
      // Use git diff with empty tree (4b825dc642cb6eb9a060e54bf8d69288fbee4904)
      // This is more efficient than manually constructing the diff
      try {
        // Empty tree hash - this gives us a diff of all files as new
        const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
        return execSync(`git diff ${emptyTree} HEAD`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });
      } catch {
        // Fallback: Use diff-tree with patch format
        try {
          return execSync(`git diff-tree -p --root -r HEAD`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
          });
        } catch {
          // Last resort: manually construct diff for all files
          try {
            const files = execSync(`git ls-tree -r --name-only HEAD`, {
              encoding: 'utf-8',
            }).trim().split('\n');
            
            let diffOutput = '';
            for (const file of files) {
              if (file && validateFilePath(file)) {
                diffOutput += `diff --git a/${file} b/${file}\n`;
                diffOutput += `new file mode 100644\n`;
                diffOutput += `index 0000000..0000000\n`;
                diffOutput += `--- /dev/null\n`;
                diffOutput += `+++ b/${file}\n`;
                try {
                  const content = execSync(`git show HEAD -- "${file.replace(/"/g, '\\"')}"`, {
                    encoding: 'utf-8',
                  });
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
            throw new Error('Failed to get diff for first push');
          }
        }
      }
    }
    
    return execSync(`git diff ${remoteBranch} HEAD`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    // Sanitize error message to prevent information leakage
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Remove potentially sensitive path information
    const sanitized = message.replace(/\/[^\s]+\/[^\s]+/g, '[path]').substring(0, 200);
    throw new Error(`Failed to get git diff: ${sanitized}`);
  }
}
