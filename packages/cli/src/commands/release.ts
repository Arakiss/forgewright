import { parseArgs } from "util";
import {
  createEngine,
  analyze,
  generateChangelog,
  executeRelease,
} from "../engine";
import * as out from "../output";

export async function release(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      force: { type: "boolean", short: "f" },
      "dry-run": { type: "boolean" },
      ci: { type: "boolean" },
      "skip-github": { type: "boolean" },
    },
    allowPositionals: false,
  });

  const spin = out.spinner("Analyzing repository...");

  try {
    const engine = await createEngine();
    const analysis = await analyze(engine);

    spin.stop();

    // Check readiness
    if (!analysis.readiness.ready && !values.force) {
      out.warn("Not ready for release.");
      out.log("");
      out.log(`Readiness: ${analysis.readiness.total}/100 (need 70+)`);
      out.log(`Reason: ${analysis.readiness.reasoning}`);
      out.log("");
      out.log(`Use ${out.cyan("--force")} to release anyway.`);
      process.exit(1);
    }

    const version = analysis.suggestedVersion ?? analysis.currentVersion;

    // Generate changelog
    const changelogSpin = out.spinner("Generating changelog...");
    const changelog = await generateChangelog(engine, analysis, version);
    changelogSpin.stop();

    // In confirm mode, ask for approval
    if (engine.config.mode === "confirm" && !values.ci) {
      out.log("");
      out.log(out.bold("Release Summary"));
      out.log(out.dim("─".repeat(40)));
      out.log(`Version: ${out.green(version)}`);
      out.log(`Work Units: ${analysis.workUnits.filter((u) => u.status === "complete").length} complete`);
      out.log("");
      out.log(out.bold("Changelog Preview:"));
      out.log(out.dim("─".repeat(40)));
      // Show first 10 lines of changelog
      out.log(changelog.split("\n").slice(0, 10).join("\n"));
      if (changelog.split("\n").length > 10) {
        out.log(out.dim("..."));
      }
      out.log("");

      const confirm = prompt(`Create release ${version}? [y/N] `);
      if (confirm?.toLowerCase() !== "y") {
        out.log("Release cancelled.");
        process.exit(0);
      }
    }

    // Execute release
    const releaseSpin = out.spinner(`Creating release ${version}...`);

    const result = await executeRelease(engine, version, changelog, {
      dryRun: values["dry-run"],
      skipGitHub: values["skip-github"],
    });

    releaseSpin.stop();

    if (values["dry-run"]) {
      out.success(`Dry run complete. Would release ${out.green(version)}`);
      out.log("");
      out.log(out.bold("Changelog:"));
      out.log(changelog);
      return;
    }

    out.success(`Released ${out.green(version)}`);

    if (result.githubReleaseUrl) {
      out.log("");
      out.log(`GitHub Release: ${out.cyan(result.githubReleaseUrl)}`);
    }

    // Update CHANGELOG.md
    const changelogPath = `${process.cwd()}/CHANGELOG.md`;
    const changelogFile = Bun.file(changelogPath);

    if (await changelogFile.exists()) {
      const existing = await changelogFile.text();
      const updated = await engine.changelog.updateChangelogFile(existing, changelog);
      await Bun.write(changelogPath, updated);
      out.log(`Updated ${out.cyan("CHANGELOG.md")}`);
    } else {
      await Bun.write(changelogPath, `# Changelog\n\n${changelog}\n`);
      out.log(`Created ${out.cyan("CHANGELOG.md")}`);
    }
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
