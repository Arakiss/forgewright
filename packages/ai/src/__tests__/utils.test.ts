import { describe, expect, test } from "bun:test";
import { AIError, calculateBackoff, isRetryableError, sleep, withRetry } from "../utils";

describe("isRetryableError", () => {
  test("should return true for rate limit errors", () => {
    expect(isRetryableError(new Error("rate limit exceeded"))).toBe(true);
    expect(isRetryableError(new Error("Too Many Requests"))).toBe(true);
  });

  test("should return true for network errors", () => {
    expect(isRetryableError(new Error("Network error"))).toBe(true);
    expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
    expect(isRetryableError(new Error("ECONNREFUSED"))).toBe(true);
    expect(isRetryableError(new Error("timeout"))).toBe(true);
  });

  test("should return true for server errors", () => {
    expect(isRetryableError(new Error("500 Internal Server Error"))).toBe(true);
    expect(isRetryableError(new Error("502 Bad Gateway"))).toBe(true);
    expect(isRetryableError(new Error("503 Service Unavailable"))).toBe(true);
  });

  test("should return true for capacity errors", () => {
    expect(isRetryableError(new Error("Server is overloaded"))).toBe(true);
    expect(isRetryableError(new Error("At capacity"))).toBe(true);
  });

  test("should return false for non-retryable errors", () => {
    expect(isRetryableError(new Error("Invalid API key"))).toBe(false);
    expect(isRetryableError(new Error("Bad request"))).toBe(false);
    expect(isRetryableError(new Error("Not found"))).toBe(false);
    expect(isRetryableError(new Error(""))).toBe(false);
  });

  test("should return false for non-Error types", () => {
    expect(isRetryableError("string error")).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError(123)).toBe(false);
  });
});

describe("sleep", () => {
  test("should resolve after specified time", async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    // Allow some tolerance for timing
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThan(150);
  });

  test("should return a Promise", () => {
    const result = sleep(0);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe("calculateBackoff", () => {
  test("should increase exponentially with attempts", () => {
    // With no jitter, delay should be initialDelay * 2^(attempt-1)
    // Since jitter adds 0-30%, we check ranges
    const delay1 = calculateBackoff(1, 1000, 10000);
    const delay2 = calculateBackoff(2, 1000, 10000);
    const delay3 = calculateBackoff(3, 1000, 10000);

    // First attempt: 1000 + jitter (0-300) = 1000-1300
    expect(delay1).toBeGreaterThanOrEqual(1000);
    expect(delay1).toBeLessThanOrEqual(1300);

    // Second attempt: 2000 + jitter (0-600) = 2000-2600
    expect(delay2).toBeGreaterThanOrEqual(2000);
    expect(delay2).toBeLessThanOrEqual(2600);

    // Third attempt: 4000 + jitter (0-1200) = 4000-5200
    expect(delay3).toBeGreaterThanOrEqual(4000);
    expect(delay3).toBeLessThanOrEqual(5200);
  });

  test("should respect maxDelayMs", () => {
    const delay = calculateBackoff(10, 1000, 5000);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  test("should handle edge cases", () => {
    const delay = calculateBackoff(1, 0, 1000);
    expect(delay).toBeGreaterThanOrEqual(0);

    const delay2 = calculateBackoff(1, 100, 100);
    expect(delay2).toBeLessThanOrEqual(130); // 100 + max 30% jitter
  });
});

describe("withRetry", () => {
  test("should return result on success", async () => {
    const result = await withRetry(async () => "success");
    expect(result).toBe("success");
  });

  test("should retry on retryable errors", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("rate limit exceeded");
        }
        return "success";
      },
      { initialDelayMs: 10, maxDelayMs: 50 },
    );

    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  test("should throw immediately on non-retryable errors", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new Error("Invalid API key");
        },
        { maxRetries: 3, initialDelayMs: 10 },
      ),
    ).rejects.toThrow("Invalid API key");

    expect(attempts).toBe(1);
  });

  test("should throw after max retries", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new Error("rate limit exceeded");
        },
        { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 50 },
      ),
    ).rejects.toThrow("rate limit exceeded");

    expect(attempts).toBe(3);
  });

  test("should use custom shouldRetry function", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("custom error");
        }
        return "success";
      },
      {
        initialDelayMs: 10,
        shouldRetry: (error) => error instanceof Error && error.message === "custom error",
      },
    );

    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  test("should use default options", async () => {
    const result = await withRetry(async () => "success");
    expect(result).toBe("success");
  });
});

describe("AIError", () => {
  test("should create error with all properties", () => {
    const error = new AIError("Test error", "RATE_LIMIT", true, new Error("cause"));

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("RATE_LIMIT");
    expect(error.retryable).toBe(true);
    expect(error.cause).toBeInstanceOf(Error);
    expect(error.name).toBe("AIError");
  });

  test("should be instance of Error", () => {
    const error = new AIError("Test", "UNKNOWN", false);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AIError);
  });

  describe("fromError", () => {
    test("should return same AIError if already AIError", () => {
      const original = new AIError("Original", "API_ERROR", false);
      const result = AIError.fromError(original);
      expect(result).toBe(original);
    });

    test("should detect rate limit errors", () => {
      const error = AIError.fromError(new Error("Rate limit exceeded"));
      expect(error.code).toBe("RATE_LIMIT");
      expect(error.retryable).toBe(true);
    });

    test("should detect timeout errors", () => {
      const error = AIError.fromError(new Error("Request timeout"));
      expect(error.code).toBe("TIMEOUT");
      expect(error.retryable).toBe(true);
    });

    test("should handle unknown errors", () => {
      const error = AIError.fromError(new Error("Unknown error"));
      expect(error.code).toBe("UNKNOWN");
      expect(error.retryable).toBe(false);
    });

    test("should handle non-Error types", () => {
      const error = AIError.fromError("string error");
      expect(error.message).toBe("string error");
      expect(error.code).toBe("UNKNOWN");
    });

    test("should preserve original error as cause", () => {
      const original = new Error("Original error");
      const error = AIError.fromError(original);
      expect(error.cause).toBe(original);
    });
  });
});
