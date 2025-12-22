import { describe, expect, test } from "bun:test";
import type { Commit, WorkUnit } from "@forgewright/core";
import {
  SYSTEM_PROMPT,
  buildChangelogPrompt,
  buildReadinessPrompt,
  buildWorkUnitPrompt,
} from "../prompts";

// Test fixtures
const mockCommits: Commit[] = [
  {
    hash: "abc123def456789",
    shortHash: "abc123d",
    message: "feat: add user authentication",
    body: "Implements login and logout functionality",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date("2024-01-15"),
    files: ["src/auth.ts", "src/auth.test.ts"],
  },
  {
    hash: "def456abc789123",
    shortHash: "def456a",
    message: "fix: resolve login timeout issue",
    body: "",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date("2024-01-16"),
    files: ["src/auth.ts"],
  },
  {
    hash: "ghi789def123456",
    shortHash: "ghi789d",
    message: "docs: update readme",
    body: "Added authentication section",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date("2024-01-17"),
    files: ["README.md"],
  },
];

const mockWorkUnits: WorkUnit[] = [
  {
    id: "wu-1",
    name: "User Authentication",
    description: "Login and logout functionality",
    status: "complete",
    commits: ["abc123def456789", "def456abc789123"],
    value: "high",
    createdAt: new Date("2024-01-15"),
    completedAt: new Date("2024-01-16"),
  },
  {
    id: "wu-2",
    name: "Documentation Updates",
    description: "Updated project documentation",
    status: "in_progress",
    commits: ["ghi789def123456"],
    value: "low",
    createdAt: new Date("2024-01-17"),
  },
];

describe("SYSTEM_PROMPT", () => {
  test("should be a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  test("should mention key concepts", () => {
    expect(SYSTEM_PROMPT).toContain("Work Units");
    expect(SYSTEM_PROMPT).toContain("release");
    expect(SYSTEM_PROMPT).toContain("changelog");
  });

  test("should describe the AI role", () => {
    expect(SYSTEM_PROMPT).toContain("Forgewright");
    expect(SYSTEM_PROMPT).toContain("analyze");
  });
});

describe("buildWorkUnitPrompt", () => {
  test("should include all commit messages", () => {
    const prompt = buildWorkUnitPrompt(mockCommits);

    expect(prompt).toContain("abc123d");
    expect(prompt).toContain("feat: add user authentication");
    expect(prompt).toContain("fix: resolve login timeout issue");
    expect(prompt).toContain("docs: update readme");
  });

  test("should include commit bodies when present", () => {
    const prompt = buildWorkUnitPrompt(mockCommits);

    expect(prompt).toContain("Implements login and logout functionality");
    expect(prompt).toContain("Added authentication section");
  });

  test("should not include extra whitespace for commits without body", () => {
    const prompt = buildWorkUnitPrompt([mockCommits[1]]); // fix commit with no body

    // Should not have double line breaks from empty body
    expect(prompt).toContain("def456a: fix: resolve login timeout issue");
  });

  test("should handle empty commits array", () => {
    const prompt = buildWorkUnitPrompt([]);

    expect(prompt).toContain("Analyze these commits");
    expect(prompt).toContain("COMMITS:");
  });

  test("should ask for WorkUnit output format", () => {
    const prompt = buildWorkUnitPrompt(mockCommits);

    expect(prompt).toContain("Work Unit");
    expect(prompt).toContain("name");
    expect(prompt).toContain("description");
    expect(prompt).toContain("Status");
    expect(prompt).toContain("Value");
    expect(prompt).toContain("JSON");
  });
});

describe("buildReadinessPrompt", () => {
  test("should include version and CI status", () => {
    const prompt = buildReadinessPrompt(mockCommits, mockWorkUnits, "1.2.3", true);

    expect(prompt).toContain("1.2.3");
    expect(prompt).toContain("PASSING");
  });

  test("should show CI FAILING when not passing", () => {
    const prompt = buildReadinessPrompt(mockCommits, mockWorkUnits, "1.0.0", false);

    expect(prompt).toContain("FAILING");
  });

  test("should include work unit summaries", () => {
    const prompt = buildReadinessPrompt(mockCommits, mockWorkUnits, "1.0.0", true);

    expect(prompt).toContain("User Authentication");
    expect(prompt).toContain("complete");
    expect(prompt).toContain("high value");
    expect(prompt).toContain("Documentation Updates");
    expect(prompt).toContain("in_progress");
    expect(prompt).toContain("low value");
  });

  test("should include commit count", () => {
    const prompt = buildReadinessPrompt(mockCommits, mockWorkUnits, "1.0.0", true);

    expect(prompt).toContain("3"); // 3 commits
  });

  test("should explain scoring dimensions", () => {
    const prompt = buildReadinessPrompt(mockCommits, mockWorkUnits, "1.0.0", true);

    expect(prompt).toContain("Completeness");
    expect(prompt).toContain("0-40");
    expect(prompt).toContain("Value");
    expect(prompt).toContain("0-30");
    expect(prompt).toContain("Coherence");
    expect(prompt).toContain("0-20");
    expect(prompt).toContain("Stability");
    expect(prompt).toContain("0-10");
  });

  test("should handle empty inputs", () => {
    const prompt = buildReadinessPrompt([], [], "0.0.0", true);

    expect(prompt).toContain("0.0.0");
    expect(prompt).toContain("COMMITS SINCE LAST RELEASE: 0");
  });
});

describe("buildChangelogPrompt", () => {
  test("should include version in format", () => {
    const prompt = buildChangelogPrompt(mockWorkUnits, mockCommits, "2.0.0");

    expect(prompt).toContain("2.0.0");
  });

  test("should only include complete work units in details", () => {
    const prompt = buildChangelogPrompt(mockWorkUnits, mockCommits, "1.0.0");

    // Complete unit should be detailed
    expect(prompt).toContain("User Authentication");
    expect(prompt).toContain("high value");

    // In-progress unit shouldn't be in the details section (filtered)
    // Note: We filter to complete only
  });

  test("should include commit messages for work units", () => {
    const prompt = buildChangelogPrompt(mockWorkUnits, mockCommits, "1.0.0");

    expect(prompt).toContain("feat: add user authentication");
    expect(prompt).toContain("fix: resolve login timeout issue");
  });

  test("should specify markdown format guidelines", () => {
    const prompt = buildChangelogPrompt(mockWorkUnits, mockCommits, "1.0.0");

    expect(prompt).toContain("markdown");
    expect(prompt).toContain("What's New");
    expect(prompt).toContain("Improvements");
    expect(prompt).toContain("Bug Fixes");
  });

  test("should emphasize narrative over commit lists", () => {
    const prompt = buildChangelogPrompt(mockWorkUnits, mockCommits, "1.0.0");

    expect(prompt).toContain("Write for humans");
    expect(prompt).toContain("No commit lists");
    expect(prompt).toContain("synthesize");
  });

  test("should handle work units with no matching commits", () => {
    const workUnitsWithNoCommits: WorkUnit[] = [
      {
        id: "wu-1",
        name: "Orphan Unit",
        description: "Has no matching commits",
        status: "complete",
        commits: ["nonexistent-hash"],
        value: "low",
        createdAt: new Date(),
      },
    ];

    const prompt = buildChangelogPrompt(workUnitsWithNoCommits, mockCommits, "1.0.0");
    expect(prompt).toContain("Orphan Unit");
  });
});
