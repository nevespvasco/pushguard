#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { saveState } from './state.js';
import { loadConfig, updateConfig } from './config.js';
import { writeFileSync, chmodSync, existsSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import { runHook } from './hook.js';

const program = new Command();

program
  .name('pushguard')
  .description('AI-powered git pre-push hook for code review')
  .version('1.0.0');

// ASCII banner
function showBanner() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════╗
║        PushGuard v1.0.0           ║
║   AI-Powered Code Review Hook     ║
╚═══════════════════════════════════╝
  `));
}

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

program
  .command('config')
  .description('View or edit configuration')
  .option('-i, --interactive', 'Interactive config editor')
  .action(async (options) => {
    const config = loadConfig();
    
    if (options.interactive) {
      showBanner();
      
      const { field } = await inquirer.prompt([
        {
          type: 'list',
          name: 'field',
          message: 'Which field would you like to edit?',
          choices: [
            { name: `Provider (current: ${config.provider})`, value: 'provider' },
            { name: `Model (current: ${config.model})`, value: 'model' },
            { name: `Preset (current: ${config.agent_preset})`, value: 'agent_preset' },
            { name: 'Exit without changes', value: 'exit' },
          ],
        },
      ]);
      
      if (field === 'exit') {
        return;
      }
      
      if (field === 'provider') {
        const { provider } = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Select LLM provider:',
            choices: ['openai', 'anthropic', 'groq'],
            default: config.provider,
          },
        ]);
        updateConfig({ provider });
        console.log(chalk.green(`✓ Provider updated to: ${provider}`));
      } else if (field === 'model') {
        const { model } = await inquirer.prompt([
          {
            type: 'input',
            name: 'model',
            message: 'Enter model name:',
            default: config.model,
          },
        ]);
        updateConfig({ model });
        console.log(chalk.green(`✓ Model updated to: ${model}`));
      } else if (field === 'agent_preset') {
        const { preset } = await inquirer.prompt([
          {
            type: 'list',
            name: 'preset',
            message: 'Select agent preset:',
            choices: [
              { name: 'strict - Flags bugs, security, performance, quality', value: 'strict' },
              { name: 'balanced - Flags bugs and security', value: 'balanced' },
              { name: 'permissive - Only critical bugs and security', value: 'permissive' },
            ],
            default: config.agent_preset,
          },
        ]);
        updateConfig({ agent_preset: preset });
        console.log(chalk.green(`✓ Preset updated to: ${preset}`));
      }
    } else {
      console.log(JSON.stringify(config, null, 2));
    }
  });

program
  .command('install')
  .description('Install git pre-push hook')
  .action(() => {
    const hookPath = join(process.cwd(), '.git', 'hooks', 'pre-push');
    
    if (!existsSync(join(process.cwd(), '.git'))) {
      console.error(chalk.red('Not in a git repository'));
      process.exit(1);
    }
    
    const hookContent = `#!/bin/sh
# PushGuard pre-push hook
pushguard hook "$@" || exit 1
`;
    
    writeFileSync(hookPath, hookContent, 'utf-8');
    chmodSync(hookPath, 0o755);
    
    console.log(chalk.green(`✓ Pre-push hook installed at ${hookPath}`));
  });

// Add hook command (called by git)
program
  .command('hook')
  .description('Internal: runs the pre-push hook')
  .action(async () => {
    await runHook();
  });

program.parse();
