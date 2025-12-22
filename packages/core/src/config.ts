import { z } from "zod";

export const AIProviderSchema = z.enum(["anthropic", "openai", "google"]);

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

export type ConfigLoadError = "not_found" | "parse_error" | "validation_error";

export type ConfigLoadResult =
  | { success: true; config: ForgewrightConfig }
  | { success: false; error: ConfigLoadError; details?: string };

/**
 * Load configuration with detailed error reporting
 */
export async function loadConfigWithDetails(
  cwd: string = process.cwd(),
): Promise<ConfigLoadResult> {
  const configPath = `${cwd}/forgewright.config.ts`;

  // Check if file exists using Bun's file API
  const file = Bun.file(configPath);
  const exists = await file.exists();

  if (!exists) {
    return { success: false, error: "not_found" };
  }

  try {
    const module = await import(configPath);

    if (!module.default) {
      return {
        success: false,
        error: "parse_error",
        details: "Config file must export a default configuration object",
      };
    }

    const result = ForgewrightConfigSchema.safeParse(module.default);

    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      return {
        success: false,
        error: "validation_error",
        details: `Configuration validation failed:\n${issues}`,
      };
    }

    return { success: true, config: result.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: "parse_error",
      details: `Failed to load config: ${message}`,
    };
  }
}

/**
 * Load configuration (legacy API for backwards compatibility)
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<ForgewrightConfig | null> {
  const result = await loadConfigWithDetails(cwd);
  return result.success ? result.config : null;
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
