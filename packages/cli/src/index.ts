#!/usr/bin/env bun

import { parseArgs } from "util";
import { init } from "./commands/init";
import { status } from "./commands/status";
import { preview } from "./commands/preview";
import { release } from "./commands/release";
import * as out from "./output";

const VERSION = "0.1.0";

const HELP = `
${out.bold("Forgewright")} - Intelligent Release System for LLM-Assisted Development

${out.bold("Usage:")}
  forgewright <command> [options]

${out.bold("Commands:")}
  init        Initialize Forgewright in a project
  status      Check release readiness
  preview     Preview the next release changelog
  release     Create a new release

${out.bold("Options:")}
  -h, --help     Show this help message
  -v, --version  Show version

${out.bold("Examples:")}
  ${out.dim("# Initialize with Anthropic")}
  forgewright init --provider anthropic

  ${out.dim("# Check if ready to release")}
  forgewright status

  ${out.dim("# Preview changelog")}
  forgewright preview

  ${out.dim("# Create release")}
  forgewright release

  ${out.dim("# Force release even if not ready")}
  forgewright release --force
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
    allowPositionals: true,
    strict: false,
  });

  if (values.version) {
    out.log(`forgewright v${VERSION}`);
    return;
  }

  if (values.help || positionals.length === 0) {
    out.log(HELP);
    return;
  }

  const [command, ...args] = positionals;

  const commands: Record<string, (args: string[]) => Promise<void>> = {
    init,
    status,
    preview,
    release,
  };

  const handler = commands[command ?? ""];
  if (!handler) {
    out.error(`Unknown command: ${command}`);
    out.log(`Run ${out.cyan("forgewright --help")} for usage.`);
    process.exit(1);
  }

  await handler(args);
}

main().catch((error) => {
  out.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
