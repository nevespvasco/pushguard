# tsconfig.json

## Purpose

The `tsconfig.json` file configures the TypeScript compiler for the PushGuard project. It defines compilation options, output settings, and which files to include/exclude.

## Configuration Options

### Compiler Options

#### Target and Module
- **target**: `"ES2022"`
  - Compiles to ECMAScript 2022 syntax
  - Ensures compatibility with Node.js 20+ features
- **module**: `"ESNext"`
  - Uses the latest ES module system
  - Supports `import/export` syntax
- **lib**: `["ES2022"]`
  - Includes ES2022 type definitions
  - Provides types for modern JavaScript features

#### Module Resolution
- **moduleResolution**: `"node"`
  - Uses Node.js module resolution algorithm
  - Resolves modules from `node_modules` and relative paths
- **esModuleInterop**: `true`
  - Enables interoperability between CommonJS and ES modules
  - Allows importing CommonJS modules with default imports

#### Output Configuration
- **outDir**: `"./dist"`
  - Output directory for compiled JavaScript files
  - All `.ts` files are compiled to `.js` in this directory
- **rootDir**: `"./src"`
  - Root directory of source files
  - Maintains directory structure in output

#### Type Checking
- **strict**: `true`
  - Enables all strict type checking options
  - Includes: `strictNullChecks`, `strictFunctionTypes`, etc.
- **noUnusedLocals**: `true`
  - Error on unused local variables
  - Helps maintain clean code
- **noUnusedParameters**: `true`
  - Error on unused function parameters
  - Prevents dead code
- **noImplicitReturns**: `true`
  - Error if function doesn't return in all code paths
  - Ensures all code paths return a value
- **noFallthroughCasesInSwitch**: `true`
  - Error on fallthrough cases in switch statements
  - Prevents accidental fallthrough bugs

#### Other Options
- **skipLibCheck**: `true`
  - Skips type checking of declaration files (`.d.ts`)
  - Speeds up compilation
- **forceConsistentCasingInFileNames**: `true`
  - Enforces consistent file name casing
  - Prevents issues on case-sensitive file systems
- **resolveJsonModule**: `true`
  - Allows importing JSON files as modules
  - Used for reading configuration files

#### Declaration Files
- **declaration**: `true`
  - Generates `.d.ts` declaration files
  - Enables TypeScript support for consumers
- **declarationMap**: `true`
  - Generates source maps for declaration files
  - Enables "Go to Definition" to source files
- **sourceMap**: `true`
  - Generates `.js.map` source map files
  - Enables debugging of compiled JavaScript

### File Inclusion
- **include**: `["src/**/*"]`
  - Includes all files in `src/` directory and subdirectories
  - Only TypeScript files in `src/` are compiled

### File Exclusion
- **exclude**: `["node_modules", "dist"]`
  - Excludes `node_modules` from compilation
  - Excludes `dist` (output directory) from compilation
  - Prevents circular compilation issues

## Impact on Build

This configuration ensures:
- **Type Safety**: Strict checking catches errors at compile time
- **Modern JavaScript**: Output uses ES2022 features
- **Module System**: Uses ES modules for better tree-shaking
- **Debugging**: Source maps enable debugging of compiled code
- **Clean Code**: Unused code detection prevents dead code

## Usage

The TypeScript compiler (`tsc`) reads this file automatically when run from the project root. The build script (`npm run build`) uses this configuration to compile all TypeScript files.
