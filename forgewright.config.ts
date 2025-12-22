import { defineConfig } from "@forgewright/core";

// Dogfooding: Forgewright releases itself
export default defineConfig({
  ai: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
  },

  mode: "confirm",

  thresholds: {
    release: 70,
    minWorkUnits: 1,
  },

  completeness: {
    requireTests: true,
    requireReview: true,
  },

  versioning: {
    strategy: "semver",
  },

  github: {
    createRelease: true,
    releaseNotes: true,
  },
});
