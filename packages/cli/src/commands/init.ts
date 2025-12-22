import { parseArgs } from "util";
import { getDefaultConfig, type AIProvider, AIProviderSchema } from "@forgewright/core";
import { hasApiKey, getApiKeyEnvVar } from "@forgewright/ai";
import * as out from "../output";

export async function init(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      provider: { type: "string", short: "p" },
      force: { type: "boolean", short: "f" },
    },
    allowPositionals: false,
  });

  const cwd = process.cwd();
  const configPath = `${cwd}/forgewright.config.ts`;

  // Check if config already exists
  const existingConfig = Bun.file(configPath);
  if (await existingConfig.exists() && !values.force) {
    out.error("forgewright.config.ts already exists. Use --force to overwrite.");
    process.exit(1);
  }

  // Get provider
  let provider: AIProvider;

  if (values.provider) {
    const parsed = AIProviderSchema.safeParse(values.provider);
    if (!parsed.success) {
      out.error(`Invalid provider: ${values.provider}. Use: anthropic, openai, or google`);
      process.exit(1);
    }
    provider = parsed.data;
  } else {
    // Interactive selection
    out.log("\nSelect AI provider:\n");
    out.log("  1. anthropic (Claude)");
    out.log("  2. openai (GPT-4)");
    out.log("  3. google (Gemini)\n");

    const response = prompt("Enter choice [1]: ");
    const choice = response?.trim() || "1";

    const choiceMap: Record<string, AIProvider> = {
      "1": "anthropic",
      "2": "openai",
      "3": "google",
    };

    const selected = choiceMap[choice];
    if (!selected) {
      out.error("Invalid choice");
      process.exit(1);
    }
    provider = selected;
  }

  // Check for API key
  if (!hasApiKey(provider)) {
    const envVar = getApiKeyEnvVar(provider);
    out.warn(`${envVar} not set. You'll need to set it before running Forgewright.`);
  }

  // Generate config
  const config = getDefaultConfig(provider);

  const configContent = `import { defineConfig } from '@forgewright/core';

export default defineConfig({
  ai: {
    provider: '${config.ai.provider}',
    // model: 'claude-sonnet-4-20250514', // optional: override default model
  },

  mode: '${config.mode}', // 'auto' | 'confirm'

  thresholds: {
    release: ${config.thresholds.release},
    minWorkUnits: ${config.thresholds.minWorkUnits},
    // maxAge: '7d', // optional: force release consideration after N days
  },

  completeness: {
    requireTests: ${config.completeness.requireTests},
    requireReview: ${config.completeness.requireReview},
  },

  versioning: {
    strategy: '${config.versioning.strategy}',
  },

  github: {
    createRelease: ${config.github.createRelease},
    releaseNotes: ${config.github.releaseNotes},
  },
});
`;

  await Bun.write(configPath, configContent);

  out.success(`Configuration created: ${out.cyan("forgewright.config.ts")}`);
  out.log("");
  out.info(`Provider: ${out.bold(provider)}`);
  out.info(`Mode: ${out.bold(config.mode)}`);
  out.log("");
  out.log("Next steps:");
  out.log(`  ${out.dim("1.")} Set ${out.cyan(getApiKeyEnvVar(provider))} environment variable`);
  out.log(`  ${out.dim("2.")} Run ${out.cyan("forgewright status")} to analyze your project`);
}
