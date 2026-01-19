import { loadConfig, type Config, type Provider } from './config.js';
import { loadState, type State, clearState } from './state.js';
import { forceSilentMode, shouldAllowInteractive } from './utils/tty.js';
import { logger } from './utils/logger.js';
import { getDiff } from './utils/git.js';
import { createProvider, getApiKeyEnvVar } from './llm/factory.js';
import { getTimeoutForPreset } from './prompts/builder.js';
import type { ReviewResult, Issue, AgentPreset } from './llm/index.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

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
  const effectiveModel = await determineModel(config, state, canBeInteractive);
  const effectivePreset = state?.overridePreset || config.agent_preset;
  
  logger.info(`Using model: ${effectiveModel} (${effectivePreset})`);
  
  // Get diff for review
  const diff = await getReviewDiff();
  
  // Perform review
  const result = await performReview(diff, effectiveModel, effectivePreset, config.provider);
  
  // Handle result
  handleReviewResult(result);
}

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

async function getReviewDiff(): Promise<string> {
  try {
    let diff = getDiff();
    
    // Truncate if too large (rough token estimate: ~4 chars per token)
    const MAX_CHARS = 100000; // ~25k tokens
    if (diff.length > MAX_CHARS) {
      logger.warning(
        `Diff too large (${diff.length} chars), truncating to ${MAX_CHARS}`
      );
      diff = diff.substring(0, MAX_CHARS) + '\n... (truncated)';
    }
    
    if (!diff.trim()) {
      logger.info('No changes to review');
      process.exit(0);
    }
    
    return diff;
  } catch (error) {
    logger.warning(`Failed to get diff: ${error}`);
    // Fail-open: allow push if we can't get diff
    process.exit(0);
    // This will never execute, but TypeScript needs it
    return '';
  }
}

async function performReview(
  diff: string,
  model: string,
  preset: AgentPreset,
  provider: Provider
): Promise<ReviewResult> {
  const apiKey = process.env[getApiKeyEnvVar(provider)];
  
  if (!apiKey) {
    throw new Error(`Missing API key: ${getApiKeyEnvVar(provider)}`);
  }
  
  const llmProvider = createProvider(provider, { apiKey, model });
  const timeout = getTimeoutForPreset(preset);
  
  try {
    logger.info('Reviewing code changes...');
    // Provider handles preset-specific prompt building internally
    return await llmProvider.review(diff, preset, timeout);
  } catch (error) {
    // Fail-open: if LLM fails, warn but allow push
    logger.warning(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.warning('Allowing push to continue (fail-open behavior)');
    return { hasIssues: false, issues: [] };
  }
}

function formatIssue(issue: Issue): string {
  const severityColor = {
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
  }[issue.severity];
  
  const prefix = severityColor(`[${issue.severity.toUpperCase()}]`);
  const location = issue.file
    ? chalk.gray(`${issue.file}:${issue.line || '?'}`)
    : '';
  
  return `${prefix} ${location} ${issue.message}`;
}

function handleReviewResult(result: ReviewResult): void {
  if (result.summary && !logger.silent) {
    console.log('\n' + chalk.bold('Review Summary:'));
    console.log(result.summary + '\n');
  }
  
  if (!result.hasIssues) {
    logger.success('No issues found. Push allowed.');
    clearState(); // Clear temporary overrides after successful review
    process.exit(0);
  }
  
  // Display issues
  console.log('\n' + chalk.bold.red('Issues found:'));
  result.issues.forEach(issue => {
    console.log(formatIssue(issue));
  });
  
  console.log(
    '\n' + chalk.yellow('Push blocked. Review the issues above.') +
    '\n' + chalk.gray('To bypass (not recommended): git push --no-verify')
  );
  
  process.exit(1);
}
