# 12 - Config Writer Implementation

**Goal:** Implement configuration writing for interactive mode preferences.

Add to `src/config.ts`:

```typescript
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import type { Config } from './config-schema.js';

const CONFIG_PATH = join(process.cwd(), '.pushguard', 'config.yml');

export function saveConfig(config: Config): void {
  const dir = dirname(CONFIG_PATH);
  mkdirSync(dir, { recursive: true });
  
  const yamlContent = yaml.dump(config, {
    indent: 2,
    lineWidth: 80,
  });
  
  writeFileSync(CONFIG_PATH, yamlContent, 'utf-8');
}

export function updateConfig(updates: Partial<Config>): Config {
  const current = loadConfig();
  const updated = { ...current, ...updates };
  saveConfig(updated);
  return updated;
}
```

These functions enable saving user preferences from interactive mode.

Next step: [13-state-management-for-overrides.md](13-state-management-for-overrides.md)
