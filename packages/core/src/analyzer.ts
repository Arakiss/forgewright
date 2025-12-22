import { z } from "zod";

// Base types and schemas only - actual analysis logic lives in @forgewright/ai

export const WorkUnitStatusSchema = z.enum(["in_progress", "complete", "abandoned"]);

export type WorkUnitStatus = z.infer<typeof WorkUnitStatusSchema>;

export const WorkUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: WorkUnitStatusSchema,
  commits: z.array(z.string()), // commit hashes
  value: z.enum(["low", "medium", "high"]),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type WorkUnit = z.infer<typeof WorkUnitSchema>;

export const ReadinessScoreSchema = z.object({
  total: z.number().min(0).max(100),
  completeness: z.number().min(0).max(40),
  value: z.number().min(0).max(30),
  coherence: z.number().min(0).max(20),
  stability: z.number().min(0).max(10),
  ready: z.boolean(),
  suggestedVersion: z.string().optional(),
  suggestedBump: z.enum(["major", "minor", "patch"]).optional(),
  reasoning: z.string(),
});

export type ReadinessScore = z.infer<typeof ReadinessScoreSchema>;

export const VersionBumpSchema = z.enum(["major", "minor", "patch"]);

export type VersionBump = z.infer<typeof VersionBumpSchema>;

// Version utilities
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const clean = version.replace(/^v/, "");
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }
  return {
    major: Number.parseInt(match[1] ?? "0", 10),
    minor: Number.parseInt(match[2] ?? "0", 10),
    patch: Number.parseInt(match[3] ?? "0", 10),
  };
}

export function bumpVersion(version: string, bump: VersionBump): string {
  const { major, minor, patch } = parseVersion(version);
  const hadV = version.startsWith("v");

  const bumpStrategies: Record<VersionBump, string> = {
    major: `${major + 1}.0.0`,
    minor: `${major}.${minor + 1}.0`,
    patch: `${major}.${minor}.${patch + 1}`,
  };

  const newVersion = bumpStrategies[bump];
  return hadV ? `v${newVersion}` : newVersion;
}
