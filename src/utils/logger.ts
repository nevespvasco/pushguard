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
