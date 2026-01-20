/**
 * Application constants
 */

// Diff limits
export const MAX_DIFF_CHARS = 100000; // ~25k tokens (4 chars per token estimate)

// State management
export const STATE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Config file limits
export const MAX_CONFIG_SIZE = 100 * 1024; // 100KB

// Timeout values per preset (in milliseconds)
export const PRESET_TIMEOUTS = {
  strict: 45000, // 45s
  balanced: 30000, // 30s
  permissive: 15000, // 15s
} as const;

// Rate limiting
export const MIN_REVIEW_INTERVAL_MS = 5000; // 5 seconds minimum between reviews

// Git operation limits
export const MAX_GIT_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB