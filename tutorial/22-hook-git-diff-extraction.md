# 22 - Hook Git Diff Extraction

**Goal:** Integrate git diff extraction into the hook with truncation handling.

Add to `src/hook.ts`:

```typescript
import { getDiff } from './utils/git.js';

async function getReviewDiff(): Promise<string> {
  try {
    let diff = getDiff();
    
    // Truncate if too large (rough token estimate: ~4 chars per token)
    const MAX_CHARS = 100000; // ~25k tokens
    if (diff.length > MAX_CHARS) {
      logger.warning(
        `Diff too large (${diff.length} chars), truncating to ${MAX_CHARS}`
      );
      diff = diff.substring(0, MAX_CHARS) + '\n... (truncated)';
    }
    
    if (!diff.trim()) {
      logger.info('No changes to review');
      process.exit(0);
    }
    
    return diff;
  } catch (error) {
    logger.warning(`Failed to get diff: ${error}`);
    // Fail-open: allow push if we can't get diff
    process.exit(0);
  }
}
```

This safely handles large diffs and edge cases like no changes.

Next step: [23-hook-llm-review-integration.md](23-hook-llm-review-integration.md)
