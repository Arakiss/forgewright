import { generateObject } from "ai";
import { z } from "zod";
import type { Commit, WorkUnit, ReadinessScore, VersionBump } from "@forgewright/core";
import { WorkUnitSchema, ReadinessScoreSchema } from "@forgewright/core";
import type { LanguageModelV1 } from "ai";
import { SYSTEM_PROMPT, buildWorkUnitPrompt, buildReadinessPrompt } from "./prompts";

export interface AnalyzerOptions {
  model: LanguageModelV1;
}

export class Analyzer {
  private model: LanguageModelV1;

  constructor(options: AnalyzerOptions) {
    this.model = options.model;
  }

  async detectWorkUnits(commits: Commit[]): Promise<WorkUnit[]> {
    if (commits.length === 0) {
      return [];
    }

    const { object } = await generateObject({
      model: this.model,
      system: SYSTEM_PROMPT,
      prompt: buildWorkUnitPrompt(commits),
      schema: z.object({
        workUnits: z.array(
          WorkUnitSchema.extend({
            createdAt: z.string().transform((s) => new Date(s)),
            completedAt: z
              .string()
              .optional()
              .transform((s) => (s ? new Date(s) : undefined)),
          })
        ),
      }),
    });

    return object.workUnits.map((wu, idx) => ({
      ...wu,
      id: `wu-${idx + 1}`,
      createdAt: wu.createdAt instanceof Date ? wu.createdAt : new Date(),
      completedAt: wu.completedAt instanceof Date ? wu.completedAt : undefined,
    }));
  }

  async evaluateReadiness(
    commits: Commit[],
    workUnits: WorkUnit[],
    currentVersion: string,
    ciPassing: boolean = true
  ): Promise<ReadinessScore> {
    if (commits.length === 0 && workUnits.length === 0) {
      return {
        total: 0,
        completeness: 0,
        value: 0,
        coherence: 0,
        stability: ciPassing ? 10 : 0,
        ready: false,
        reasoning: "No changes since last release",
      };
    }

    const { object } = await generateObject({
      model: this.model,
      system: SYSTEM_PROMPT,
      prompt: buildReadinessPrompt(commits, workUnits, currentVersion, ciPassing),
      schema: ReadinessScoreSchema,
    });

    return object;
  }

  async suggestVersionBump(
    workUnits: WorkUnit[],
    commits: Commit[]
  ): Promise<VersionBump> {
    // Check for breaking changes
    const hasBreaking = commits.some(
      (c) =>
        c.message.includes("BREAKING") ||
        c.message.startsWith("!") ||
        c.body.includes("BREAKING CHANGE")
    );
    if (hasBreaking) return "major";

    // Check for new features
    const hasFeature = workUnits.some((u) => u.value === "high") ||
      commits.some((c) => c.message.startsWith("feat"));
    if (hasFeature) return "minor";

    return "patch";
  }
}
