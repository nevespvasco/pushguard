# 04 - TypeScript and TSConfig Setup

**Goal:** Configure TypeScript with ESM support and strict type checking.

Create `tsconfig.json` in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Test the TypeScript configuration:

```bash
pnpm exec tsc --noEmit
```

Should complete without errors (no files yet, but config is valid).

Commit the TypeScript configuration:

```bash
git add tsconfig.json
git commit -m "Configure TypeScript with ESM and strict mode"
```

Next step: [05-gitignore-and-initial-commit.md](05-gitignore-and-initial-commit.md)
