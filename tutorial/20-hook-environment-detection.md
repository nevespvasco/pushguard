# 20 - Hook Environment Detection

**Goal:** Implement environment detection logic in the hook entry point.

Create `src/hook.ts` with initial detection:

```typescript
import { loadConfig } from './config.js';
import { loadState } from './state.js';
import { forceSilentMode, shouldAllowInteractive } from './utils/tty.js';
import { logger } from './utils/logger.js';
import process from 'process';

export async function runHook(): Promise<void> {
  // Force silent mode in non-TTY/CI environments
  const silent = forceSilentMode();
  if (silent) {
    logger.setSilent(true);
  }

  // Check for explicit interactive override
  const interactiveEnv = process.env.PUSHGUARD_INTERACTIVE === '1';
  const canBeInteractive = shouldAllowInteractive() && interactiveEnv;

  // Load configuration
  const config = loadConfig();
  
  // Check for temporary state overrides
  const state = loadState();
  
  // Determine effective mode
  const effectiveModel = state?.overrideModel || config.model;
  const effectivePreset = state?.overridePreset || config.agent_preset;
  
  logger.info(`Using model: ${effectiveModel} (${effectivePreset})`);
  
  // Continue with hook logic...
}
```

This establishes the decision tree for mode determination.

Next step: [21-hook-mode-determination.md](21-hook-mode-determination.md)
