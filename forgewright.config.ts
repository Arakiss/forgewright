import { defineConfig } from "@forgewright/core";

// Dogfooding: Forgewright releases itself
export default defineConfig({
  ai: {
    provider: "openai",
    model: "gpt-5.2",
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
