# 05 - GitIgnore and Initial Commit

**Goal:** Create .gitignore to exclude build artifacts, dependencies, and sensitive files.

Create `.gitignore` in the project root:

```gitignore
# Dependencies
node_modules/
pnpm-lock.yaml
package-lock.json
yarn.lock

# Build output
dist/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary state (gitignored by design)
.pushguard/.state.json

# Environment variables (user-specific)
.env
.env.local

# Logs
*.log
npm-debug.log*
```

Note: `.pushguard/.state.json` is intentionally gitignored as it contains temporary overrides.

Create `.gitkeep` in `.pushguard` to track the directory:

```bash
touch .pushguard/.gitkeep
```

Commit all setup files:

```bash
git add .gitignore .pushguard/.gitkeep
git commit -m "Add .gitignore and ensure .pushguard directory is tracked"
```

Next step: [06-default-config-directory.md](06-default-config-directory.md)
