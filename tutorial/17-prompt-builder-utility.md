# 17 - Prompt Builder Utility

**Goal:** Create utility to load and build prompts with git diff injection.

Create `src/prompts/builder.ts`:

```typescript
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AgentPreset } from '../llm/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPT_FILES: Record<AgentPreset, string> = {
  strict: join(__dirname, 'strict-review.txt'),
  balanced: join(__dirname, 'balanced-review.txt'),
  permissive: join(__dirname, 'permissive-review.txt'),
};

export function loadPrompt(preset: AgentPreset): string {
  const filePath = PROMPT_FILES[preset];
  return readFileSync(filePath, 'utf-8').trim();
}

export function buildPrompt(preset: AgentPreset, diff: string): string {
  const systemPrompt = loadPrompt(preset);
  return `${systemPrompt}\n\n---\n\nGit diff to review:\n\n\`\`\`diff\n${diff}\n\`\`\``;
}

export function getTimeoutForPreset(preset: AgentPreset): number {
  switch (preset) {
    case 'strict':
      return 45000; // 45s
    case 'balanced':
      return 30000; // 30s
    case 'permissive':
      return 15000; // 15s
  }
}
```

This centralizes prompt management and timeout configuration.

Next step: [18-openai-provider-implementation.md](18-openai-provider-implementation.md)
