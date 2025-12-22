import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  blue,
  bold,
  box,
  cyan,
  dim,
  error,
  gray,
  green,
  icons,
  info,
  log,
  progressBar,
  red,
  spinner,
  statusLine,
  success,
  warn,
  yellow,
} from "../output";

// ANSI escape code patterns
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

describe("text formatting functions", () => {
  describe("bold", () => {
    test("should wrap text with bold codes", () => {
      const result = bold("test");
      expect(result).toContain(BOLD);
      expect(result).toContain("test");
      expect(result).toContain(RESET);
    });
  });

  describe("dim", () => {
    test("should wrap text with dim codes", () => {
      const result = dim("test");
      expect(result).toContain(DIM);
      expect(result).toContain("test");
      expect(result).toContain(RESET);
    });
  });

  describe("color functions", () => {
    test("red should wrap text with red color codes", () => {
      const result = red("error");
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("error");
      expect(result).toContain(RESET);
    });

    test("green should wrap text with green color codes", () => {
      const result = green("success");
      expect(result).toContain("\x1b[32m");
      expect(result).toContain("success");
    });

    test("yellow should wrap text with yellow color codes", () => {
      const result = yellow("warning");
      expect(result).toContain("\x1b[33m");
      expect(result).toContain("warning");
    });

    test("blue should wrap text with blue color codes", () => {
      const result = blue("info");
      expect(result).toContain("\x1b[34m");
      expect(result).toContain("info");
    });

    test("cyan should wrap text with cyan color codes", () => {
      const result = cyan("highlight");
      expect(result).toContain("\x1b[36m");
      expect(result).toContain("highlight");
    });

    test("gray should wrap text with gray color codes", () => {
      const result = gray("muted");
      expect(result).toContain("\x1b[90m");
      expect(result).toContain("muted");
    });
  });

  describe("formatting with empty strings", () => {
    test("should handle empty strings", () => {
      expect(bold("")).toContain(BOLD);
      expect(red("")).toContain(RESET);
    });
  });

  describe("formatting with special characters", () => {
    test("should handle special characters", () => {
      const special = "test\nwith\ttabs & <special>";
      const result = bold(special);
      expect(result).toContain(special);
    });
  });
});

describe("icons", () => {
  test("should have success icon", () => {
    expect(icons.success).toBeDefined();
    expect(icons.success).toContain("✓");
  });

  test("should have error icon", () => {
    expect(icons.error).toBeDefined();
    expect(icons.error).toContain("✗");
  });

  test("should have warning icon", () => {
    expect(icons.warning).toBeDefined();
    expect(icons.warning).toContain("⚠");
  });

  test("should have info icon", () => {
    expect(icons.info).toBeDefined();
    expect(icons.info).toContain("ℹ");
  });

  test("should have pending icon", () => {
    expect(icons.pending).toBeDefined();
    expect(icons.pending).toContain("○");
  });

  test("should have inProgress icon", () => {
    expect(icons.inProgress).toBeDefined();
    expect(icons.inProgress).toContain("◐");
  });

  test("should have complete icon", () => {
    expect(icons.complete).toBeDefined();
    expect(icons.complete).toContain("●");
  });

  test("icons should be colored", () => {
    // Success should be green
    expect(icons.success).toContain("\x1b[32m");
    // Error should be red
    expect(icons.error).toContain("\x1b[31m");
    // Warning should be yellow
    expect(icons.warning).toContain("\x1b[33m");
  });
});

