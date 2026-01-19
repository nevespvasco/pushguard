import { z } from 'zod';

const ProviderSchema = z.enum(['openai', 'anthropic', 'groq']);

const AgentPresetSchema = z.enum(['strict', 'balanced', 'permissive']);

const ModelsSchema = z.record(z.string()).optional();

export const ConfigSchema = z.object({
  provider: ProviderSchema.default('openai'),
  model: z.string().min(1),
  agent_preset: AgentPresetSchema.default('strict'),
  interactive: z.boolean().default(false),
  models: ModelsSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type AgentPreset = z.infer<typeof AgentPresetSchema>;

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import yaml from 'js-yaml';

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
