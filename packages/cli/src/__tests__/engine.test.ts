import { describe, expect, test } from "bun:test";
import type { ForgewrightConfig, ReadinessScore, WorkUnit } from "@forgewright/core";
import type { AnalysisResult, EngineContext, ReleaseResult } from "../engine";

// Note: We can't easily test createEngine without mocking the file system
// and AI SDK, so we focus on testing the interfaces and type contracts

describe("EngineContext interface", () => {
  test("should accept valid context object", () => {
    // Type check - this compiles if types are correct
    const mockContext: EngineContext = {
      config: {
        ai: { provider: "anthropic" },
        mode: "confirm",
        thresholds: { release: 70, minWorkUnits: 1 },
        completeness: { requireTests: true, requireReview: true },
        versioning: { strategy: "semver" },
        github: { createRelease: true, releaseNotes: true },
      },
      git: {} as any,
      github: {} as any,
      analyzer: {} as any,
      changelog: {} as any,
    };

    expect(mockContext.config.ai.provider).toBe("anthropic");
    expect(mockContext.config.mode).toBe("confirm");
  });
});

describe("AnalysisResult interface", () => {
  test("should accept valid analysis result", () => {
    const mockWorkUnit: WorkUnit = {
      id: "wu-1",
      name: "Test Feature",
      description: "A test feature",
      status: "complete",
      commits: ["abc123"],
      value: "high",
      createdAt: new Date(),
    };

    const mockReadiness: ReadinessScore = {
      total: 75,
      completeness: 35,
      value: 22,
      coherence: 12,
      stability: 6,
      ready: true,
      suggestedBump: "minor",
      reasoning: "Good progress",
    };

    const result: AnalysisResult = {
      workUnits: [mockWorkUnit],
      readiness: mockReadiness,
      currentVersion: "1.0.0",
      suggestedVersion: "1.1.0",
    };

    expect(result.workUnits.length).toBe(1);
    expect(result.readiness.ready).toBe(true);
    expect(result.currentVersion).toBe("1.0.0");
    expect(result.suggestedVersion).toBe("1.1.0");
  });

  test("should accept null suggestedVersion when not ready", () => {
    const result: AnalysisResult = {
      workUnits: [],
      readiness: {
        total: 30,
        completeness: 15,
        value: 10,
        coherence: 5,
        stability: 0,
        ready: false,
        reasoning: "Not enough progress",
      },
      currentVersion: "1.0.0",
      suggestedVersion: null,
    };

    expect(result.suggestedVersion).toBeNull();
    expect(result.readiness.ready).toBe(false);
  });
});

describe("ReleaseResult interface", () => {
  test("should accept full release result", () => {
    const result: ReleaseResult = {
      version: "1.1.0",
      changelog: "## 1.1.0\n\nNew features added.",
      tagCreated: true,
      githubReleaseUrl: "https://github.com/owner/repo/releases/tag/v1.1.0",
    };

    expect(result.version).toBe("1.1.0");
    expect(result.changelog).toContain("1.1.0");
    expect(result.tagCreated).toBe(true);
    expect(result.githubReleaseUrl).toBeDefined();
  });

  test("should accept dry-run release result", () => {
    const result: ReleaseResult = {
      version: "1.1.0",
      changelog: "## 1.1.0\n\nChanges.",
      tagCreated: false,
    };

    expect(result.tagCreated).toBe(false);
    expect(result.githubReleaseUrl).toBeUndefined();
  });

  test("should accept release result without GitHub URL", () => {
    const result: ReleaseResult = {
      version: "1.0.0",
      changelog: "Changelog content",
      tagCreated: true,
      // No githubReleaseUrl - e.g., when skipGitHub is true
    };

    expect(result.tagCreated).toBe(true);
    expect(result.githubReleaseUrl).toBeUndefined();
  });
});

describe("engine module contracts", () => {
  test("empty analysis result should have specific structure", () => {
    // This represents what analyze() returns when there are no commits
    const emptyResult: AnalysisResult = {
      workUnits: [],
      readiness: {
        total: 0,
        completeness: 0,
        value: 0,
        coherence: 0,
        stability: 0,
        ready: false,
        reasoning: "No commits since last release",
      },
      currentVersion: "0.0.0",
      suggestedVersion: null,
    };

    expect(emptyResult.workUnits).toHaveLength(0);
    expect(emptyResult.readiness.total).toBe(0);
    expect(emptyResult.readiness.ready).toBe(false);
    expect(emptyResult.suggestedVersion).toBeNull();
  });

  test("config should match ForgewrightConfig shape", () => {
    const config: ForgewrightConfig = {
      ai: { provider: "openai", model: "gpt-4" },
      mode: "auto",
      thresholds: {
        release: 80,
        minWorkUnits: 2,
        maxAge: "7d",
      },
      completeness: {
        requireTests: false,
        requireReview: false,
      },
      versioning: {
        strategy: "semver",
      },
      github: {
        createRelease: true,
        releaseNotes: true,
      },
    };

    expect(config.ai.provider).toBe("openai");
    expect(config.ai.model).toBe("gpt-4");
    expect(config.mode).toBe("auto");
    expect(config.thresholds.release).toBe(80);
  });
});

describe("version handling", () => {
  test("should handle versions with v prefix", () => {
    const result: AnalysisResult = {
      workUnits: [],
      readiness: {
        total: 75,
        completeness: 30,
        value: 25,
        coherence: 15,
        stability: 5,
        ready: true,
        suggestedBump: "patch",
        reasoning: "Ready",
      },
      currentVersion: "v1.0.0",
      suggestedVersion: "v1.0.1",
    };

    expect(result.currentVersion.startsWith("v")).toBe(true);
    expect(result.suggestedVersion?.startsWith("v")).toBe(true);
  });

  test("should handle versions without v prefix", () => {
    const result: AnalysisResult = {
      workUnits: [],
      readiness: {
        total: 75,
        completeness: 30,
        value: 25,
        coherence: 15,
        stability: 5,
        ready: true,
        suggestedBump: "minor",
        reasoning: "Ready",
      },
      currentVersion: "1.0.0",
      suggestedVersion: "1.1.0",
    };

    expect(result.currentVersion).toBe("1.0.0");
    expect(result.suggestedVersion).toBe("1.1.0");
  });
});
