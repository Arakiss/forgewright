import { z } from "zod";

export const AIProviderSchema = z.enum([
  "anthropic",
  "openai",
  "google",
]);

export type AIProvider = z.infer<typeof AIProviderSchema>;

export const ReleaseModeSchema = z.enum(["auto", "confirm"]);

export type ReleaseMode = z.infer<typeof ReleaseModeSchema>;

export const ForgewrightConfigSchema = z.object({
  ai: z.object({
    provider: AIProviderSchema,
    model: z.string().optional(),
  }),

  mode: ReleaseModeSchema.default("confirm"),

  thresholds: z
    .object({
      release: z.number().min(0).max(100).default(70),
      minWorkUnits: z.number().min(0).default(1),
      maxAge: z.string().optional(), // e.g., "7d"
    })
    .default({}),

  completeness: z
    .object({
      requireTests: z.boolean().default(true),
      requireReview: z.boolean().default(true),
    })
    .default({}),

  versioning: z
    .object({
      strategy: z.enum(["semver"]).default("semver"),
    })
    .default({}),

  github: z
    .object({
      createRelease: z.boolean().default(true),
      releaseNotes: z.boolean().default(true),
    })
    .default({}),
});

export type ForgewrightConfig = z.infer<typeof ForgewrightConfigSchema>;

export function defineConfig(config: ForgewrightConfig): ForgewrightConfig {
  return ForgewrightConfigSchema.parse(config);
}

export async function loadConfig(cwd: string = process.cwd()): Promise<ForgewrightConfig | null> {
  const configPath = `${cwd}/forgewright.config.ts`;

  try {
    const module = await import(configPath);
    return ForgewrightConfigSchema.parse(module.default);
  } catch {
    return null;
  }
}

export function getDefaultConfig(provider: AIProvider): ForgewrightConfig {
  return {
    ai: { provider },
    mode: "confirm",
    thresholds: {
      release: 70,
      minWorkUnits: 1,
    },
    completeness: {
      requireTests: true,
      requireReview: true,
    },
    versioning: {
      strategy: "semver",
    },
    github: {
      createRelease: true,
      releaseNotes: true,
    },
  };
}
