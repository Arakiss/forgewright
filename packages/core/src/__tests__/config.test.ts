import { describe, expect, test } from "bun:test";
import {
  type AIProvider,
  AIProviderSchema,
  type ForgewrightConfig,
  ForgewrightConfigSchema,
  ReleaseModeSchema,
  defineConfig,
  getDefaultConfig,
} from "../config";

describe("AIProviderSchema", () => {
  test("should accept valid providers", () => {
    expect(AIProviderSchema.parse("anthropic")).toBe("anthropic");
    expect(AIProviderSchema.parse("openai")).toBe("openai");
    expect(AIProviderSchema.parse("google")).toBe("google");
  });

  test("should reject invalid providers", () => {
    expect(() => AIProviderSchema.parse("gpt")).toThrow();
    expect(() => AIProviderSchema.parse("claude")).toThrow();
    expect(() => AIProviderSchema.parse("")).toThrow();
    expect(() => AIProviderSchema.parse(123)).toThrow();
  });
});

describe("ReleaseModeSchema", () => {
  test("should accept valid release modes", () => {
    expect(ReleaseModeSchema.parse("auto")).toBe("auto");
    expect(ReleaseModeSchema.parse("confirm")).toBe("confirm");
  });

  test("should reject invalid release modes", () => {
    expect(() => ReleaseModeSchema.parse("manual")).toThrow();
    expect(() => ReleaseModeSchema.parse("")).toThrow();
  });
});

describe("ForgewrightConfigSchema", () => {
  const minimalConfig = {
    ai: { provider: "anthropic" as const },
  };

  test("should accept minimal valid config", () => {
    const result = ForgewrightConfigSchema.parse(minimalConfig);
    expect(result.ai.provider).toBe("anthropic");
    expect(result.mode).toBe("confirm"); // default
  });

  test("should apply defaults for thresholds", () => {
    const result = ForgewrightConfigSchema.parse(minimalConfig);
    expect(result.thresholds.release).toBe(70);
    expect(result.thresholds.minWorkUnits).toBe(1);
    expect(result.thresholds.maxAge).toBeUndefined();
  });

  test("should apply defaults for completeness", () => {
    const result = ForgewrightConfigSchema.parse(minimalConfig);
    expect(result.completeness.requireTests).toBe(true);
    expect(result.completeness.requireReview).toBe(true);
  });

  test("should apply defaults for versioning", () => {
    const result = ForgewrightConfigSchema.parse(minimalConfig);
    expect(result.versioning.strategy).toBe("semver");
  });

  test("should apply defaults for github", () => {
    const result = ForgewrightConfigSchema.parse(minimalConfig);
    expect(result.github.createRelease).toBe(true);
    expect(result.github.releaseNotes).toBe(true);
  });

  test("should accept custom values", () => {
    const customConfig = {
      ai: { provider: "openai" as const, model: "gpt-4" },
      mode: "auto" as const,
      thresholds: {
        release: 80,
        minWorkUnits: 2,
        maxAge: "14d",
      },
      completeness: {
        requireTests: false,
        requireReview: false,
      },
      versioning: {
        strategy: "semver" as const,
      },
      github: {
        createRelease: false,
        releaseNotes: false,
      },
    };

    const result = ForgewrightConfigSchema.parse(customConfig);
    expect(result.ai.provider).toBe("openai");
    expect(result.ai.model).toBe("gpt-4");
    expect(result.mode).toBe("auto");
    expect(result.thresholds.release).toBe(80);
    expect(result.thresholds.minWorkUnits).toBe(2);
    expect(result.thresholds.maxAge).toBe("14d");
    expect(result.completeness.requireTests).toBe(false);
    expect(result.github.createRelease).toBe(false);
  });

  test("should validate threshold ranges", () => {
    expect(() =>
      ForgewrightConfigSchema.parse({
        ...minimalConfig,
        thresholds: { release: -1 },
      }),
    ).toThrow();

    expect(() =>
      ForgewrightConfigSchema.parse({
        ...minimalConfig,
        thresholds: { release: 101 },
      }),
    ).toThrow();

    expect(() =>
      ForgewrightConfigSchema.parse({
        ...minimalConfig,
        thresholds: { minWorkUnits: -1 },
      }),
    ).toThrow();
  });

  test("should accept edge case threshold values", () => {
    const result = ForgewrightConfigSchema.parse({
      ...minimalConfig,
      thresholds: { release: 0, minWorkUnits: 0 },
    });
    expect(result.thresholds.release).toBe(0);
    expect(result.thresholds.minWorkUnits).toBe(0);

    const result2 = ForgewrightConfigSchema.parse({
      ...minimalConfig,
      thresholds: { release: 100 },
    });
    expect(result2.thresholds.release).toBe(100);
  });

  test("should require ai.provider", () => {
    expect(() => ForgewrightConfigSchema.parse({})).toThrow();
    expect(() => ForgewrightConfigSchema.parse({ ai: {} })).toThrow();
  });

  test("should accept all AI providers", () => {
    const providers: AIProvider[] = ["anthropic", "openai", "google"];
    for (const provider of providers) {
      const result = ForgewrightConfigSchema.parse({
        ai: { provider },
      });
      expect(result.ai.provider).toBe(provider);
    }
  });
});

describe("defineConfig", () => {
  test("should return validated config", () => {
    const config = defineConfig({
      ai: { provider: "anthropic" },
      mode: "confirm",
      thresholds: { release: 70, minWorkUnits: 1 },
      completeness: { requireTests: true, requireReview: true },
      versioning: { strategy: "semver" },
      github: { createRelease: true, releaseNotes: true },
    });

    expect(config.ai.provider).toBe("anthropic");
    expect(config.mode).toBe("confirm");
  });

  test("should throw for invalid config", () => {
    expect(() =>
      defineConfig({
        ai: { provider: "invalid" as AIProvider },
        mode: "confirm",
        thresholds: { release: 70, minWorkUnits: 1 },
        completeness: { requireTests: true, requireReview: true },
        versioning: { strategy: "semver" },
        github: { createRelease: true, releaseNotes: true },
      }),
    ).toThrow();
  });

  test("should apply defaults", () => {
    const config = defineConfig({
      ai: { provider: "google" },
    } as ForgewrightConfig);

    expect(config.mode).toBe("confirm");
    expect(config.thresholds.release).toBe(70);
  });
});

describe("getDefaultConfig", () => {
  test("should return default config for anthropic", () => {
    const config = getDefaultConfig("anthropic");
    expect(config.ai.provider).toBe("anthropic");
    expect(config.mode).toBe("confirm");
    expect(config.thresholds.release).toBe(70);
    expect(config.thresholds.minWorkUnits).toBe(1);
    expect(config.completeness.requireTests).toBe(true);
    expect(config.completeness.requireReview).toBe(true);
    expect(config.versioning.strategy).toBe("semver");
    expect(config.github.createRelease).toBe(true);
    expect(config.github.releaseNotes).toBe(true);
  });

  test("should return default config for openai", () => {
    const config = getDefaultConfig("openai");
    expect(config.ai.provider).toBe("openai");
    expect(config.mode).toBe("confirm");
  });

  test("should return default config for google", () => {
    const config = getDefaultConfig("google");
    expect(config.ai.provider).toBe("google");
    expect(config.mode).toBe("confirm");
  });

  test("should return config that passes schema validation", () => {
    const providers: AIProvider[] = ["anthropic", "openai", "google"];
    for (const provider of providers) {
      const config = getDefaultConfig(provider);
      expect(() => ForgewrightConfigSchema.parse(config)).not.toThrow();
    }
  });
});
