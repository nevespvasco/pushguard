import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { makeTempRepo } from './helpers.js';
import { MAX_CONFIG_SIZE } from '../src/constants.js';

const git = vi.hoisted(() => ({ root: '' }));

vi.mock('../src/utils/git.js', () => ({
  getGitRoot: () => git.root,
}));

// config.ts resolves its paths at import time, so load a fresh copy per test
async function importConfig() {
  vi.resetModules();
  return import('../src/config.js');
}

const DEFAULTS = { provider: 'openai', model: 'gpt-4o-mini', agent_preset: 'strict' };

describe('config', () => {
  let cleanup: () => void;
  let configDir: string;

  beforeEach(() => {
    const repo = makeTempRepo();
    git.root = repo.root;
    cleanup = repo.cleanup;
    configDir = join(repo.root, '.pushguard');
    mkdirSync(configDir, { recursive: true });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => cleanup());

  const writeYaml = (content: string) => writeFileSync(join(configDir, 'config.yml'), content);
  const writeJson = (content: unknown) =>
    writeFileSync(join(configDir, 'config.json'), JSON.stringify(content));

  describe('loadConfig', () => {
    it('returns the defaults when no config file exists', async () => {
      const { loadConfig } = await importConfig();
      expect(loadConfig()).toEqual(DEFAULTS);
    });

    it('loads a valid YAML config', async () => {
      writeYaml(
        [
          'provider: anthropic',
          'model: claude-3-5-sonnet-20241022',
          'agent_preset: balanced',
          'models:',
          '  fast: claude-3-haiku-20240307',
        ].join('\n')
      );
      const { loadConfig } = await importConfig();
      expect(loadConfig()).toEqual({
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        agent_preset: 'balanced',
        models: { fast: 'claude-3-haiku-20240307' },
      });
    });

    it('applies schema defaults for omitted provider and preset', async () => {
      writeYaml('model: gpt-4o');
      const { loadConfig } = await importConfig();
      expect(loadConfig()).toEqual({ provider: 'openai', model: 'gpt-4o', agent_preset: 'strict' });
    });

    it('drops unknown keys such as the legacy "interactive" flag', async () => {
      writeYaml('provider: gemini\nmodel: gemini-1.5-pro\ninteractive: true');
      const { loadConfig } = await importConfig();
      expect(loadConfig()).not.toHaveProperty('interactive');
    });

    it('falls back to config.json when there is no config.yml', async () => {
      writeJson({ provider: 'gemini', model: 'gemini-1.5-flash', agent_preset: 'permissive' });
      const { loadConfig } = await importConfig();
      expect(loadConfig()).toEqual({
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        agent_preset: 'permissive',
      });
    });

    it('prefers config.yml over config.json', async () => {
      writeYaml('provider: anthropic\nmodel: from-yaml');
      writeJson({ provider: 'gemini', model: 'from-json' });
      const { loadConfig } = await importConfig();
      expect(loadConfig().model).toBe('from-yaml');
    });

    it.each([
      ['an unknown provider', 'provider: ollama\nmodel: llama3'],
      ['an unknown preset', 'model: gpt-4o\nagent_preset: yolo'],
      ['an empty model', 'model: ""'],
      ['a missing model', 'provider: anthropic'],
      ['a non-string model', 'model: [1, 2, 3]'],
      ['a scalar document', 'just a string'],
    ])('falls back to the defaults and warns on %s', async (_label, content) => {
      writeYaml(content);
      const { loadConfig } = await importConfig();
      expect(loadConfig()).toEqual(DEFAULTS);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid config'),
        expect.any(String)
      );
    });

    it('rejects an oversized YAML config before parsing it', async () => {
      writeYaml(`model: gpt-4o\n# ${'x'.repeat(MAX_CONFIG_SIZE)}`);
      const { loadConfig } = await importConfig();
      expect(() => loadConfig()).toThrow(/Config file too large/);
    });

    it('rejects an oversized JSON config before parsing it', async () => {
      writeJson({ model: 'gpt-4o', padding: 'x'.repeat(MAX_CONFIG_SIZE) });
      const { loadConfig } = await importConfig();
      expect(() => loadConfig()).toThrow(/Config file too large/);
    });
  });

  describe('safe YAML parsing', () => {
    it.each([
      ['!!js/function', 'model: !!js/function "function () { return process.exit(1) }"'],
      ['!!js/regexp', 'model: !!js/regexp /.*/'],
      ['!!js/undefined', 'model: !!js/undefined ""'],
      ['!!python/object', 'model: !!python/object:os.system ["id"]'],
    ])('refuses the executable %s tag', async (_tag, content) => {
      writeYaml(content);
      const { loadConfig } = await importConfig();
      expect(() => loadConfig()).toThrow(/unknown tag/);
    });

    it('does not pollute Object.prototype through a __proto__ key', async () => {
      writeYaml('model: gpt-4o\n__proto__:\n  polluted: true');
      const { loadConfig } = await importConfig();
      const config = loadConfig();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(config).toEqual({ provider: 'openai', model: 'gpt-4o', agent_preset: 'strict' });
    });
  });

  describe('saveConfig / updateConfig', () => {
    it('writes YAML that loadConfig reads back', async () => {
      const { saveConfig, loadConfig } = await importConfig();
      const config = {
        provider: 'anthropic' as const,
        model: 'claude-3-haiku-20240307',
        agent_preset: 'permissive' as const,
      };
      saveConfig(config);
      expect(readFileSync(join(configDir, 'config.yml'), 'utf-8')).toContain('provider: anthropic');
      expect(loadConfig()).toEqual(config);
    });

    it('merges updates into the existing config', async () => {
      writeYaml('provider: anthropic\nmodel: claude-3-haiku-20240307\nagent_preset: strict');
      const { updateConfig, loadConfig } = await importConfig();
      expect(updateConfig({ agent_preset: 'balanced' })).toEqual({
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        agent_preset: 'balanced',
      });
      expect(loadConfig().agent_preset).toBe('balanced');
    });
  });
});
