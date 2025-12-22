import type { Commit, WorkUnit } from "@forgewright/core";
import type { LanguageModelV1 } from "ai";
import { generateText } from "ai";
import { buildChangelogPrompt, SYSTEM_PROMPT } from "./prompts";
import { withRetry } from "./utils";

export interface ChangelogOptions {
  model: LanguageModelV1;
}

export class ChangelogGenerator {
  private model: LanguageModelV1;

  constructor(options: ChangelogOptions) {
    this.model = options.model;
  }

  async generate(workUnits: WorkUnit[], commits: Commit[], version: string): Promise<string> {
    const completeUnits = workUnits.filter((u) => u.status === "complete");

    if (completeUnits.length === 0) {
      // Fallback for when there are no complete work units
      return this.generateMinimalChangelog(commits, version);
    }

    const { text } = await withRetry(() =>
      generateText({
        model: this.model,
        system: SYSTEM_PROMPT,
        prompt: buildChangelogPrompt(workUnits, commits, version),
      }),
    );

    return text;
  }

  private generateMinimalChangelog(commits: Commit[], version: string): string {
    const date = new Date().toISOString().split("T")[0];

    if (commits.length === 0) {
      return `## ${version} - ${date}\n\nNo significant changes.`;
    }

    // Group by conventional commit type
    const features = commits.filter((c) => c.message.startsWith("feat"));
    const fixes = commits.filter((c) => c.message.startsWith("fix"));
    const others = commits.filter(
      (c) => !c.message.startsWith("feat") && !c.message.startsWith("fix"),
    );

    const sections: string[] = [`## ${version} - ${date}`];

    if (features.length > 0) {
      sections.push("\n### New Features\n");
      sections.push(features.map((c) => `- ${c.message}`).join("\n"));
    }

    if (fixes.length > 0) {
      sections.push("\n### Bug Fixes\n");
      sections.push(fixes.map((c) => `- ${c.message}`).join("\n"));
    }

    if (others.length > 0 && features.length === 0 && fixes.length === 0) {
      sections.push("\n### Changes\n");
      sections.push(others.map((c) => `- ${c.message}`).join("\n"));
    }

    return sections.join("");
  }

  async updateChangelogFile(existingContent: string, newEntry: string): Promise<string> {
    // Insert new entry after the header
    const headerMatch = existingContent.match(/^#\s+Changelog\s*\n/i);

    if (headerMatch) {
      const insertPos = headerMatch[0].length;
      return `${existingContent.slice(0, insertPos)}\n${newEntry}\n${existingContent.slice(insertPos)}`;
    }

    // No header found, prepend
    return `# Changelog\n\n${newEntry}\n\n${existingContent}`;
  }
}
