import { describe, expect, test } from "bun:test";
import type { Commit, WorkUnit } from "@forgewright/core";
import { Analyzer } from "../analyzer";

// Mock model - we can't actually call AI APIs in tests
// biome-ignore lint/suspicious/noExplicitAny: Required for mocking AI SDK model
const mockModel = {} as any;

// Test fixtures
const mockCommits: Commit[] = [
  {
    hash: "abc123",
    shortHash: "abc",
    message: "feat: add new feature",
    body: "",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date(),
    files: ["src/feature.ts"],
  },
  {
    hash: "def456",
    shortHash: "def",
    message: "fix: resolve bug",
    body: "",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date(),
    files: ["src/bug.ts"],
  },
];

const breakingCommit: Commit = {
  hash: "brk123",
  shortHash: "brk",
  message: "feat!: BREAKING change",
  body: "BREAKING CHANGE: This changes the API",
  author: { name: "Dev", email: "dev@test.com" },
  date: new Date(),
  files: ["src/api.ts"],
};

const mockWorkUnits: WorkUnit[] = [
  {
    id: "wu-1",
    name: "Feature Work",
    description: "New feature",
    status: "complete",
    commits: ["abc123"],
    value: "high",
    createdAt: new Date(),
  },
  {
    id: "wu-2",
    name: "Bug Fix",
    description: "Fix bug",
    status: "complete",
    commits: ["def456"],
    value: "medium",
    createdAt: new Date(),
  },
];

describe("Analyzer", () => {
  describe("constructor", () => {
    test("should create instance with model", () => {
      const analyzer = new Analyzer({ model: mockModel });
      expect(analyzer).toBeInstanceOf(Analyzer);
    });
  });

  describe("detectWorkUnits", () => {
    test("should return empty array for empty commits", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const result = await analyzer.detectWorkUnits([]);
      expect(result).toEqual([]);
    });

    // Note: Non-empty commits would require actual API calls
    // Those would be tested in integration tests
  });

  describe("evaluateReadiness", () => {
    test("should return minimal score for no changes", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const result = await analyzer.evaluateReadiness([], [], "1.0.0", true);

      expect(result.total).toBe(0);
      expect(result.completeness).toBe(0);
      expect(result.value).toBe(0);
      expect(result.coherence).toBe(0);
      expect(result.stability).toBe(10); // CI passing
      expect(result.ready).toBe(false);
      expect(result.reasoning).toContain("No changes");
    });

    test("should return 0 stability when CI is failing", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const result = await analyzer.evaluateReadiness([], [], "1.0.0", false);

      expect(result.stability).toBe(0);
      expect(result.ready).toBe(false);
    });
  });

  describe("suggestVersionBump", () => {
    test("should suggest major for BREAKING in message", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const commitsWithBreaking = [
        {
          ...mockCommits[0],
          message: "feat: BREAKING change to API",
        },
      ];
      const result = await analyzer.suggestVersionBump([], commitsWithBreaking);
      expect(result).toBe("major");
    });

    test("should suggest major for BREAKING CHANGE in body", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const result = await analyzer.suggestVersionBump([], [breakingCommit]);
      expect(result).toBe("major");
    });

    test("should suggest major for commits starting with !", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const commitsWithBang = [
        {
          ...mockCommits[0],
          message: "!: breaking change",
        },
      ];
      const result = await analyzer.suggestVersionBump([], commitsWithBang);
      expect(result).toBe("major");
    });

    test("should suggest minor for high value work units", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const highValueUnits: WorkUnit[] = [
        {
          ...mockWorkUnits[0],
          value: "high",
        },
      ];
      const result = await analyzer.suggestVersionBump(highValueUnits, []);
      expect(result).toBe("minor");
    });

    test("should suggest minor for feat commits", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const featCommits: Commit[] = [
        {
          ...mockCommits[0],
          message: "feat: new feature",
        },
      ];
      const result = await analyzer.suggestVersionBump([], featCommits);
      expect(result).toBe("minor");
    });

    test("should suggest patch for fix commits only", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const fixCommits: Commit[] = [
        {
          ...mockCommits[1],
          message: "fix: bug fix",
        },
      ];
      const lowValueUnits: WorkUnit[] = [
        {
          ...mockWorkUnits[1],
          value: "low",
        },
      ];
      const result = await analyzer.suggestVersionBump(lowValueUnits, fixCommits);
      expect(result).toBe("patch");
    });

    test("should suggest patch for medium value work units without features", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const mediumValueUnits: WorkUnit[] = [
        {
          ...mockWorkUnits[1],
          value: "medium",
        },
      ];
      const docsCommits: Commit[] = [
        {
          ...mockCommits[0],
          message: "docs: update documentation",
        },
      ];
      const result = await analyzer.suggestVersionBump(mediumValueUnits, docsCommits);
      expect(result).toBe("patch");
    });

    test("should suggest patch for empty inputs", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const result = await analyzer.suggestVersionBump([], []);
      expect(result).toBe("patch");
    });

    test("should prioritize breaking over features", async () => {
      const analyzer = new Analyzer({ model: mockModel });
      const mixedCommits = [...mockCommits, breakingCommit];
      const result = await analyzer.suggestVersionBump(mockWorkUnits, mixedCommits);
      expect(result).toBe("major");
    });
  });
});
