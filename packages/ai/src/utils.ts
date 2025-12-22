/**
 * AI utility functions for error handling and retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: isRetryableError,
};

/**
 * Determines if an error is retryable (rate limit, network issues, etc.)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limit errors
    if (message.includes("rate limit") || message.includes("too many requests")) {
      return true;
    }

    // Network/timeout errors
    if (
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("econnrefused")
    ) {
      return true;
    }

    // Server errors (5xx)
    if (message.includes("500") || message.includes("502") || message.includes("503")) {
      return true;
    }

    // Overloaded
    if (message.includes("overloaded") || message.includes("capacity")) {
      return true;
    }
  }

  return false;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateBackoff(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
): number {
  const exponentialDelay = initialDelayMs * 2 ** (attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Execute a function with automatic retry on retryable errors
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === opts.maxRetries;
      const shouldRetry = opts.shouldRetry(error);

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      const delay = calculateBackoff(attempt, opts.initialDelayMs, opts.maxDelayMs);
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

/**
 * Error class for AI-specific errors
 */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: "RATE_LIMIT" | "TIMEOUT" | "INVALID_RESPONSE" | "API_ERROR" | "UNKNOWN",
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIError";
  }

  static fromError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const retryable = isRetryableError(error);

    let code: AIError["code"] = "UNKNOWN";
    if (message.toLowerCase().includes("rate limit")) {
      code = "RATE_LIMIT";
    } else if (message.toLowerCase().includes("timeout")) {
      code = "TIMEOUT";
    }

    return new AIError(message, code, retryable, error);
  }
}
