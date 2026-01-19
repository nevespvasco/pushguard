#!/usr/bin/env node

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const hookPath = join(projectRoot, '.git', 'hooks', 'pre-push');

if (!existsSync(join(projectRoot, '.git'))) {
  console.error('❌ Not in a git repository');
  process.exit(1);
}

const hookContent = `#!/bin/sh
# PushGuard pre-push hook
exec pushguard hook "$@"
`;

mkdirSync(dirname(hookPath), { recursive: true });
writeFileSync(hookPath, hookContent, 'utf-8');
chmodSync(hookPath, 0o755);

console.log('✅ Pre-push hook installed successfully');
console.log(`   Location: ${hookPath}`);
console.log('\n   The hook will run automatically on: git push');
console.log('   To bypass: git push --no-verify');
