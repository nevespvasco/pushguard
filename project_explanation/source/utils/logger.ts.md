# logger.ts

## Purpose

The `logger.ts` file provides a structured logging utility with different log levels, colored output, and silent mode support. It's used throughout the codebase for consistent logging.

## Exports

### Types
- **LogLevel**: Log level type
- **LoggerOptions**: Logger configuration options

### Classes
- **Logger**: Logger class

### Instances
- **logger**: Singleton logger instance

## Type Definitions

### LogLevel

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error';
```

Log levels in order of severity (lowest to highest):
- **trace**: Most verbose, detailed tracing
- **debug**: Debug information
- **info**: General information
- **warning**: Warnings
- **error**: Errors

### LoggerOptions

```typescript
interface LoggerOptions {
  silent?: boolean;      // Enable silent mode (no output except errors)
  logLevel?: LogLevel;   // Minimum log level to display
}
```

## Logger Class

### Constructor

**Parameters**:
- **options**: `LoggerOptions` (optional) - Logger configuration

**Behavior**:
- Sets `silent` mode (default: `false`)
- Determines log level from:
  1. `PUSHGUARD_LOG_LEVEL` environment variable (if set and valid)
  2. `options.logLevel` (if provided)
  3. Default: `'info'`

**Fields**:
- **silent**: `boolean` - Whether logger is in silent mode
- **logLevel**: `LogLevel` - Minimum log level to display

### Methods

#### shouldLog()

**Purpose**: Determines if a message at a given level should be logged.

**Parameters**:
- **level**: `LogLevel` - Log level to check

**Returns**: `boolean` - `true` if should log, `false` otherwise

**Behavior**:
- If silent mode and level is not 'error', returns `false`
- Otherwise, returns `true` if level is at or above current log level

#### trace()

**Purpose**: Logs a trace-level message.

**Parameters**:
- **message**: `string` - Message to log

**Returns**: `void`

**Behavior**: Logs message with gray `⊹` prefix if trace level is enabled.

#### debug()

**Purpose**: Logs a debug-level message.

**Parameters**:
- **message**: `string` - Message to log

**Returns**: `void`

**Behavior**: Logs message with cyan `⊹` prefix if debug level is enabled.

#### info()

**Purpose**: Logs an info-level message.

**Parameters**:
- **message**: `string` - Message to log

**Returns**: `void`

**Behavior**: Logs message with blue `ℹ` prefix if info level is enabled.

#### success()

**Purpose**: Logs a success message.

**Parameters**:
- **message**: `string` - Message to log

**Returns**: `void`

**Behavior**: Logs message with green `✓` prefix (not affected by log level, only silent mode).

#### warning()

**Purpose**: Logs a warning message.

**Parameters**:
- **message**: `string` - Message to log

**Returns**: `void`

**Behavior**: Logs message with yellow `⚠` prefix if warning level is enabled.

#### error()

**Purpose**: Logs an error message.

**Parameters**:
- **message**: `string` - Message to log

**Returns**: `void`

**Behavior**: Logs message with red `✗` prefix to stderr. Errors are always shown (even in silent mode).

#### setSilent()

**Purpose**: Sets silent mode.

**Parameters**:
- **silent**: `boolean` - Whether to enable silent mode

**Returns**: `void`

**Behavior**: Updates the `silent` field.

#### setLogLevel()

**Purpose**: Sets the minimum log level.

**Parameters**:
- **level**: `LogLevel` - Minimum log level

**Returns**: `void`

**Behavior**: Updates the `logLevel` field.

## Singleton Instance

A singleton logger instance is exported:

```typescript
export const logger = new Logger();
```

This instance is used throughout the codebase for logging.

## Log Level Hierarchy

Log levels are ordered by severity:
- `trace` (0) - Most verbose
- `debug` (1)
- `info` (2) - Default
- `warning` (3)
- `error` (4) - Always shown

Messages at or above the current log level are displayed.

## Environment Variable

The logger respects the `PUSHGUARD_LOG_LEVEL` environment variable:
- Set to one of: `trace`, `debug`, `info`, `warning`, `error`
- Overrides default log level
- Case-insensitive

## Color Coding

Messages are color-coded using chalk:
- **trace**: Gray
- **debug**: Cyan
- **info**: Blue
- **success**: Green
- **warning**: Yellow
- **error**: Red

## Silent Mode

When silent mode is enabled:
- Only error messages are shown
- All other messages are suppressed
- Useful for CI/non-interactive environments

## Dependencies

- `chalk`: For terminal colors

## Usage Examples

### Basic logging
```typescript
import { logger } from './utils/logger.js';

logger.info('Starting review...');
logger.success('Review completed');
logger.warning('Rate limit reached');
logger.error('Review failed');
```

### Setting log level
```typescript
logger.setLogLevel('debug');
logger.debug('This will be shown');
logger.trace('This will not be shown');
```

### Silent mode
```typescript
logger.setSilent(true);
logger.info('This will not be shown');
logger.error('This will be shown (errors always shown)');
```

## Notes

- Errors are always shown (even in silent mode)
- Success messages are not affected by log level (only silent mode)
- Log level can be set via environment variable
- Colors are automatically disabled in non-TTY environments (chalk handles this)
