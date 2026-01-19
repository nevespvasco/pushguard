# 09 - Git Utility Module

**Goal:** Create utility functions to extract git diff and branch information.

Create `src/utils/git.ts`:

```typescript
import { execSync } from 'child_process';

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
    const branch = getCurrentBranch();
    const remoteBranch = execSync(
      `git rev-parse --abbrev-ref ${remote}/${branch} 2>/dev/null || echo ""`,
      { encoding: 'utf-8' }
    ).trim();
    return remoteBranch || null;
  } catch {
    return null;
  }
}

export function getDiff(remote: string = 'origin'): string {
  try {
    const branch = getCurrentBranch();
    const remoteBranch = getRemoteBranch(remote);
    
    if (!remoteBranch) {
      // First push - compare against remote's default branch
      return execSync(`git diff ${remote}/HEAD HEAD`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
    }
    
    return execSync(`git diff ${remoteBranch} HEAD`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`Failed to get git diff: ${error}`);
  }
}
```

This handles both first-time pushes and subsequent pushes correctly.

Next step: [10-config-zod-schema-definition.md](10-config-zod-schema-definition.md)
