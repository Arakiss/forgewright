import {
  Analyzer,
  ChangelogGenerator,
  getApiKeyEnvVar,
  getModel,
  hasApiKey,
} from "@forgewright/ai";
import {
  bumpVersion,
  type ForgewrightConfig,
  Git,
  loadConfigWithDetails,
  type ReadinessScore,
  type WorkUnit,
} from "@forgewright/core";
import { GitHub } from "./github";

export interface EngineContext {
  config: ForgewrightConfig;
  git: Git;
  github: GitHub;
  analyzer: Analyzer;
  changelog: ChangelogGenerator;
}

export interface AnalysisResult {
  workUnits: WorkUnit[];
  readiness: ReadinessScore;
  currentVersion: string;
  suggestedVersion: string | null;
}

export interface ReleaseResult {
  version: string;
  changelog: string;
  tagCreated: boolean;
  githubReleaseUrl?: string;
}

export async function createEngine(cwd: string = process.cwd()): Promise<EngineContext> {
  const result = await loadConfigWithDetails(cwd);

  if (!result.success) {
    switch (result.error) {
      case "not_found":
        throw new Error("No forgewright.config.ts found. Run 'forgewright init' first.");
      case "parse_error":
        throw new Error(`Failed to parse config file: ${result.details ?? "Unknown error"}`);
      case "validation_error":
        throw new Error(`Invalid configuration:\n${result.details ?? "Unknown validation error"}`);
      default:
        throw new Error("Failed to load configuration");
    }
  }

  const config = result.config;

  // Validate API key before creating model
  if (!hasApiKey(config.ai.provider)) {
    const envVar = getApiKeyEnvVar(config.ai.provider);
    throw new Error(
      `Missing API key for ${config.ai.provider}. Set the ${envVar} environment variable.`,
    );
  }

  const model = getModel({
    provider: config.ai.provider,
    model: config.ai.model,
  });

  return {
    config,
    git: new Git({ cwd }),
    github: new GitHub(),
    analyzer: new Analyzer({ model }),
    changelog: new ChangelogGenerator({ model }),
  };
}

export async function analyze(ctx: EngineContext): Promise<AnalysisResult> {
  // Get current version from latest tag
  const latestTag = await ctx.git.getLatestTag();
  const currentVersion = latestTag?.name ?? "0.0.0";

  // Get commits since last release
  const commits = await ctx.git.getCommits(latestTag?.hash);

  if (commits.length === 0) {
    return {
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
      currentVersion,
      suggestedVersion: null,
    };
  }

  // Detect work units (no persistence, always recalculate)
  const workUnits = await ctx.analyzer.detectWorkUnits(commits);

  // Check CI status via GitHub API
  const repo = await ctx.github.parseRepoFromRemote(ctx.git);
  const branch = await ctx.git.getCurrentBranch();
  const ciStatus = repo ? await ctx.github.getWorkflowStatus(repo, branch) : "unknown";
  // Consider "unknown" as passing (repo might not use GitHub Actions)
  const ciPassing = ciStatus === "success" || ciStatus === "unknown";

  // Evaluate readiness
  const readiness = await ctx.analyzer.evaluateReadiness(
    commits,
    workUnits,
    currentVersion,
    ciPassing,
  );

  // Suggest version
  const suggestedBump =
    readiness.suggestedBump ?? (await ctx.analyzer.suggestVersionBump(workUnits, commits));
  const suggestedVersion = readiness.ready ? bumpVersion(currentVersion, suggestedBump) : null;

  return {
    workUnits,
    readiness,
    currentVersion,
    suggestedVersion,
  };
}

export async function generateChangelog(
  ctx: EngineContext,
  analysis: AnalysisResult,
  version: string,
): Promise<string> {
  const latestTag = await ctx.git.getLatestTag();
  const commits = await ctx.git.getCommits(latestTag?.hash);

  return ctx.changelog.generate(analysis.workUnits, commits, version);
}

export async function executeRelease(
  ctx: EngineContext,
  version: string,
  changelog: string,
  options: { dryRun?: boolean; skipGitHub?: boolean } = {},
): Promise<ReleaseResult> {
  if (options.dryRun) {
    return {
      version,
      changelog,
      tagCreated: false,
    };
  }

  // Verify clean working directory
  const isClean = await ctx.git.isClean();
  if (!isClean) {
    throw new Error("Working directory is not clean. Commit or stash changes first.");
  }

  // Create and push tag
  const tagName = version.startsWith("v") ? version : `v${version}`;
  await ctx.git.createTag(tagName, `Release ${version}`);
  await ctx.git.pushTag(tagName);

  let githubReleaseUrl: string | undefined;

  // Create GitHub release
  if (!options.skipGitHub && ctx.config.github.createRelease) {
    const repo = await ctx.github.parseRepoFromRemote(ctx.git);

    if (repo) {
      // Prefer gh CLI if available
      if (await ctx.github.ghCliAvailable()) {
        githubReleaseUrl = await ctx.github.createReleaseWithCLI({
          tag: tagName,
          title: version,
          notes: changelog,
        });
      } else {
        const release = await ctx.github.createRelease(repo, {
          tag: tagName,
          name: version,
          body: changelog,
        });
        githubReleaseUrl = release.html_url;
      }
    }
  }

  return {
    version,
    changelog,
    tagCreated: true,
    githubReleaseUrl,
  };
}
