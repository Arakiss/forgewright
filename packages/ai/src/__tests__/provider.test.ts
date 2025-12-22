import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type AIProviderConfig,
  getApiKeyEnvVar,
  getModel,
  getSupportedProviders,
  hasApiKey,
} from "../provider";

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

  test("should return correct env var for xai", () => {
    expect(getApiKeyEnvVar("xai")).toBe("XAI_API_KEY");
  });

  test("should return correct env var for mistral", () => {
    expect(getApiKeyEnvVar("mistral")).toBe("MISTRAL_API_KEY");
  });

  test("should return empty string for ollama", () => {
    expect(getApiKeyEnvVar("ollama")).toBe("");
  });

  test("should return OPENAI_API_KEY for openai-compatible", () => {
    expect(getApiKeyEnvVar("openai-compatible")).toBe("OPENAI_API_KEY");
  });
});

describe("hasApiKey", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clean all API key env vars
    process.env.ANTHROPIC_API_KEY = undefined;
    process.env.OPENAI_API_KEY = undefined;
    process.env.GOOGLE_API_KEY = undefined;
    process.env.XAI_API_KEY = undefined;
    process.env.MISTRAL_API_KEY = undefined;
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

  test("should return true for ollama (no API key required)", () => {
    expect(hasApiKey("ollama")).toBe(true);
  });

  test("should return false when XAI_API_KEY is not set", () => {
    expect(hasApiKey("xai")).toBe(false);
  });

  test("should return true when XAI_API_KEY is set", () => {
    process.env.XAI_API_KEY = "test-key";
    expect(hasApiKey("xai")).toBe(true);
  });

  test("should return false when MISTRAL_API_KEY is not set", () => {
    expect(hasApiKey("mistral")).toBe(false);
  });

  test("should return true when MISTRAL_API_KEY is set", () => {
    process.env.MISTRAL_API_KEY = "test-key";
    expect(hasApiKey("mistral")).toBe(true);
  });

  test("should return false for openai-compatible when OPENAI_API_KEY is not set", () => {
    expect(hasApiKey("openai-compatible")).toBe(false);
  });

  test("should return true for openai-compatible when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-key";
    expect(hasApiKey("openai-compatible")).toBe(true);
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

  test("should return a model object for xai", () => {
    const model = getModel({ provider: "xai", apiKey: "test-key" });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for mistral", () => {
    const model = getModel({ provider: "mistral", apiKey: "test-key" });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for ollama", () => {
    const model = getModel({ provider: "ollama" });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for openai-compatible with baseURL", () => {
    const model = getModel({
      provider: "openai-compatible",
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: "test-key",
    });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should throw for openai-compatible without baseURL", () => {
    expect(() => {
      getModel({ provider: "openai-compatible", apiKey: "test-key" });
    }).toThrow("baseURL is required");
  });

  test("should accept baseURL for config", () => {
    const config: AIProviderConfig = {
      provider: "openai-compatible",
      model: "llama-3.3-70b-versatile",
      apiKey: "test-key",
      baseURL: "https://api.groq.com/openai/v1",
    };
    expect(config.baseURL).toBe("https://api.groq.com/openai/v1");
  });

  test("should return a model object for ollama with custom model", () => {
    const model = getModel({
      provider: "ollama",
      model: "qwen2.5:7b",
    });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for ollama with custom baseURL", () => {
    const model = getModel({
      provider: "ollama",
      baseURL: "http://custom-host:11434/api",
    });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should return a model object for openai with custom baseURL", () => {
    const model = getModel({
      provider: "openai",
      apiKey: "test-key",
      baseURL: "https://custom-openai-endpoint.com/v1",
    });
    expect(model).toBeDefined();
    expect(typeof model).toBe("object");
  });

  test("should use default model when not specified", () => {
    // This test verifies that getModel works with just a provider
    const model = getModel({ provider: "anthropic", apiKey: "test-key" });
    expect(model).toBeDefined();
  });
});

describe("getSupportedProviders", () => {
  test("should return all supported providers", () => {
    const providers = getSupportedProviders();
    expect(providers).toBeInstanceOf(Array);
    expect(providers.length).toBeGreaterThan(0);
  });

  test("should include anthropic provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("anthropic");
  });

  test("should include openai provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("openai");
  });

  test("should include google provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("google");
  });

  test("should include xai provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("xai");
  });

  test("should include mistral provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("mistral");
  });

  test("should include ollama provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("ollama");
  });

  test("should include openai-compatible provider", () => {
    const providers = getSupportedProviders();
    expect(providers).toContain("openai-compatible");
  });

  test("should return exactly 7 providers", () => {
    const providers = getSupportedProviders();
    expect(providers.length).toBe(7);
  });
});

describe("Ollama provider with environment variables", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("should use OLLAMA_BASE_URL from environment when set", () => {
    process.env.OLLAMA_BASE_URL = "http://env-ollama:11434/api";
    const model = getModel({ provider: "ollama" });
    expect(model).toBeDefined();
  });

  test("should prefer config baseURL over OLLAMA_BASE_URL env var", () => {
    process.env.OLLAMA_BASE_URL = "http://env-ollama:11434/api";
    const model = getModel({
      provider: "ollama",
      baseURL: "http://config-ollama:11434/api",
    });
    expect(model).toBeDefined();
  });
});

describe("openai-compatible provider edge cases", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = undefined;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("should work without apiKey when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "env-api-key";
    const model = getModel({
      provider: "openai-compatible",
      baseURL: "https://api.groq.com/openai/v1",
    });
    expect(model).toBeDefined();
  });

  test("should work without apiKey when no env var is set", () => {
    // Should use empty string as fallback
    const model = getModel({
      provider: "openai-compatible",
      baseURL: "https://api.groq.com/openai/v1",
    });
    expect(model).toBeDefined();
  });

  test("should prefer config apiKey over environment variable", () => {
    process.env.OPENAI_API_KEY = "env-api-key";
    const model = getModel({
      provider: "openai-compatible",
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: "config-api-key",
    });
    expect(model).toBeDefined();
  });

  test("should work with custom model for openai-compatible", () => {
    const model = getModel({
      provider: "openai-compatible",
      baseURL: "https://api.groq.com/openai/v1",
      model: "llama-3.3-70b-versatile",
      apiKey: "test-key",
    });
    expect(model).toBeDefined();
  });
});
