/**
 * Utility for adding timeout to promises
 */

export class ReviewError extends Error {
  constructor(
    message: string,
    public readonly context: {
      provider: string;
      model: string;
      preset: string;
      errorType: 'timeout' | 'api' | 'parse' | 'unknown';
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = 'ReviewError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ReviewError);
    }
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns The promise result or throws on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(errorMessage));
        });
      }),
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}