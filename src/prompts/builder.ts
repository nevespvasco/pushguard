import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AgentPreset } from '../llm/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPT_FILES: Record<AgentPreset, string> = {
  strict: join(__dirname, 'strict-review.txt'),
  balanced: join(__dirname, 'balanced-review.txt'),
  permissive: join(__dirname, 'permissive-review.txt'),
};

// Cache loaded prompts in memory to avoid repeated file reads
const promptCache: Partial<Record<AgentPreset, string>> = {};

export function loadPrompt(preset: AgentPreset): string {
  // Return cached prompt if available
  if (promptCache[preset]) {
    return promptCache[preset]!;
  }
  
  const filePath = PROMPT_FILES[preset];
  const content = readFileSync(filePath, 'utf-8').trim();
  
  // Cache the loaded prompt
  promptCache[preset] = content;
  return content;
}

export function getTimeoutForPreset(preset: AgentPreset): number {
  switch (preset) {
    case 'strict':
      return 45000; // 45s
    case 'balanced':
      return 30000; // 30s
    case 'permissive':
      return 15000; // 15s
  }
}
