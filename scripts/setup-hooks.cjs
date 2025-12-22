#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * ======================
 * Automatically installs git hooks when running `bun install`.
 * This runs via the "prepare" script in package.json.
 */

const fs = require("node:fs");
const path = require("node:path");

const HOOKS_DIR = path.join(__dirname, "..", ".git", "hooks");

// Pre-commit hook: runs format check, typecheck, and tests
const PRE_COMMIT_HOOK = `#!/bin/sh
#
# Pre-commit hook: Run checks before commit
#

echo "Running format check..."
bun run format:check
if [ $? -ne 0 ]; then
    echo ""
    echo "Commit blocked: Code formatting issues found"
    echo "   Run 'bun run format' to fix."
    echo ""
    exit 1
fi

echo "Running typecheck..."
bun run typecheck
if [ $? -ne 0 ]; then
    echo ""
    echo "Commit blocked: TypeScript errors found"
    echo ""
    exit 1
fi

echo "Running tests..."
bun test
if [ $? -ne 0 ]; then
    echo ""
    echo "Commit blocked: Tests failed"
    echo ""
    exit 1
fi

echo "All checks passed!"
exit 0
`;

function setupHooks() {
  // Check if we're in a git repository
  if (!fs.existsSync(HOOKS_DIR)) {
    console.log("Not a git repository or .git/hooks not found. Skipping hook setup.");
    return;
  }

  const hooks = [{ name: "pre-commit", content: PRE_COMMIT_HOOK }];

  console.log("Setting up git hooks...");

  for (const hook of hooks) {
    const hookPath = path.join(HOOKS_DIR, hook.name);

    // Check if hook already exists (and is not a sample)
    if (fs.existsSync(hookPath) && !hookPath.endsWith(".sample")) {
      const existing = fs.readFileSync(hookPath, "utf8");
      if (existing.includes("forgewright") || existing.includes("format:check")) {
        console.log(`   ${hook.name} hook already installed`);
        continue;
      }
      // Backup existing hook
      fs.copyFileSync(hookPath, `${hookPath}.backup`);
      console.log(`   Backed up existing ${hook.name} to ${hook.name}.backup`);
    }

    fs.writeFileSync(hookPath, hook.content, { mode: 0o755 });
    console.log(`   Installed ${hook.name} hook`);
  }

  console.log("Git hooks setup complete!");
}

// Run setup
setupHooks();
