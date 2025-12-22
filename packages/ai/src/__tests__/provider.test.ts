import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { type AIProviderConfig, getApiKeyEnvVar, hasApiKey } from "../provider";

describe("getApiKeyEnvVar", () => {
  test("should return correct env var for anthropic", () => {
    expect(getApiKeyEnvVar("anthropic")).toBe("ANTHROPIC_API_KEY");
  });

  test("should return correct env var for openai", () => {
    expect(getApiKeyEnvVar("openai")).toBe("OPENAI_API_KEY");
  });

  test("should return correct env var for google", () => {
    expect(getApiKeyEnvVar("google")).toBe("GOOGLE_API_KEY");
  });
});

describe("hasApiKey", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clean all API key env vars
    process.env.ANTHROPIC_API_KEY = undefined;
    process.env.OPENAI_API_KEY = undefined;
    process.env.GOOGLE_API_KEY = undefined;
  });

  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
  });

  test("should return false when no API key is set", () => {
    expect(hasApiKey("anthropic")).toBe(false);
    expect(hasApiKey("openai")).toBe(false);
    expect(hasApiKey("google")).toBe(false);
  });

  test("should return true when ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(hasApiKey("anthropic")).toBe(true);
  });

  test("should return true when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-key";
    expect(hasApiKey("openai")).toBe(true);
  });

  test("should return true when GOOGLE_API_KEY is set", () => {
    process.env.GOOGLE_API_KEY = "test-key";
    expect(hasApiKey("google")).toBe(true);
  });

  test("should return false for empty string API key", () => {
    process.env.ANTHROPIC_API_KEY = "";
    expect(hasApiKey("anthropic")).toBe(false);
  });

  test("should return true for whitespace-only API key", () => {
    // Edge case: whitespace is truthy in JS
    process.env.ANTHROPIC_API_KEY = "   ";
    expect(hasApiKey("anthropic")).toBe(true);
  });
});

describe("AIProviderConfig type", () => {
  test("should accept minimal config", () => {
    const config: AIProviderConfig = {
      provider: "anthropic",
    };
    expect(config.provider).toBe("anthropic");
    expect(config.model).toBeUndefined();
    expect(config.apiKey).toBeUndefined();
  });

  test("should accept full config", () => {
    const config: AIProviderConfig = {
      provider: "openai",
      model: "gpt-4-turbo",
      apiKey: "sk-test",
    };
    expect(config.provider).toBe("openai");
    expect(config.model).toBe("gpt-4-turbo");
    expect(config.apiKey).toBe("sk-test");
  });
});

describe("getModel", () => {
  const { getModel } = require("../provider");

  test("should return a model object for anthropic", () => {
    const model = getModel({ provider: "anthropic", apiKey: "test-key" });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for openai", () => {
    const model = getModel({ provider: "openai", apiKey: "test-key" });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for google", () => {
    const model = getModel({ provider: "google", apiKey: "test-key" });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should use custom model when provided", () => {
    const model = getModel({
      provider: "anthropic",
      model: "claude-3-haiku-20240307",
      apiKey: "test-key",
    });
    expect(model).toBeDefined();
  });

  test("should throw for unsupported provider", () => {
    expect(() => {
      getModel({ provider: "invalid-provider" });
    }).toThrow("Unsupported AI provider");
  });
});
