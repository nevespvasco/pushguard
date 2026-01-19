# 11 - Config Loader Implementation

**Goal:** Implement configuration loading from YAML/JSON files with safe defaults.

Add to `src/config.ts`:

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ConfigSchema, type Config } from './config-schema.js';

const CONFIG_PATH = join(process.cwd(), '.pushguard', 'config.yml');
const CONFIG_JSON_PATH = join(process.cwd(), '.pushguard', 'config.json');

const DEFAULT_CONFIG: Config = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  agent_preset: 'strict',
  interactive: false,
};

export function loadConfig(): Config {
  let raw: unknown;
  
  if (existsSync(CONFIG_PATH)) {
    raw = yaml.load(readFileSync(CONFIG_PATH, 'utf-8'));
  } else if (existsSync(CONFIG_JSON_PATH)) {
    raw = JSON.parse(readFileSync(CONFIG_JSON_PATH, 'utf-8'));
  } else {
    return DEFAULT_CONFIG;
  }
  
  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    console.warn('Invalid config, using defaults:', result.error.message);
    return DEFAULT_CONFIG;
  }
  
  return result.data;
}
```

Safe fallback to defaults ensures PushGuard never fails due to config issues.

Next step: [12-config-writer-implementation.md](12-config-writer-implementation.md)
