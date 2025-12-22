// Terminal output utilities - no dependencies, just ANSI

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const FG = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

export function bold(text: string): string {
  return `${BOLD}${text}${RESET}`;
}

export function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

export function red(text: string): string {
  return `${FG.red}${text}${RESET}`;
}

export function green(text: string): string {
  return `${FG.green}${text}${RESET}`;
}

export function yellow(text: string): string {
  return `${FG.yellow}${text}${RESET}`;
}

export function blue(text: string): string {
  return `${FG.blue}${text}${RESET}`;
}

export function cyan(text: string): string {
  return `${FG.cyan}${text}${RESET}`;
}

export function gray(text: string): string {
  return `${FG.gray}${text}${RESET}`;
}

// Status icons
export const icons = {
  success: green("✓"),
  error: red("✗"),
  warning: yellow("⚠"),
  info: blue("ℹ"),
  pending: gray("○"),
  inProgress: yellow("◐"),
  complete: green("●"),
};

// Box drawing
export function box(content: string[], title?: string): string {
  const maxLen = Math.max(
    ...content.map((l) => stripAnsi(l).length),
    title ? stripAnsi(title).length + 2 : 0
  );
  const width = maxLen + 2;

  const top = title
    ? `┌─ ${title} ${"─".repeat(width - stripAnsi(title).length - 3)}┐`
    : `┌${"─".repeat(width)}┐`;
  const bottom = `└${"─".repeat(width)}┘`;

  const lines = content.map((line) => {
    const padding = width - stripAnsi(line).length - 1;
    return `│ ${line}${" ".repeat(padding)}│`;
  });

  return [top, ...lines, bottom].join("\n");
}

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// Logging
export function log(message: string): void {
  console.log(message);
}

export function error(message: string): void {
  console.error(`${icons.error} ${red(message)}`);
}

export function success(message: string): void {
  console.log(`${icons.success} ${message}`);
}

export function warn(message: string): void {
  console.log(`${icons.warning} ${yellow(message)}`);
}

export function info(message: string): void {
  console.log(`${icons.info} ${message}`);
}

// Progress
export function spinner(text: string): { stop: (final?: string) => void } {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  process.stdout.write(`${frames[0]} ${text}`);

  const interval = setInterval(() => {
    i = (i + 1) % frames.length;
    process.stdout.write(`\r${frames[i]} ${text}`);
  }, 80);

  return {
    stop(final?: string) {
      clearInterval(interval);
      process.stdout.write("\r" + " ".repeat(text.length + 3) + "\r");
      if (final) log(final);
    },
  };
}

// Table-like formatting for status display
export function statusLine(label: string, value: string, width = 40): string {
  const padding = width - stripAnsi(label).length - stripAnsi(value).length;
  return `${label}${" ".repeat(Math.max(1, padding))}${value}`;
}

export function progressBar(value: number, max: number, width = 20): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const bar = green("█".repeat(filled)) + gray("░".repeat(empty));
  return `[${bar}]`;
}
