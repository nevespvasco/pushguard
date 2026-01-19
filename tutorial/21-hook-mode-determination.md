# 21 - Hook Mode Determination

**Goal:** Complete mode determination logic with interactive prompt support.

Add to `src/hook.ts`:

```typescript
import inquirer from 'inquirer';

async function determineModel(
  config: Config,
  state: State | null,
  canBeInteractive: boolean
): Promise<string> {
  // Use temporary override if present
  if (state?.overrideModel) {
    return state.overrideModel;
  }
  
  // Interactive mode: prompt for model
  if (canBeInteractive) {
    const models = config.models || {};
    const choices = [
      { name: `Default (${config.model})`, value: config.model },
      ...Object.entries(models).map(([key, value]) => ({
        name: `${key}: ${value}`,
        value,
      })),
      { name: 'Custom model', value: 'custom' },
    ];
    
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select model for review:',
        choices,
      },
    ]);
    
    if (model === 'custom') {
      const { customModel } = await inquirer.prompt([
        { type: 'input', name: 'customModel', message: 'Model name:' },
      ]);
      return customModel;
    }
    
    return model;
  }
  
  // Silent mode: use config default
  return config.model;
}
```

This enables explicit opt-in interactive model selection.

Next step: [22-hook-git-diff-extraction.md](22-hook-git-diff-extraction.md)
