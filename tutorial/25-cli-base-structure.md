# 25 - CLI Base Structure

**Goal:** Set up the CLI entry point with Commander.js and ASCII banner.

Create `src/cli.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('pushguard')
  .description('AI-powered git pre-push hook for code review')
  .version('1.0.0');

// ASCII banner
function showBanner() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════╗
║        PushGuard v1.0.0           ║
║   AI-Powered Code Review Hook     ║
╚═══════════════════════════════════╝
  `));
}

// Import commands (to be created)
// program.command('review').action(...);
// program.command('config').action(...);
// program.command('install').action(...);

program.parse();
```

This establishes the CLI foundation with a nice banner.

Next step: [26-cli-review-command.md](26-cli-review-command.md)
