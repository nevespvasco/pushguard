# 13 - State Management for Overrides

**Goal:** Create temporary state management for one-time model overrides.

Create `src/state.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const STATE_PATH = join(process.cwd(), '.pushguard', '.state.json');

export interface State {
  overrideModel?: string;
  overridePreset?: 'strict' | 'balanced' | 'permissive';
  expiresAt?: number;
}

export function loadState(): State | null {
  if (!existsSync(STATE_PATH)) {
    return null;
  }
  
  try {
    const content = readFileSync(STATE_PATH, 'utf-8');
    const state: State = JSON.parse(content);
    
    // Check expiration (24 hours)
    if (state.expiresAt && Date.now() > state.expiresAt) {
      clearState();
      return null;
    }
    
    return state;
  } catch {
    return null;
  }
}

export function saveState(state: State): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export function clearState(): void {
  if (existsSync(STATE_PATH)) {
    unlinkSync(STATE_PATH);
  }
}
```

This enables temporary overrides via `pushguard review --model ...`.

Next step: [14-llm-interfaces-and-types.md](14-llm-interfaces-and-types.md)
