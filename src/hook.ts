import { loadConfig, type Config, type Provider } from './config.js';
import { loadState, type State, clearState, cleanupExpiredState } from './state.js';
import { forceSilentMode, shouldAllowInteractive } from './utils/tty.js';
import { logger } from './utils/logger.js';
import { getDiff } from './utils/git.js';
import { createProvider, getApiKeyEnvVar } from './llm/factory.js';
import { getTimeoutForPreset } from './prompts/builder.js';
import type { ReviewResult, Issue, AgentPreset } from './llm/index.js';
import { MAX_DIFF_CHARS } from './constants.js';
import { canProceedWithReview, recordReviewCompletion, getTimeUntilNextReview } from './utils/ratelimit.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

export async function runHook(): Promise<void> {
  // Clean up expired state proactively
  cleanupExpiredState();
  
  // Force silent mode in non-TTY/CI environments
  const silent = forceSilentMode();
  if (silent) {
    logger.setSilent(true);
  }

  // Check for explicit interactive override
  const interactiveEnv = process.env.PUSHGUARD_INTERACTIVE === '1';
  const canBeInteractive = shouldAllowInteractive() && interactiveEnv;

  // Check rate limiting
  if (!canProceedWithReview()) {
    const waitTime = getTimeUntilNextReview();
    const waitSeconds = Math.ceil(waitTime / 1000);
    logger.warning(
      `Rate limit: Please wait ${waitSeconds} second${waitSeconds !== 1 ? 's' : ''} before running another review.`
    );
    logger.warning('Allowing push to continue (rate limit bypass)');
    process.exit(0);
  }

  // Load configuration
  const config = loadConfig();
  
  // Check for temporary state overrides
  const state = loadState();
  
  // Determine effective mode (state may be cleared by determineModel if expired)
  const effectiveModel = await determineModel(config, state, canBeInteractive);
  
  // Re-check state in case it was cleared due to expiration
  const currentState = loadState();
  const effectivePreset = currentState?.overridePreset || config.agent_preset;
  
  logger.debug(`Configuration: provider=${config.provider}, model=${effectiveModel}, preset=${effectivePreset}`);
  logger.info(`Using model: ${effectiveModel} (${effectivePreset})`);
  
  // Warn if model is unknown
  try {
    const { warnIfModelUnknown } = await import('./llm/models.js');
    const warning = warnIfModelUnknown(config.provider, effectiveModel);
    if (warning) {
      logger.warning(warning);
    }
  } catch {
    // Models module might not be available, ignore
  }
  
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
  // Check state expiration before using it
  if (state?.expiresAt && Date.now() > state.expiresAt) {
    // State expired, clear it and continue with config defaults
    clearState();
    state = null;
  }
  
  // Use temporary override if present and valid
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
    if (diff.length > MAX_DIFF_CHARS) {
      logger.warning(
        `Diff too large (${diff.length} chars), truncating to ${MAX_DIFF_CHARS}`
      );
      diff = diff.substring(0, MAX_DIFF_CHARS) + '\n... (truncated)';
    }
    
    if (!diff.trim()) {
      logger.info('No changes to review');
      process.exit(0);
    }
    
    return diff;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warning(`Failed to get diff: ${message}`);
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
  const apiKeyEnvVar = getApiKeyEnvVar(provider);
  const apiKey = process.env[apiKeyEnvVar];
  
  if (!apiKey) {
    throw new Error(
      `Missing API key: ${apiKeyEnvVar}\n` +
      `Please set it as an environment variable:\n` +
      `  export ${apiKeyEnvVar}="your-api-key"\n` +
      `Or on Windows:\n` +
      `  $env:${apiKeyEnvVar}="your-api-key"`
    );
  }
  
  const llmProvider = createProvider(provider, { apiKey, model });
  const timeout = getTimeoutForPreset(preset);
  
  try {
    logger.info('Reviewing code changes...');
    // Provider handles preset-specific prompt building internally
    return await llmProvider.review(diff, preset, timeout);
  } catch (error) {
    // Fail-open: if LLM fails, warn but allow push
    if (error instanceof Error) {
      // Check if it's a ReviewError with context
      if ('context' in error) {
        const reviewError = error as { context?: { provider: string; model: string; errorType: string } };
        logger.warning(
          `Review failed (${reviewError.context?.provider || 'unknown'}/${reviewError.context?.model || 'unknown'}): ${error.message}`
        );
        if (reviewError.context?.errorType === 'timeout') {
          logger.warning('Hint: Review timed out. Try using a faster model or increasing timeout.');
        } else if (reviewError.context?.errorType === 'api') {
          logger.warning('Hint: API error occurred. Check your API key and provider configuration.');
        }
      } else {
        logger.warning(`Review failed: ${error.message}`);
      }
    } else {
      logger.warning('Review failed: Unknown error');
    }
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
  
  // Record review completion for rate limiting
  recordReviewCompletion();
  
  if (!result.hasIssues) {
    logger.success('No issues found. Push allowed.');
    // Clear state on any hook completion (not just success)
    clearState();
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
  
  // Clear state on completion even if issues found
  clearState();
  process.exit(1);
}
