# 02 - Repository Folder Structure

**Goal:** Create the complete directory structure for PushGuard source code and configuration.

Create all necessary directories in one command:

```bash
mkdir -p src/llm src/prompts src/utils .pushguard scripts
```

Verify the structure exists:

```bash
tree -L 2 -a
```

You should see:

```
.
├── .pushguard/
├── scripts/
├── src/
│   ├── llm/
│   ├── prompts/
│   └── utils/
└── package.json
```

Create placeholder `.gitkeep` files to ensure empty directories are tracked:

```bash
touch .pushguard/.gitkeep
touch src/llm/.gitkeep
touch src/prompts/.gitkeep
touch src/utils/.gitkeep
```

Commit the structure:

```bash
git add .
git commit -m "Add repository folder structure"
```

Next step: [03-package-json-and-basic-dependencies.md](03-package-json-and-basic-dependencies.md)
