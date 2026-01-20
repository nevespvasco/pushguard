#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const srcDir = join(projectRoot, 'src', 'prompts');
const distDir = join(projectRoot, 'dist', 'prompts');

// Create dist/prompts directory if it doesn't exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy prompt files
const promptFiles = ['strict-review.txt', 'balanced-review.txt', 'permissive-review.txt'];

for (const file of promptFiles) {
  const srcPath = join(srcDir, file);
  const distPath = join(distDir, file);
  
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, distPath);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`Warning: ${srcPath} not found`);
  }
}

console.log('✓ Prompt files copied successfully');
