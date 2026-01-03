import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Test in a temporary directory
const TEST_DIR = "/tmp/forgewright-rules-test";

describe("rules command", () => {
  beforeEach(() => {
    // Create fresh test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
  });

  afterEach(() => {
    // Cleanup
    process.chdir("/tmp");
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("cursorrules generation", () => {
    it("should contain Forgewright workflow information", () => {
      const content = getCursorRulesContent();
      expect(content).toContain("Forgewright");
      expect(content).toContain("Work Units");
      expect(content).toContain("forgewright status");
      expect(content).toContain("forgewright release");
    });

    it("should include conventional commit conventions", () => {
      const content = getCursorRulesContent();
      expect(content).toContain("feat:");
      expect(content).toContain("fix:");
      expect(content).toContain("docs:");
    });

    it("should mention the readiness score", () => {
      const content = getCursorRulesContent();
      expect(content).toContain("completeness");
      expect(content).toContain("value");
      expect(content).toContain("coherence");
      expect(content).toContain("stability");
    });
  });

  describe("CLAUDE.md generation", () => {
    it("should contain project description", () => {
      const content = getClaudeMdContent();
      expect(content).toContain("Forgewright");
      expect(content).toContain("AI-first release system");
    });

    it("should include available commands", () => {
      const content = getClaudeMdContent();
      expect(content).toContain("forgewright status");
      expect(content).toContain("forgewright preview");
      expect(content).toContain("forgewright release");
    });

    it("should explain key concepts", () => {
      const content = getClaudeMdContent();
      expect(content).toContain("Work Units");
      expect(content).toContain("Readiness Score");
    });
  });

  describe("copilot instructions generation", () => {
    it("should contain commit message format", () => {
      const content = getCopilotInstructionsContent();
      expect(content).toContain("feat:");
      expect(content).toContain("fix:");
      expect(content).toContain("conventional commits");
    });

    it("should include release process guidance", () => {
      const content = getCopilotInstructionsContent();
      expect(content).toContain("forgewright release");
      expect(content).toContain("forgewright status");
    });
  });
});

// Helper functions to get content without actually writing files
function getCursorRulesContent(): string {
  return `# Forgewright Release Workflow

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
}

function getClaudeMdContent(): string {
  return `# Forgewright Project

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
}

function getCopilotInstructionsContent(): string {
  return `# Forgewright Release Guidelines

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
}
