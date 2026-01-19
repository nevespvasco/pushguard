# 26 - CLI Review Command

**Goal:** Implement the `pushguard review` command for setting temporary overrides.

Add to `src/cli.ts`:

```typescript
import { saveState } from './state.js';
import { loadConfig } from './config.js';

program
  .command('review')
  .description('Set temporary model/preset override for next push')
  .option('-m, --model <model>', 'Model to use (e.g., o1-preview)')
  .option('-p, --preset <preset>', 'Preset (strict | balanced | permissive)')
  .action((options) => {
    showBanner();
    
    const config = loadConfig();
    const model = options.model || config.model;
    const preset = options.preset || config.agent_preset;
    
    // Validate preset
    if (!['strict', 'balanced', 'permissive'].includes(preset)) {
      console.error(chalk.red(`Invalid preset: ${preset}`));
      process.exit(1);
    }
    
    saveState({
      overrideModel: model,
      overridePreset: preset,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    console.log(chalk.green(`✓ Override set for next push:`));
    console.log(chalk.gray(`  Model: ${model}`));
    console.log(chalk.gray(`  Preset: ${preset}`));
  });
```

This enables power users to override settings for one push.

Next step: [27-cli-config-and-install-commands.md](27-cli-config-and-install-commands.md)
