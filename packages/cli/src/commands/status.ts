import { parseArgs } from "util";
import { createEngine, analyze } from "../engine";
import * as out from "../output";

export async function status(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      json: { type: "boolean" },
    },
    allowPositionals: false,
  });

  const spin = out.spinner("Analyzing repository...");

  try {
    const engine = await createEngine();
    const result = await analyze(engine);

    spin.stop();

    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Display readiness box
    const readinessLabel = result.readiness.ready
      ? out.green("READY")
      : out.yellow("NOT READY");

    const boxContent = [
      out.statusLine(
        `Release Readiness: ${result.readiness.total}/100`,
        readinessLabel
      ),
      "─".repeat(47),
      out.statusLine(
        `Completeness:`,
        `${result.readiness.completeness}/40  ${out.progressBar(result.readiness.completeness, 40, 10)}`
      ),
      out.statusLine(
        `Value:`,
        `${result.readiness.value}/30  ${out.progressBar(result.readiness.value, 30, 10)}`
      ),
      out.statusLine(
        `Coherence:`,
        `${result.readiness.coherence}/20  ${out.progressBar(result.readiness.coherence, 20, 10)}`
      ),
      out.statusLine(
        `Stability:`,
        `${result.readiness.stability}/10  ${out.progressBar(result.readiness.stability, 10, 10)}`
      ),
      "─".repeat(47),
      out.statusLine(
        `Current version:`,
        out.cyan(result.currentVersion)
      ),
      result.suggestedVersion
        ? out.statusLine(
            `Suggested version:`,
            out.green(result.suggestedVersion)
          )
        : out.dim("No release suggested"),
    ];

    out.log("");
    out.log(out.box(boxContent, "Forgewright Status"));
    out.log("");

    // Display work units
    if (result.workUnits.length > 0) {
      out.log(out.bold("Work Units:"));
      for (const unit of result.workUnits) {
        const icon =
          unit.status === "complete"
            ? out.icons.complete
            : unit.status === "in_progress"
            ? out.icons.inProgress
            : out.icons.pending;

        const valueColor =
          unit.value === "high"
            ? out.green
            : unit.value === "medium"
            ? out.yellow
            : out.dim;

        out.log(
          `  ${icon} ${out.bold(unit.name)} ${out.dim(`(${unit.status})`)} - ${valueColor(unit.value)} value, ${unit.commits.length} commits`
        );
        out.log(`    ${out.dim(unit.description)}`);
      }
    } else {
      out.log(out.dim("No work units detected"));
    }

    out.log("");

    // Reasoning
    if (result.readiness.reasoning) {
      out.log(out.dim(`Analysis: ${result.readiness.reasoning}`));
    }

    // Exit with status for CI
    if (values.json) {
      process.exit(result.readiness.ready ? 0 : 1);
    }
  } catch (error) {
    spin.stop();
    out.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
