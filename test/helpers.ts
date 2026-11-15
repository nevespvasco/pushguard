import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Creates an isolated temporary directory that stands in for a git repo root.
 */
export function makeTempRepo(): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), 'pushguard-test-'));
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/**
 * Thrown by the mocked process.exit so tests can assert on the exit code
 * without terminating the test runner.
 */
export class ExitCalled extends Error {
  constructor(public readonly code: number | undefined) {
    super(`process.exit(${code})`);
    this.name = 'ExitCalled';
  }
}
