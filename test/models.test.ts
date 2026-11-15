import { describe, expect, it } from 'vitest';
import { getSuggestedModels, validateModel, warnIfModelUnknown } from '../src/llm/models.js';

describe('model validation', () => {
  it.each([
    ['openai', 'gpt-4o-mini'],
    ['anthropic', 'claude-3-5-sonnet-20241022'],
    ['gemini', 'gemini-1.5-pro'],
    ['openai', 'gpt-4o-2024-08-06'],
    ['anthropic', 'claude-sonnet-4.5'],
  ] as const)('accepts %s model %s', (provider, model) => {
    expect(validateModel(provider, model)).toBe(true);
  });

  it.each([
    '',
    'gpt-4o; rm -rf ~',
    'gpt-4o && curl evil.example',
    '$(whoami)',
    '../../etc/passwd',
    'model with spaces',
    'x'.repeat(101),
  ])('rejects %j', (model) => {
    expect(validateModel('openai', model)).toBe(false);
  });

  it('suggests known models for every provider', () => {
    for (const provider of ['openai', 'anthropic', 'gemini'] as const) {
      expect(getSuggestedModels(provider).length).toBeGreaterThan(0);
    }
  });

  it('warns only for models outside the known list', () => {
    expect(warnIfModelUnknown('openai', 'gpt-4o')).toBeNull();
    expect(warnIfModelUnknown('openai', 'my-custom-model')).toMatch(/not in the known openai models list/);
  });
});
