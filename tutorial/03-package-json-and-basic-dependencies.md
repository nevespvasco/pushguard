# 03 - Package.json and Basic Dependencies

**Goal:** Add all production and development dependencies to package.json.

Update `package.json` with all required dependencies:

```json
{
  "name": "pushguard",
  "version": "1.0.0",
  "type": "module",
  "description": "AI-powered git pre-push hook for code review",
  "bin": {
    "pushguard": "./dist/cli.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "inquirer": "^9.2.15",
    "js-yaml": "^4.1.0",
    "openai": "^4.24.1",
    "@anthropic-ai/sdk": "^0.20.0",
    "zod": "^3.22.4",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.7",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  },
  "keywords": ["git", "hook", "pre-push", "ai", "code-review"],
  "author": "",
  "license": "MIT"
}
```

Install dependencies:

```bash
pnpm install
```

Or with npm:

```bash
npm install
```

Commit the changes:

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add dependencies"
```

Next step: [04-typescript-and-tsconfig-setup.md](04-typescript-and-tsconfig-setup.md)
