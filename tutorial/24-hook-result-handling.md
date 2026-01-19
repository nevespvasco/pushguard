# 24 - Hook Result Handling

**Goal:** Implement result display and exit code logic for blocking/allowing pushes.

Add to `src/hook.ts`:

```typescript
import { clearState } from './state.js';
import chalk from 'chalk';

function formatIssue(issue: Issue): string {
  const severityColor = {
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
  }[issue.severity];
  
  const prefix = severityColor(`[${issue.severity.toUpperCase()}]`);
  const location = issue.file
    ? chalk.gray(`${issue.file}:${issue.line || '?'}`)
    : '';
  
  return `${prefix} ${location} ${issue.message}`;
}

async function handleReviewResult(result: ReviewResult): Promise<void> {
  if (result.summary && !logger.silent) {
    console.log('\n' + chalk.bold('Review Summary:'));
    console.log(result.summary + '\n');
  }
  
  if (!result.hasIssues) {
    logger.success('No issues found. Push allowed.');
    clearState(); // Clear temporary overrides after successful review
    process.exit(0);
  }
  
  // Display issues
  console.log('\n' + chalk.bold.red('Issues found:'));
  result.issues.forEach(issue => {
    console.log(formatIssue(issue));
  });
  
  console.log(
    '\n' + chalk.yellow('Push blocked. Review the issues above.') +
    '\n' + chalk.gray('To bypass (not recommended): git push --no-verify')
  );
  
  process.exit(1);
}
```

This provides clear feedback and blocks pushes when issues are found.

Next step: [25-cli-base-structure.md](25-cli-base-structure.md)
