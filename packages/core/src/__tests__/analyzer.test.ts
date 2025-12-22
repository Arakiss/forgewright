import { describe, expect, test } from "bun:test";
import {
  type ReadinessScore,
  ReadinessScoreSchema,
  VersionBumpSchema,
  type WorkUnit,
  WorkUnitSchema,
  WorkUnitStatusSchema,
  bumpVersion,
  parseVersion,
} from "../analyzer";

describe("WorkUnitStatusSchema", () => {
  test("should accept valid statuses", () => {
    expect(WorkUnitStatusSchema.parse("in_progress")).toBe("in_progress");
    expect(WorkUnitStatusSchema.parse("complete")).toBe("complete");
    expect(WorkUnitStatusSchema.parse("abandoned")).toBe("abandoned");
  });

  test("should reject invalid status", () => {
    expect(() => WorkUnitStatusSchema.parse("invalid")).toThrow();
    expect(() => WorkUnitStatusSchema.parse("")).toThrow();
    expect(() => WorkUnitStatusSchema.parse(123)).toThrow();
  });
});

describe("WorkUnitSchema", () => {
  const validWorkUnit: WorkUnit = {
    id: "wu-1",
    name: "Add user authentication",
    description: "Implement login/logout functionality",
    status: "complete",
    commits: ["abc123", "def456"],
    value: "high",
    createdAt: new Date("2024-01-01"),
    completedAt: new Date("2024-01-15"),
  };

  test("should accept valid work unit", () => {
    const result = WorkUnitSchema.parse(validWorkUnit);
    expect(result.id).toBe("wu-1");
    expect(result.name).toBe("Add user authentication");
    expect(result.status).toBe("complete");
    expect(result.value).toBe("high");
  });

  test("should accept work unit without completedAt", () => {
    const { completedAt, ...withoutCompletedAt } = validWorkUnit;
    const result = WorkUnitSchema.parse(withoutCompletedAt);
    expect(result.completedAt).toBeUndefined();
  });

  test("should validate value enum", () => {
    expect(WorkUnitSchema.parse({ ...validWorkUnit, value: "low" }).value).toBe("low");
    expect(WorkUnitSchema.parse({ ...validWorkUnit, value: "medium" }).value).toBe("medium");
    expect(WorkUnitSchema.parse({ ...validWorkUnit, value: "high" }).value).toBe("high");
    expect(() => WorkUnitSchema.parse({ ...validWorkUnit, value: "critical" })).toThrow();
  });

  test("should require all mandatory fields", () => {
    expect(() => WorkUnitSchema.parse({})).toThrow();
    expect(() => WorkUnitSchema.parse({ id: "wu-1" })).toThrow();
    expect(() => WorkUnitSchema.parse({ id: "wu-1", name: "test" })).toThrow();
  });
});

describe("ReadinessScoreSchema", () => {
  const validScore: ReadinessScore = {
    total: 75,
    completeness: 35,
    value: 22,
    coherence: 12,
    stability: 6,
    ready: true,
    suggestedVersion: "1.2.0",
    suggestedBump: "minor",
    reasoning: "Good progress with complete work units",
  };

  test("should accept valid readiness score", () => {
    const result = ReadinessScoreSchema.parse(validScore);
    expect(result.total).toBe(75);
    expect(result.ready).toBe(true);
    expect(result.suggestedBump).toBe("minor");
  });

  test("should enforce total range 0-100", () => {
    expect(() => ReadinessScoreSchema.parse({ ...validScore, total: -1 })).toThrow();
    expect(() => ReadinessScoreSchema.parse({ ...validScore, total: 101 })).toThrow();
    expect(ReadinessScoreSchema.parse({ ...validScore, total: 0 }).total).toBe(0);
    expect(ReadinessScoreSchema.parse({ ...validScore, total: 100 }).total).toBe(100);
  });

  test("should enforce completeness range 0-40", () => {
    expect(() => ReadinessScoreSchema.parse({ ...validScore, completeness: -1 })).toThrow();
    expect(() => ReadinessScoreSchema.parse({ ...validScore, completeness: 41 })).toThrow();
    expect(ReadinessScoreSchema.parse({ ...validScore, completeness: 40 }).completeness).toBe(40);
  });

  test("should enforce value range 0-30", () => {
    expect(() => ReadinessScoreSchema.parse({ ...validScore, value: -1 })).toThrow();
    expect(() => ReadinessScoreSchema.parse({ ...validScore, value: 31 })).toThrow();
  });

  test("should enforce coherence range 0-20", () => {
    expect(() => ReadinessScoreSchema.parse({ ...validScore, coherence: -1 })).toThrow();
    expect(() => ReadinessScoreSchema.parse({ ...validScore, coherence: 21 })).toThrow();
  });

  test("should enforce stability range 0-10", () => {
    expect(() => ReadinessScoreSchema.parse({ ...validScore, stability: -1 })).toThrow();
    expect(() => ReadinessScoreSchema.parse({ ...validScore, stability: 11 })).toThrow();
  });

  test("should allow optional fields to be undefined", () => {
    const { suggestedVersion, suggestedBump, ...minimalScore } = validScore;
    const result = ReadinessScoreSchema.parse(minimalScore);
    expect(result.suggestedVersion).toBeUndefined();
    expect(result.suggestedBump).toBeUndefined();
  });
});