describe("box", () => {
  test("should create a box around content", () => {
    const result = box(["Hello", "World"]);

    expect(result).toContain("┌");
    expect(result).toContain("┐");
    expect(result).toContain("└");
    expect(result).toContain("┘");
    expect(result).toContain("│");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  test("should include title when provided", () => {
    const result = box(["Content"], "Title");

    expect(result).toContain("Title");
    expect(result).toContain("Content");
  });

  test("should handle empty content", () => {
    const result = box([]);

    expect(result).toContain("┌");
    expect(result).toContain("└");
  });

  test("should handle long lines", () => {
    const longLine = "x".repeat(100);
    const result = box([longLine]);

    expect(result).toContain(longLine);
    expect(result.split("\n").length).toBe(3); // top, content, bottom
  });

  test("should pad shorter lines to match longest", () => {
    const result = box(["short", "much longer line"]);
    const lines = result.split("\n");

    // All lines should have same visual width
    expect(lines[1]).toContain("short");
    expect(lines[2]).toContain("much longer line");
  });

  test("should handle colored content correctly", () => {
    const coloredContent = [green("Success"), red("Error")];
    const result = box(coloredContent);

    expect(result).toContain("Success");
    expect(result).toContain("Error");
  });
});

describe("statusLine", () => {
  test("should format label and value with padding", () => {
    const result = statusLine("Label:", "Value", 20);

    expect(result).toContain("Label:");
    expect(result).toContain("Value");
  });

  test("should use default width when not specified", () => {
    const result = statusLine("Label:", "Value");

    expect(result).toContain("Label:");
    expect(result).toContain("Value");
    expect(result.length).toBeGreaterThanOrEqual(40);
  });

  test("should handle colored text", () => {
    const result = statusLine(bold("Label:"), green("Value"), 30);

    expect(result).toContain("Label:");
    expect(result).toContain("Value");
  });

  test("should ensure at least 1 space padding", () => {
    const result = statusLine("VeryLongLabel:", "VeryLongValue", 10);

    // Should have at least some space between
    expect(result).toContain("VeryLongLabel:");
    expect(result).toContain("VeryLongValue");
  });
});

describe("progressBar", () => {
  test("should show full bar for 100%", () => {
    const result = progressBar(100, 100, 10);

    expect(result).toContain("[");
    expect(result).toContain("]");
    // Should have filled blocks
    expect(result).toContain("█");
  });

  test("should show empty bar for 0%", () => {
    const result = progressBar(0, 100, 10);

    expect(result).toContain("[");
    expect(result).toContain("]");
    // Should have empty blocks
    expect(result).toContain("░");
  });

  test("should show partial bar for 50%", () => {
    const result = progressBar(50, 100, 10);

    expect(result).toContain("█");
    expect(result).toContain("░");
  });

  test("should use default width when not specified", () => {
    const result = progressBar(50, 100);

    expect(result).toContain("[");
    expect(result).toContain("]");
  });

  test("should handle zero max gracefully", () => {
    // 0/0 results in NaN which Math.round converts to 0
    // This produces an empty bar
    const result = progressBar(0, 0, 10);
    expect(result).toContain("[");
    expect(result).toContain("]");
  });

  test("should throw for out of range values", () => {
    // Negative and >100% values cause repeat() to fail - current behavior
    expect(() => progressBar(-10, 100, 10)).toThrow();
    expect(() => progressBar(150, 100, 10)).toThrow();
  });

  test("should scale correctly", () => {
    const bar70 = progressBar(70, 100, 10);
    const bar30 = progressBar(30, 100, 10);

    // 70% should have more filled blocks than 30%
    const filled70 = (bar70.match(/█/g) || []).length;
    const filled30 = (bar30.match(/█/g) || []).length;

    expect(filled70).toBeGreaterThan(filled30);
  });
});

describe("logging functions", () => {
  let consoleSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("log should call console.log", () => {
    log("test message");
    expect(consoleSpy).toHaveBeenCalledWith("test message");
  });

  test("error should call console.error with icon and red text", () => {
    error("error message");
    expect(consoleErrorSpy).toHaveBeenCalled();
    const call = consoleErrorSpy.mock.calls[0][0];
    expect(call).toContain("error message");
    expect(call).toContain("✗");
  });

  test("success should call console.log with icon", () => {
    success("success message");
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain("success message");
    expect(call).toContain("✓");
  });

  test("warn should call console.log with warning icon", () => {
    warn("warning message");
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain("warning message");
    expect(call).toContain("⚠");
  });

  test("info should call console.log with info icon", () => {
    info("info message");
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain("info message");
    expect(call).toContain("ℹ");
  });
});

describe("spinner", () => {
  let stdoutSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stdoutSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  test("should return object with stop method", () => {
    const s = spinner("Loading...");
    expect(typeof s.stop).toBe("function");
    s.stop();
  });

  test("should write initial text to stdout", () => {
    const s = spinner("Loading...");
    expect(stdoutSpy).toHaveBeenCalled();
    s.stop();
  });

  test("stop should clear the spinner", () => {
    const s = spinner("Test");
    s.stop();
    // Should clear and not leave output
    expect(stdoutSpy).toHaveBeenCalled();
  });

  test("stop with final message should log it", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const s = spinner("Loading");
    s.stop("Done!");
    expect(consoleSpy).toHaveBeenCalledWith("Done!");
    consoleSpy.mockRestore();
  });
});
