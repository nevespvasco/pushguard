import chalk from 'chalk';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error';

export interface LoggerOptions {
  silent?: boolean;
  logLevel?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warning: 3,
  error: 4,
};

class Logger {
  public silent: boolean;
  private logLevel: LogLevel;

  constructor(options: LoggerOptions = {}) {
    this.silent = options.silent ?? false;
    
    // Get log level from environment or default to info
    const envLogLevel = process.env.PUSHGUARD_LOG_LEVEL?.toLowerCase();
    this.logLevel = (envLogLevel && envLogLevel in LOG_LEVELS) 
      ? (envLogLevel as LogLevel) 
      : (options.logLevel || 'info');
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.silent && level !== 'error') {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.logLevel];
  }

  trace(message: string) {
    if (this.shouldLog('trace')) {
      console.log(chalk.gray('⊹'), message);
    }
  }

  debug(message: string) {
    if (this.shouldLog('debug')) {
      console.log(chalk.cyan('⊹'), message);
    }
  }

  info(message: string) {
    if (this.shouldLog('info')) {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  success(message: string) {
    if (!this.silent) {
      console.log(chalk.green('✓'), message);
    }
  }

  warning(message: string) {
    if (this.shouldLog('warning')) {
      console.log(chalk.yellow('⚠'), message);
    }
  }

  error(message: string) {
    if (this.shouldLog('error')) {
      console.error(chalk.red('✗'), message);
    }
  }

  setSilent(silent: boolean) {
    this.silent = silent;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }
}

export const logger = new Logger();
