import { z } from 'zod';

const ProviderSchema = z.enum(['openai', 'anthropic', 'gemini']);

const AgentPresetSchema = z.enum(['strict', 'balanced', 'permissive']);

const ModelsSchema = z.record(z.string()).optional();

export const ConfigSchema = z.object({
  provider: ProviderSchema.default('openai'),
  model: z.string().min(1),
  agent_preset: AgentPresetSchema.default('strict'),
  // Note: Interactive mode is controlled via PUSHGUARD_INTERACTIVE=1 env var, not config
  models: ModelsSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type AgentPreset = z.infer<typeof AgentPresetSchema>;

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { getGitRoot } from './utils/git.js';
import yaml from 'js-yaml';
import { MAX_CONFIG_SIZE } from './constants.js';

/**
 * Get the config directory path, ensuring we're in a git repository
 */
function getConfigDir(): string {
  // Try to find git root relative to repo
  try {
    const gitRoot = getGitRoot();
    return join(gitRoot, '.pushguard');
  } catch {
    // If not in git repo, use current directory (will fail later if needed)
    return join(process.cwd(), '.pushguard');
  }
}

const CONFIG_DIR = getConfigDir();
const CONFIG_PATH = join(CONFIG_DIR, 'config.yml');
const CONFIG_JSON_PATH = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  agent_preset: 'strict',
};

export function loadConfig(): Config {
  let raw: unknown;
  
  if (existsSync(CONFIG_PATH)) {
    // Check file size before reading to prevent memory exhaustion
    const stats = statSync(CONFIG_PATH);
    if (stats.size > MAX_CONFIG_SIZE) {
      throw new Error(
        `Config file too large: ${stats.size} bytes (max: ${MAX_CONFIG_SIZE} bytes). ` +
        `Please reduce the file size or split configuration.`
      );
    }
    
    // js-yaml v4 is safe by default (unsafe tags removed unless explicitly enabled)
    // Using DEFAULT_SCHEMA explicitly for clarity, though default is already safe
    raw = yaml.load(readFileSync(CONFIG_PATH, 'utf-8'), {
      schema: yaml.DEFAULT_SCHEMA,
    });
  } else if (existsSync(CONFIG_JSON_PATH)) {
    // Check JSON config file size as well
    const stats = statSync(CONFIG_JSON_PATH);
    if (stats.size > MAX_CONFIG_SIZE) {
      throw new Error(
        `Config file too large: ${stats.size} bytes (max: ${MAX_CONFIG_SIZE} bytes). ` +
        `Please reduce the file size or split configuration.`
      );
    }
    raw = JSON.parse(readFileSync(CONFIG_JSON_PATH, 'utf-8'));
  } else {
    return DEFAULT_CONFIG;
  }
  
  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    console.warn('Invalid config, using defaults:', result.error.message);
    console.warn('Fix your config file or run: pushguard config --interactive');
    return DEFAULT_CONFIG;
  }
  
  return result.data;
}

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
