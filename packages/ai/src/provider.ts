import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { AIProvider } from "@forgewright/core";
import type { LanguageModelV1 } from "ai";

export interface AIProviderConfig {
  provider: AIProvider;
  model?: string;
  apiKey?: string;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  google: "gemini-2.0-flash-exp",
};

const API_KEY_ENV_VARS: Record<AIProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
};

const PROVIDER_FACTORIES: Record<
  AIProvider,
  (apiKey?: string) => (modelId: string) => LanguageModelV1
> = {
  anthropic: (apiKey) => {
    const client = createAnthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    return (modelId) => client(modelId);
  },
  openai: (apiKey) => {
    const client = createOpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
    return (modelId) => client(modelId);
  },
  google: (apiKey) => {
    const client = createGoogleGenerativeAI({ apiKey: apiKey ?? process.env.GOOGLE_API_KEY });
    return (modelId) => client(modelId);
  },
};

export function getModel(config: AIProviderConfig): LanguageModelV1 {
  const modelId = config.model ?? DEFAULT_MODELS[config.provider];
  const factory = PROVIDER_FACTORIES[config.provider];

  if (!factory) {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  return factory(config.apiKey)(modelId);
}

export function getApiKeyEnvVar(provider: AIProvider): string {
  return API_KEY_ENV_VARS[provider];
}

export function hasApiKey(provider: AIProvider): boolean {
  const envVar = getApiKeyEnvVar(provider);
  return !!process.env[envVar];
}
