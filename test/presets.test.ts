import { describe, expect, it } from 'vitest';
import { getTimeoutForPreset, loadPrompt } from '../src/prompts/builder.js';
import { ConfigSchema } from '../src/config.js';
import { PRESET_TIMEOUTS } from '../src/constants.js';
import type { AgentPreset } from '../src/llm/index.js';

const PRESETS: AgentPreset[] = ['strict', 'balanced', 'permissive'];

describe('review presets', () => {
  it.each(PRESETS)('loads a non-empty prompt for the %s preset', (preset) => {
    const prompt = loadPrompt(preset);
    expect(prompt.length).toBeGreaterThan(0);
    // Every prompt must ask for the JSON shape the providers parse
    expect(prompt).toContain('hasIssues');
  });

  it('uses a different prompt for each preset', () => {
    const prompts = new Set(PRESETS.map((preset) => loadPrompt(preset)));
    expect(prompts.size).toBe(PRESETS.length);
  });

  it('returns the same cached prompt on repeat calls', () => {
    expect(loadPrompt('balanced')).toBe(loadPrompt('balanced'));
  });

  it.each(PRESETS)('maps %s to its configured timeout', (preset) => {
    expect(getTimeoutForPreset(preset)).toBe(PRESET_TIMEOUTS[preset]);
  });

  it('gives stricter presets more time to review', () => {
    expect(getTimeoutForPreset('strict')).toBeGreaterThan(getTimeoutForPreset('balanced'));
    expect(getTimeoutForPreset('balanced')).toBeGreaterThan(getTimeoutForPreset('permissive'));
  });

  it('defaults to the strict preset when none is configured', () => {
    expect(ConfigSchema.parse({ model: 'gpt-4o' }).agent_preset).toBe('strict');
  });

  it('accepts only the three known presets', () => {
    for (const preset of PRESETS) {
      expect(ConfigSchema.safeParse({ model: 'gpt-4o', agent_preset: preset }).success).toBe(true);
    }
    expect(ConfigSchema.safeParse({ model: 'gpt-4o', agent_preset: 'lenient' }).success).toBe(false);
  });
});