describe("VersionBumpSchema", () => {
  test("should accept valid bump types", () => {
    expect(VersionBumpSchema.parse("major")).toBe("major");
    expect(VersionBumpSchema.parse("minor")).toBe("minor");
    expect(VersionBumpSchema.parse("patch")).toBe("patch");
  });

  test("should reject invalid bump types", () => {
    expect(() => VersionBumpSchema.parse("breaking")).toThrow();
    expect(() => VersionBumpSchema.parse("feature")).toThrow();
    expect(() => VersionBumpSchema.parse("")).toThrow();
  });
});

describe("parseVersion", () => {
  test("should parse standard semver", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("0.0.0")).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion("10.20.30")).toEqual({ major: 10, minor: 20, patch: 30 });
  });

  test("should parse version with v prefix", () => {
    expect(parseVersion("v1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("v0.0.1")).toEqual({ major: 0, minor: 0, patch: 1 });
  });

  test("should handle versions with additional labels", () => {
    expect(parseVersion("1.2.3-alpha")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("1.2.3-beta.1")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("v2.0.0-rc.1")).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  test("should return zeros for invalid versions", () => {
    expect(parseVersion("")).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion("invalid")).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion("1.2")).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion("just-text")).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  test("should handle edge cases", () => {
    expect(parseVersion("0.1.0")).toEqual({ major: 0, minor: 1, patch: 0 });
    expect(parseVersion("v0.0.0")).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion("100.200.300")).toEqual({ major: 100, minor: 200, patch: 300 });
  });
});

describe("bumpVersion", () => {
  test("should bump major version", () => {
    expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
    expect(bumpVersion("0.5.9", "major")).toBe("1.0.0");
    expect(bumpVersion("9.9.9", "major")).toBe("10.0.0");
  });

  test("should bump minor version", () => {
    expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(bumpVersion("0.0.0", "minor")).toBe("0.1.0");
    expect(bumpVersion("1.9.9", "minor")).toBe("1.10.0");
  });

  test("should bump patch version", () => {
    expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(bumpVersion("0.0.0", "patch")).toBe("0.0.1");
    expect(bumpVersion("1.2.99", "patch")).toBe("1.2.100");
  });

  test("should preserve v prefix", () => {
    expect(bumpVersion("v1.2.3", "major")).toBe("v2.0.0");
    expect(bumpVersion("v1.2.3", "minor")).toBe("v1.3.0");
    expect(bumpVersion("v1.2.3", "patch")).toBe("v1.2.4");
  });

  test("should not add v prefix if not present", () => {
    expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
    expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
  });

  test("should handle zero versions", () => {
    expect(bumpVersion("0.0.0", "major")).toBe("1.0.0");
    expect(bumpVersion("0.0.0", "minor")).toBe("0.1.0");
    expect(bumpVersion("0.0.0", "patch")).toBe("0.0.1");
  });

  test("should handle invalid input gracefully", () => {
    // Invalid versions parse to 0.0.0
    expect(bumpVersion("invalid", "patch")).toBe("0.0.1");
    expect(bumpVersion("", "minor")).toBe("0.1.0");
  });
});
