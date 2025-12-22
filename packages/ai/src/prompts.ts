import type { Commit, WorkUnit } from "@forgewright/core";

export const SYSTEM_PROMPT = `You are Forgewright, an AI release analyst for software projects.
Your job is to analyze git commits and determine:
1. How to group commits into coherent "Work Units" (features, bug fixes, refactors)
2. When a release is ready based on value delivered
3. What version bump is appropriate (major/minor/patch)
4. Generate narrative changelogs that explain what changed and why it matters

You prioritize semantic understanding over commit counting.
You think in terms of user value, not developer activity.`;

export function buildWorkUnitPrompt(commits: Commit[]): string {
  const commitList = commits
    .map((c) => `- ${c.shortHash}: ${c.message}${c.body ? `\n  ${c.body}` : ""}`)
    .join("\n");

  return `Analyze these commits and group them into Work Units.

COMMITS:
${commitList}

For each Work Unit, determine:
- A clear name (e.g., "User Authentication", "Performance Improvements")
- A brief description of what it accomplishes
- Status: "complete" if the work seems finished, "in_progress" if it appears ongoing
- Value: "high" for new features, "medium" for improvements, "low" for minor fixes
- Which commit hashes belong to it

Return as JSON array of WorkUnit objects.`;
}

export function buildReadinessPrompt(
  commits: Commit[],
  workUnits: WorkUnit[],
  currentVersion: string,
  ciPassing: boolean
): string {
  const unitSummary = workUnits
    .map((u) => `- ${u.name} (${u.status}, ${u.value} value, ${u.commits.length} commits)`)
    .join("\n");

  return `Evaluate release readiness for this project.

CURRENT VERSION: ${currentVersion}
CI STATUS: ${ciPassing ? "PASSING" : "FAILING"}
COMMITS SINCE LAST RELEASE: ${commits.length}

WORK UNITS:
${unitSummary}

Score these dimensions (total must equal sum of components):
- Completeness (0-40): Are work units finished? Tests passing? No WIP?
- Value (0-30): User-facing impact? Features vs fixes?
- Coherence (0-20): Do changes make sense together? Clear theme?
- Stability (0-10): CI green? No regressions?

Determine:
- Total score (0-100)
- Whether ready to release (score >= 70)
- Suggested version bump (major/minor/patch) based on changes
- Brief reasoning for your assessment

Return as JSON.`;
}

export function buildChangelogPrompt(
  workUnits: WorkUnit[],
  commits: Commit[],
  version: string
): string {
  const unitDetails = workUnits
    .filter((u) => u.status === "complete")
    .map((u) => {
      const unitCommits = commits.filter((c) => u.commits.includes(c.hash));
      const commitMessages = unitCommits.map((c) => `  - ${c.message}`).join("\n");
      return `${u.name} (${u.value} value):\n${u.description}\n${commitMessages}`;
    })
    .join("\n\n");

  return `Generate a narrative changelog for version ${version}.

COMPLETED WORK UNITS:
${unitDetails}

Guidelines:
- Write for humans, not machines
- Focus on what changed and why it matters
- Group related changes under clear headings
- No commit lists - synthesize into prose
- Include technical notes only when relevant
- Use markdown formatting

Format:
## ${version} - [Short descriptive title]

### What's New
[Narrative description of new features]

### Improvements
[Narrative description of improvements]

### Bug Fixes
[Narrative description of fixes, if any]

### Technical Notes
[Any relevant technical details]`;
}
