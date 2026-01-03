import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import type { AIProvider } from "@forgewright/core";
import type { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

export interface AIProviderConfig {
  provider: AIProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-5.2",
  google: "gemini-2.0-flash-exp",
  xai: "grok-2-1212",
  mistral: "mistral-large-latest",
  ollama: "llama3.2",
  "openai-compatible": "gpt-5.2", // User must specify model for compatible providers
};

const API_KEY_ENV_VARS: Record<AIProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
  xai: "XAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  ollama: "", // Ollama doesn't require API key
  "openai-compatible": "OPENAI_API_KEY", // Fallback, user should provide
};

type ProviderFactory = (config: AIProviderConfig) => (modelId: string) => LanguageModel;

const PROVIDER_FACTORIES: Record<AIProvider, ProviderFactory> = {
  anthropic: (config) => {
    const client = createAnthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    return (modelId) => client(modelId);
  },

  openai: (config) => {
    const client = createOpenAI({
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: config.baseURL,
    });
    return (modelId) => client(modelId);
  },

  google: (config) => {
    const client = createGoogleGenerativeAI({
      apiKey: config.apiKey ?? process.env.GOOGLE_API_KEY,
    });
    return (modelId) => client(modelId);
  },

  xai: (config) => {
    const client = createXai({
      apiKey: config.apiKey ?? process.env.XAI_API_KEY,
    });
    return (modelId) => client(modelId);
  },

  mistral: (config) => {
    const client = createMistral({
      apiKey: config.apiKey ?? process.env.MISTRAL_API_KEY,
    });
    return (modelId) => client(modelId);
  },

  // Ollama uses the native Ollama API via ollama-ai-provider-v2
  ollama: (config) => {
    const baseURL = config.baseURL ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api";
    const client = createOllama({ baseURL });
    // Cast needed due to minor version differences in @ai-sdk/provider
    return (modelId) => client(modelId) as unknown as LanguageModel;
  },

  // For Groq, Together.ai, LM Studio, or any OpenAI-compatible API
  "openai-compatible": (config) => {
    if (!config.baseURL) {
      throw new Error("baseURL is required for openai-compatible provider");
    }
    const client = createOpenAICompatible({
      name: "custom",
      baseURL: config.baseURL,
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY ?? "",
    });
    // Cast needed due to minor version differences in @ai-sdk/provider
    return (modelId) => client(modelId) as unknown as LanguageModel;
  },
};

export function getModel(config: AIProviderConfig): LanguageModel {
  const modelId = config.model ?? DEFAULT_MODELS[config.provider];
  const factory = PROVIDER_FACTORIES[config.provider];

  if (!factory) {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  return factory(config)(modelId);
}

export function getApiKeyEnvVar(provider: AIProvider): string {
  return API_KEY_ENV_VARS[provider];
}

export function hasApiKey(provider: AIProvider): boolean {
  // Ollama doesn't require API key
  if (provider === "ollama") {
    return true;
  }

  const envVar = getApiKeyEnvVar(provider);
  if (!envVar) {
    return true; // No env var required
  }

  return !!process.env[envVar];
}

/**
 * Get a list of all supported providers
 */
export function getSupportedProviders(): AIProvider[] {
  return Object.keys(PROVIDER_FACTORIES) as AIProvider[];
}
