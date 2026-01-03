import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import * as out from "../output";

const CURSORRULES = `# Forgewright Release Workflow

You are working in a project that uses Forgewright for AI-first release management.

## Release Philosophy
- Releases happen when there's meaningful VALUE to ship, not arbitrary conditions
- Commits are grouped into "Work Units" - coherent bundles that deliver value
- AI evaluates readiness based on: completeness (40%), value (30%), coherence (20%), stability (10%)

## Commands
- \`forgewright status\` - Check release readiness (0-100 score)
- \`forgewright preview\` - Preview the changelog before releasing
- \`forgewright release\` - Create a release when ready (threshold: 70)

## Commit Conventions
Use conventional commits for best results:
- \`feat:\` New features
- \`fix:\` Bug fixes
- \`docs:\` Documentation
- \`refactor:\` Code changes without feature changes
- \`test:\` Adding tests
- \`chore:\` Maintenance tasks

## When to Release
Don't ask about releasing after every change. Let Forgewright analyze when enough VALUE has accumulated.
Run \`forgewright status\` periodically to check readiness.
`;

const CLAUDE_MD = `# Forgewright Project

This project uses **Forgewright** for intelligent release management.

## What is Forgewright?
AI-first release system designed for LLM-assisted development. It understands that with AI coding (Claude Code, Cursor, etc.), developers produce 50+ commits/day, and traditional release tools break under this volume.

## Key Concepts
- **Work Units**: Coherent bundles of commits that deliver value (not individual commits)
- **Readiness Score**: AI-evaluated score (0-100) based on completeness, value, coherence, stability
- **Release Threshold**: 70/100 by default

## Available Commands
\`\`\`bash
forgewright status      # Check if ready to release
forgewright preview     # Preview changelog
forgewright release     # Create release
forgewright release --force  # Force release even if not ready
\`\`\`

## Release Workflow
1. Make changes and commit with conventional commits (feat:, fix:, etc.)
2. Periodically run \`forgewright status\` to check readiness
3. When score >= 70, run \`forgewright release\`
4. Forgewright generates narrative changelog and creates GitHub release

## Configuration
See \`forgewright.config.ts\` for configuration options.
`;

const COPILOT_INSTRUCTIONS = `# Forgewright Release Guidelines

This repository uses Forgewright for release management.

## Commit Message Format
Always use conventional commits:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only
- refactor: Code change that neither fixes a bug nor adds a feature
- test: Adding missing tests
- chore: Changes to build process or auxiliary tools

## Release Process
- Do NOT manually create releases or tags
- Use \`forgewright release\` command to create releases
- Check \`forgewright status\` before releasing

## Work Units
Forgewright groups commits into Work Units. A good Work Unit:
- Delivers complete, coherent value
- Has tests if adding features
- Is documented if user-facing
`;

type RuleType = "cursor" | "claude" | "copilot" | "all";

function writeCursorRules(): void {
  writeFileSync(".cursorrules", CURSORRULES);
  out.success("Created .cursorrules");
}

function writeClaudeRules(): void {
  writeFileSync("CLAUDE.md", CLAUDE_MD);
  out.success("Created CLAUDE.md");
}

function writeCopilotRules(): void {
  if (!existsSync(".github")) {
    mkdirSync(".github", { recursive: true });
  }
  writeFileSync(".github/copilot-instructions.md", COPILOT_INSTRUCTIONS);
  out.success("Created .github/copilot-instructions.md");
}

export async function rules(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {
      all: { type: "boolean", short: "a" },
    },
    allowPositionals: true,
    strict: false,
  });

  const target = (positionals[0] as RuleType) || "all";

  out.log("");
  out.log(out.bold("Forgewright Rules Generator"));
  out.log(out.dim("Generate AI editor configuration files"));
  out.log("");

  const validTargets = ["cursor", "claude", "copilot", "all"];
  if (!validTargets.includes(target)) {
    out.error(`Unknown target: ${target}`);
    out.log(`Valid targets: ${validTargets.join(", ")}`);
    process.exit(1);
  }

  try {
    if (target === "cursor" || target === "all") {
      writeCursorRules();
    }
    if (target === "claude" || target === "all") {
      writeClaudeRules();
    }
    if (target === "copilot" || target === "all") {
      writeCopilotRules();
    }

    out.log("");
    out.success("Rules generated successfully!");
    out.log("");
    out.log(out.dim("These files help AI assistants understand your release workflow."));
  } catch (error) {
    out.error(
      `Failed to generate rules: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
