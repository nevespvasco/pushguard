import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { getGitRoot } from './utils/git.js';

export interface State {
  overrideModel?: string;
  overridePreset?: 'strict' | 'balanced' | 'permissive';
  expiresAt?: number;
  lastReviewTime?: number; // For rate limiting
}

/**
 * Get the state file path for the current git repository
 */
function getStatePath(): string {
  try {
    const gitRoot = getGitRoot();
    return join(gitRoot, '.pushguard', '.state.json');
  } catch {
    // Fallback to process.cwd() if not in git repo
    return join(process.cwd(), '.pushguard', '.state.json');
  }
}

/**
 * Clean up expired state
 */
export function cleanupExpiredState(): void {
  const statePath = getStatePath();
  if (!existsSync(statePath)) {
    return;
  }
  
  try {
    const content = readFileSync(statePath, 'utf-8');
    const state: State = JSON.parse(content);
    
    // Check expiration
    if (state.expiresAt && Date.now() > state.expiresAt) {
      clearState();
    }
  } catch {
    // Invalid state file, remove it
    if (existsSync(statePath)) {
      unlinkSync(statePath);
    }
  }
}

export function loadState(): State | null {
  const statePath = getStatePath();
  
  if (!existsSync(statePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(statePath, 'utf-8');
    const state: State = JSON.parse(content);
    
    // Check expiration (24 hours)
    if (state.expiresAt && Date.now() > state.expiresAt) {
      clearState();
      return null;
    }
    
    return state;
  } catch {
    // Invalid state file, remove it
    clearState();
    return null;
  }
}

export function saveState(state: State): void {
  const statePath = getStatePath();
  const dir = dirname(statePath);
  
  // Ensure directory exists
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
  
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function clearState(): void {
  const statePath = getStatePath();
  if (existsSync(statePath)) {
    unlinkSync(statePath);
  }
}
