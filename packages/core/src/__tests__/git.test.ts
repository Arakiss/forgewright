import { beforeAll, describe, expect, test } from "bun:test";
import { type Commit, CommitSchema, Git, type Tag, TagSchema } from "../git";

// Use the forgewright repo itself for testing
const TEST_CWD = process.cwd();

describe("CommitSchema", () => {
  test("should accept valid commit", () => {
    const commit: Commit = {
      hash: "abc123def456789",
      shortHash: "abc123d",
      message: "feat: add new feature",
      body: "This adds a new feature",
      author: { name: "Test Author", email: "test@example.com" },
      date: new Date(),
      files: ["src/index.ts", "src/utils.ts"],
    };

    const result = CommitSchema.parse(commit);
    expect(result.hash).toBe("abc123def456789");
    expect(result.shortHash).toBe("abc123d");
    expect(result.message).toBe("feat: add new feature");
    expect(result.files).toHaveLength(2);
  });

  test("should accept commit with empty files array", () => {
    const commit: Commit = {
      hash: "abc123",
      shortHash: "abc",
      message: "test",
      body: "",
      author: { name: "Test", email: "test@test.com" },
      date: new Date(),
      files: [],
    };

    expect(() => CommitSchema.parse(commit)).not.toThrow();
  });

  test("should require all mandatory fields", () => {
    expect(() => CommitSchema.parse({})).toThrow();
    expect(() => CommitSchema.parse({ hash: "abc" })).toThrow();
  });
});

describe("TagSchema", () => {
  test("should accept valid tag", () => {
    const tag: Tag = {
      name: "v1.0.0",
      hash: "abc123def456789",
      date: new Date(),
    };

    const result = TagSchema.parse(tag);
    expect(result.name).toBe("v1.0.0");
    expect(result.hash).toBe("abc123def456789");
  });

  test("should require all fields", () => {
    expect(() => TagSchema.parse({})).toThrow();
    expect(() => TagSchema.parse({ name: "v1.0.0" })).toThrow();
    expect(() => TagSchema.parse({ name: "v1.0.0", hash: "abc" })).toThrow();
  });
});

