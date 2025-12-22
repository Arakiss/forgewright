import { describe, expect, test } from "bun:test";
import type { Commit, WorkUnit } from "@forgewright/core";
import { ChangelogGenerator } from "../changelog";

// Mock model - we can't actually call AI APIs in tests
// biome-ignore lint/suspicious/noExplicitAny: Required for mocking AI SDK model
const mockModel = {} as any;

// Test fixtures
const mockCommits: Commit[] = [
  {
    hash: "abc123",
    shortHash: "abc",
    message: "feat: add user authentication",
    body: "",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date(),
    files: ["src/auth.ts"],
  },
  {
    hash: "def456",
    shortHash: "def",
    message: "fix: resolve login timeout",
    body: "",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date(),
    files: ["src/auth.ts"],
  },
  {
    hash: "ghi789",
    shortHash: "ghi",
    message: "docs: update readme",
    body: "",
    author: { name: "Dev", email: "dev@test.com" },
    date: new Date(),
    files: ["README.md"],
  },
];

const _mockWorkUnits: WorkUnit[] = [
  {
    id: "wu-1",
    name: "Authentication",
    description: "User auth system",
    status: "complete",
    commits: ["abc123", "def456"],
    value: "high",
    createdAt: new Date(),
    completedAt: new Date(),
  },
];

const inProgressWorkUnits: WorkUnit[] = [
  {
    id: "wu-1",
    name: "WIP Feature",
    description: "Work in progress",
    status: "in_progress",
    commits: ["abc123"],
    value: "medium",
    createdAt: new Date(),
  },
];

describe("ChangelogGenerator", () => {
  describe("constructor", () => {
    test("should create instance with model", () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      expect(generator).toBeInstanceOf(ChangelogGenerator);
    });
  });

  describe("generate (minimal changelog fallback)", () => {
    test("should generate minimal changelog when no complete work units", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const result = await generator.generate(inProgressWorkUnits, mockCommits, "1.0.0");

      expect(result).toContain("## 1.0.0");
      expect(result).toContain("feat: add user authentication");
      expect(result).toContain("fix: resolve login timeout");
    });

    test("should generate minimal changelog for empty work units", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const result = await generator.generate([], mockCommits, "2.0.0");

      expect(result).toContain("## 2.0.0");
    });

    test("should generate message for no changes", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const result = await generator.generate([], [], "3.0.0");

      expect(result).toContain("## 3.0.0");
      expect(result).toContain("No significant changes");
    });

    test("should group commits by type in minimal changelog", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const result = await generator.generate([], mockCommits, "1.0.0");

      expect(result).toContain("New Features");
      expect(result).toContain("Bug Fixes");
    });

    test("should include date in minimal changelog", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const result = await generator.generate([], mockCommits, "1.0.0");

      // Should contain ISO date format
      const today = new Date().toISOString().split("T")[0];
      expect(result).toContain(today);
    });

    test("should show Changes section when only non-feat/fix commits", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const docsCommits: Commit[] = [mockCommits[2]]; // docs commit only
      const result = await generator.generate([], docsCommits, "1.0.0");

      expect(result).toContain("Changes");
      expect(result).toContain("docs: update readme");
    });
  });

  describe("updateChangelogFile", () => {
    test("should insert new entry after Changelog header", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const existingContent = "# Changelog\n\n## 0.9.0 - Previous release\n\nOld content";
      const newEntry = "## 1.0.0 - New release\n\nNew content";

      const result = await generator.updateChangelogFile(existingContent, newEntry);

      expect(result).toContain("# Changelog");
      expect(result.indexOf("1.0.0")).toBeLessThan(result.indexOf("0.9.0"));
    });

    test("should handle case-insensitive header", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const existingContent = "# changelog\n\n## 0.9.0\n\nContent";
      const newEntry = "## 1.0.0\n\nNew";

      const result = await generator.updateChangelogFile(existingContent, newEntry);

      expect(result.indexOf("1.0.0")).toBeLessThan(result.indexOf("0.9.0"));
    });

    test("should prepend with header when no header exists", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const existingContent = "## 0.9.0\n\nSome content without header";
      const newEntry = "## 1.0.0\n\nNew content";

      const result = await generator.updateChangelogFile(existingContent, newEntry);

      expect(result).toContain("# Changelog");
      expect(result.indexOf("# Changelog")).toBe(0);
      expect(result.indexOf("1.0.0")).toBeLessThan(result.indexOf("0.9.0"));
    });

    test("should handle empty existing content", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const existingContent = "";
      const newEntry = "## 1.0.0\n\nFirst release";

      const result = await generator.updateChangelogFile(existingContent, newEntry);

      expect(result).toContain("# Changelog");
      expect(result).toContain("## 1.0.0");
      expect(result).toContain("First release");
    });

    test("should preserve existing content", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const existingContent = "# Changelog\n\n## 0.9.0\n\nImportant: Keep this content";
      const newEntry = "## 1.0.0\n\nNew";

      const result = await generator.updateChangelogFile(existingContent, newEntry);

      expect(result).toContain("Important: Keep this content");
      expect(result).toContain("0.9.0");
    });

    test("should handle header with trailing whitespace", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const existingContent = "# Changelog   \n\n## 0.9.0\n";
      const newEntry = "## 1.0.0\n";

      const result = await generator.updateChangelogFile(existingContent, newEntry);

      // Should still work (header regex handles this)
      expect(result).toContain("1.0.0");
    });
  });

  describe("edge cases", () => {
    test("should handle commits with special characters in messages", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const specialCommits: Commit[] = [
        {
          hash: "abc",
          shortHash: "abc",
          message: 'feat: add <script> tag & "quotes"',
          body: "",
          author: { name: "Dev", email: "dev@test.com" },
          date: new Date(),
          files: [],
        },
      ];

      const result = await generator.generate([], specialCommits, "1.0.0");

      expect(result).toContain("<script>");
      expect(result).toContain('"quotes"');
    });

    test("should handle very long commit messages", async () => {
      const generator = new ChangelogGenerator({ model: mockModel });
      const longMessage = `feat: ${"x".repeat(500)}`;
      const longCommits: Commit[] = [
        {
          hash: "abc",
          shortHash: "abc",
          message: longMessage,
          body: "",
          author: { name: "Dev", email: "dev@test.com" },
          date: new Date(),
          files: [],
        },
      ];

      const result = await generator.generate([], longCommits, "1.0.0");

      expect(result).toContain(longMessage);
    });
  });
});
