# 07 - Logger Utility Module

**Goal:** Create a logger utility with colored output and formatted messaging.

Create `src/utils/logger.ts`:

```typescript
import chalk from 'chalk';

export interface LoggerOptions {
  silent?: boolean;
}

class Logger {
  private silent: boolean;

  constructor(options: LoggerOptions = {}) {
    this.silent = options.silent ?? false;
  }

  info(message: string) {
    if (!this.silent) {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  success(message: string) {
    if (!this.silent) {
      console.log(chalk.green('✓'), message);
    }
  }

  warning(message: string) {
    if (!this.silent) {
      console.log(chalk.yellow('⚠'), message);
    }
  }

  error(message: string) {
    if (!this.silent) {
      console.error(chalk.red('✗'), message);
    }
  }

  setSilent(silent: boolean) {
    this.silent = silent;
  }
}

export const logger = new Logger();
```

This logger respects the silent mode for non-interactive operations.

Next step: [08-tty-detection-utility.md](08-tty-detection-utility.md)