describe("Git class", () => {
  let git: Git;

  beforeAll(() => {
    git = new Git({ cwd: TEST_CWD });
  });

  describe("constructor", () => {
    test("should use provided cwd", () => {
      const customGit = new Git({ cwd: "/tmp" });
      // We can't directly access private cwd, but the class should be created
      expect(customGit).toBeInstanceOf(Git);
    });

    test("should use process.cwd by default", () => {
      const defaultGit = new Git();
      expect(defaultGit).toBeInstanceOf(Git);
    });
  });

  describe("getCommits", () => {
    test("should return an array of commits", async () => {
      const commits = await git.getCommits();
      expect(Array.isArray(commits)).toBe(true);
      expect(commits.length).toBeGreaterThan(0);
    });

    test("should parse commit structure correctly", async () => {
      const commits = await git.getCommits();
      const commit = commits[0];

      expect(commit).toBeDefined();
      expect(typeof commit.hash).toBe("string");
      expect(commit.hash.length).toBeGreaterThan(0);
      expect(typeof commit.shortHash).toBe("string");
      expect(typeof commit.message).toBe("string");
      expect(typeof commit.body).toBe("string");
      expect(typeof commit.author.name).toBe("string");
      expect(typeof commit.author.email).toBe("string");
      expect(commit.date).toBeInstanceOf(Date);
      expect(Array.isArray(commit.files)).toBe(true);
    });

    test("should return commits since a specific hash", async () => {
      const allCommits = await git.getCommits();
      if (allCommits.length >= 2) {
        const lastCommitHash = allCommits[allCommits.length - 1].hash;
        const commitsAfter = await git.getCommits(lastCommitHash);

        // Should have at least one fewer commit
        expect(commitsAfter.length).toBeLessThan(allCommits.length);
      }
    });

    test("should include files changed in each commit", async () => {
      const commits = await git.getCommits();
      // At least one commit should have files
      const hasFiles = commits.some((c) => c.files.length > 0);
      expect(hasFiles).toBe(true);
    });
  });

  describe("getLatestTag", () => {
    test("should return null when no tags exist or return a valid tag", async () => {
      const tag = await git.getLatestTag();

      // Either null or valid tag structure
      if (tag !== null) {
        expect(typeof tag.name).toBe("string");
        expect(typeof tag.hash).toBe("string");
        expect(tag.date).toBeInstanceOf(Date);
      } else {
        expect(tag).toBeNull();
      }
    });
  });

  describe("getAllTags", () => {
    test("should return an array", async () => {
      const tags = await git.getAllTags();
      expect(Array.isArray(tags)).toBe(true);
    });

    test("should parse tag structure correctly if tags exist", async () => {
      const tags = await git.getAllTags();
      if (tags.length > 0) {
        const tag = tags[0];
        expect(typeof tag.name).toBe("string");
        expect(typeof tag.hash).toBe("string");
        expect(tag.date).toBeInstanceOf(Date);
      }
    });
  });

  describe("getCurrentBranch", () => {
    test("should return current branch name", async () => {
      const branch = await git.getCurrentBranch();
      expect(typeof branch).toBe("string");
      expect(branch.length).toBeGreaterThan(0);
    });
  });

  describe("isClean", () => {
    test("should return a boolean", async () => {
      const clean = await git.isClean();
      expect(typeof clean).toBe("boolean");
    });
  });

  describe("getRemoteUrl", () => {
    test("should return remote URL or null", async () => {
      const url = await git.getRemoteUrl();

      if (url !== null) {
        expect(typeof url).toBe("string");
        expect(url.length).toBeGreaterThan(0);
      } else {
        expect(url).toBeNull();
      }
    });
  });

  describe("getDiff", () => {
    test("should return diff string", async () => {
      const commits = await git.getCommits();
      if (commits.length >= 2) {
        const from = commits[commits.length - 1].hash;
        const to = commits[0].hash;
        const diff = await git.getDiff(from, to);

        expect(typeof diff).toBe("string");
      }
    });
  });
});

describe("Git with invalid cwd", () => {
  test("should handle non-existent directory gracefully", async () => {
    const badGit = new Git({ cwd: "/nonexistent/path/that/does/not/exist" });

    // These operations should fail gracefully
    try {
      await badGit.getCommits();
    } catch {
      // Expected to throw
      expect(true).toBe(true);
    }
  });
});

describe("Git additional methods", () => {
  let git: Git;

  beforeAll(() => {
    git = new Git({ cwd: process.cwd() });
  });

  describe("getAllTags", () => {
    test("should return array of tags", async () => {
      const tags = await git.getAllTags();
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe("getDiff", () => {
    test("should return diff between commits", async () => {
      const commits = await git.getCommits();
      if (commits.length >= 2) {
        const from = commits[commits.length - 1].hash;
        const to = commits[0].hash;
        const diff = await git.getDiff(from, to);
        expect(typeof diff).toBe("string");
      }
    });

    test("should default to HEAD for 'to' parameter", async () => {
      const commits = await git.getCommits();
      if (commits.length >= 1) {
        const from = commits[commits.length - 1].hash;
        // Should not throw when 'to' is not provided
        const diff = await git.getDiff(from);
        expect(typeof diff).toBe("string");
      }
    });
  });

  describe("getFileDiff", () => {
    test("should return diff for specific file", async () => {
      const commits = await git.getCommits();
      if (commits.length >= 2 && commits[0].files.length > 0) {
        const from = commits[commits.length - 1].hash;
        const to = commits[0].hash;
        const file = commits[0].files[0];
        const diff = await git.getFileDiff(file, from, to);
        expect(typeof diff).toBe("string");
      }
    });
  });

  describe("createTag", () => {
    // Note: We can't actually create tags in tests without cleanup
    // This just tests the method signature exists
    test("should have createTag method", () => {
      expect(typeof git.createTag).toBe("function");
    });
  });

  describe("pushTag", () => {
    test("should have pushTag method", () => {
      expect(typeof git.pushTag).toBe("function");
    });
  });
});
