import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Git } from "@forgewright/core";
import { GitHub, type GitHubRepo } from "../github";

describe("GitHub", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GITHUB_TOKEN = undefined;
    process.env.CI = undefined;
    process.env.GITHUB_ACTIONS = undefined;
    process.env.GITHUB_RUN_ID = undefined;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("constructor", () => {
    test("should use provided token", () => {
      const gh = new GitHub("my-token");
      expect(gh).toBeInstanceOf(GitHub);
    });

    test("should use GITHUB_TOKEN from env when not provided", () => {
      process.env.GITHUB_TOKEN = "env-token";
      const gh = new GitHub();
      expect(gh).toBeInstanceOf(GitHub);
    });

    test("should work without token", () => {
      const gh = new GitHub();
      expect(gh).toBeInstanceOf(GitHub);
    });
  });

  describe("parseRepoFromRemote", () => {
    test("should parse SSH remote URL", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => "git@github.com:owner/repo.git",
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toEqual({ owner: "owner", name: "repo" });
    });

    test("should parse SSH remote URL without .git suffix", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => "git@github.com:myorg/myrepo",
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toEqual({ owner: "myorg", name: "myrepo" });
    });

    test("should parse HTTPS remote URL", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => "https://github.com/owner/repo.git",
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toEqual({ owner: "owner", name: "repo" });
    });

    test("should parse HTTPS remote URL without .git suffix", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => "https://github.com/myorg/myrepo",
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toEqual({ owner: "myorg", name: "myrepo" });
    });

    test("should return null when no remote URL", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => null,
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toBeNull();
    });

    test("should return null for non-GitHub remote", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => "git@gitlab.com:owner/repo.git",
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toBeNull();
    });

    test("should handle complex repo names", async () => {
      const gh = new GitHub();
      const mockGit = {
        getRemoteUrl: async () => "git@github.com:my-org/my-complex-repo.git",
      } as Git;

      const result = await gh.parseRepoFromRemote(mockGit);

      expect(result).toEqual({ owner: "my-org", name: "my-complex-repo" });
    });
  });

  describe("isCI", () => {
    test("should return false when no CI env vars are set", () => {
      const gh = new GitHub();
      expect(gh.isCI()).toBe(false);
    });

    test("should return true when CI is set", () => {
      process.env.CI = "true";
      const gh = new GitHub();
      expect(gh.isCI()).toBe(true);
    });

    test("should return true when GITHUB_ACTIONS is set", () => {
      process.env.GITHUB_ACTIONS = "true";
      const gh = new GitHub();
      expect(gh.isCI()).toBe(true);
    });

    test("should return true when GITHUB_RUN_ID is set", () => {
      process.env.GITHUB_RUN_ID = "12345";
      const gh = new GitHub();
      expect(gh.isCI()).toBe(true);
    });
  });

  describe("createRelease", () => {
    test("should throw when no token is available", async () => {
      const gh = new GitHub();
      const repo: GitHubRepo = { owner: "test", name: "repo" };

      await expect(
        gh.createRelease(repo, {
          tag: "v1.0.0",
          name: "Release 1.0.0",
          body: "Notes",
        }),
      ).rejects.toThrow("GITHUB_TOKEN is required");
    });
  });

  describe("ghCliAvailable", () => {
    test("should return boolean", async () => {
      const gh = new GitHub();
      const result = await gh.ghCliAvailable();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getLatestRelease", () => {
    test("should be a function", () => {
      const gh = new GitHub();
      expect(typeof gh.getLatestRelease).toBe("function");
    });

    // Note: Actual API calls are tested in integration tests
  });

  describe("createReleaseWithCLI", () => {
    test("should be a function", () => {
      const gh = new GitHub();
      expect(typeof gh.createReleaseWithCLI).toBe("function");
    });

    // Note: Actual CLI calls are tested in integration tests
  });
});

describe("GitHubRepo type", () => {
  test("should accept valid repo object", () => {
    const repo: GitHubRepo = {
      owner: "anthropic",
      name: "claude-code",
    };
    expect(repo.owner).toBe("anthropic");
    expect(repo.name).toBe("claude-code");
  });
});
