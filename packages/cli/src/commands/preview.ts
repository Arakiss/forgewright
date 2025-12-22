import { parseArgs } from "util";
import { createEngine, analyze, generateChangelog } from "../engine";
import * as out from "../output";

export async function preview(args: string[]): Promise<void> {
  parseArgs({
    args,
    options: {},
    allowPositionals: false,
  });

  const spin = out.spinner("Generating preview...");

  try {
    const engine = await createEngine();
    const analysis = await analyze(engine);

    if (!analysis.suggestedVersion) {
      spin.stop();
      out.warn("Not ready for release. Run 'forgewright status' for details.");
      return;
    }

    const changelog = await generateChangelog(
      engine,
      analysis,
      analysis.suggestedVersion
    );

    spin.stop();

    out.log("");
    out.log(out.bold("═".repeat(60)));
    out.log(out.bold(" RELEASE PREVIEW"));
    out.log(out.bold("═".repeat(60)));
    out.log("");
    out.log(`Version: ${out.green(analysis.suggestedVersion)}`);
    out.log(`From: ${out.cyan(analysis.currentVersion)}`);
    out.log("");
    out.log(out.bold("─".repeat(60)));
    out.log(out.bold(" CHANGELOG"));
    out.log(out.bold("─".repeat(60)));
    out.log("");
    out.log(changelog);
    out.log("");
    out.log(out.dim("─".repeat(60)));
    out.log("");
    out.log(`Run ${out.cyan("forgewright release")} to create this release.`);
  } catch (error) {
    spin.stop();
    out.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
