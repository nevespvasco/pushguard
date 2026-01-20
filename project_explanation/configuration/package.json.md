# package.json

## Purpose

The `package.json` file defines the project metadata, dependencies, build scripts, and package configuration for PushGuard. It serves as the manifest for the npm package and contains all information needed to build, install, and run the project.

## Fields

### Basic Metadata
- **name**: `"pushguard"` - The npm package name
- **version**: `"1.0.0"` - Current version of the package
- **type**: `"module"` - Indicates this is an ES module project (uses `import/export` syntax)
- **description**: `"AI-powered git pre-push hook for code review"` - Package description for npm

### Binary Entry Point
- **bin**: `{ "pushguard": "./dist/cli.js" }`
  - Defines the CLI command name and entry point
  - When installed globally, users can run `pushguard` command
  - Points to the compiled JavaScript file in the `dist/` directory

### Engine Requirements
- **engines**: `{ "node": ">=20.0.0" }`
  - Specifies minimum Node.js version required
  - Node 20+ is required for modern ES module features and APIs

### Scripts
- **build**: `"tsc && npm run copy-prompts"`
  - Compiles TypeScript to JavaScript
  - Then copies prompt template files to dist directory
- **copy-prompts**: `"node scripts/copy-prompts.js"`
  - Copies prompt template files from `src/prompts/` to `dist/prompts/`
  - Ensures prompt files are available in the built package
- **dev**: `"tsx src/cli.ts"`
  - Development mode using `tsx` for direct TypeScript execution
  - Allows running without building first
- **prepublishOnly**: `"npm run build"`
  - Automatically runs before `npm publish`
  - Ensures package is built before publishing

### Dependencies

#### Runtime Dependencies
- **chalk**: `^5.3.0` - Terminal string styling (colors, formatting)
- **commander**: `^11.1.0` - CLI framework for command parsing
- **inquirer**: `^9.2.15` - Interactive command-line prompts
- **js-yaml**: `^4.1.0` - YAML parser for config file
- **openai**: `^4.24.1` - OpenAI API client
- **@anthropic-ai/sdk**: `^0.20.0` - Anthropic Claude API client
- **@google/genai**: `^0.8.0` - Google Gemini API client
- **zod**: `^3.22.4` - TypeScript-first schema validation
- **ora**: `^7.0.1` - Terminal spinner for loading states

#### Development Dependencies
- **@types/inquirer**: `^9.0.7` - TypeScript types for inquirer
- **@types/js-yaml**: `^4.0.9` - TypeScript types for js-yaml
- **@types/node**: `^20.11.0` - TypeScript types for Node.js
- **typescript**: `^5.3.3` - TypeScript compiler
- **tsx**: `^4.7.0` - TypeScript execution for development

### Package Metadata
- **keywords**: `["git", "hook", "pre-push", "ai", "code-review"]` - npm search keywords
- **author**: Empty string (not specified)
- **license**: `"MIT"` - MIT License
- **files**: `["dist/", "README.md"]` - Files included in npm package
  - Only includes built files and README
  - Source files are excluded from published package
- **repository**: Git repository information
  - **type**: `"git"`
  - **url**: `"https://github.com/vasconevesxd/pushguard.git"`

## Usage

This file is used by:
- **npm/yarn/pnpm**: To install dependencies and run scripts
- **npm publish**: To determine what files to include in the package
- **CI/CD systems**: To install dependencies and build the project
- **Package managers**: To resolve dependencies and check compatibility

## Build Process

1. `npm install` - Installs all dependencies
2. `npm run build` - Compiles TypeScript and copies prompts
3. `npm run dev` - Runs in development mode (no build required)
4. `npm publish` - Builds and publishes to npm registry
