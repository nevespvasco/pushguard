# 01 - Initial Project Setup

**Goal:** Initialize a new Node.js project with package.json and Git repository.

Create the project directory and initialize it:

```bash
git init
```

Create `package.json`:

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
  "keywords": ["git", "hook", "pre-push", "ai", "code-review"],
  "author": "",
  "license": "MIT"
}
```

Initialize Git and create initial commit:

```bash
git add package.json
git commit -m "Initial project setup"
```

Next step: [02-repository-folder-structure.md](02-repository-folder-structure.md)
