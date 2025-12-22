<p align="center">
  <img src="https://raw.githubusercontent.com/Arakiss/forgewright/main/.github/assets/logo.svg" alt="Forgewright" width="200" />
</p>

<h1 align="center">Forgewright</h1>

<p align="center">
  <strong>AI-first release system for LLM-assisted development</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/forgewright"><img src="https://img.shields.io/npm/v/forgewright?style=flat-square&color=blue" alt="npm version" /></a>
  <a href="https://github.com/Arakiss/forgewright/actions"><img src="https://img.shields.io/github/actions/workflow/status/Arakiss/forgewright/release.yml?style=flat-square" alt="Build Status" /></a>
  <a href="https://github.com/Arakiss/forgewright/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Arakiss/forgewright?style=flat-square" alt="License" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-Bun-f9f1e1?style=flat-square&logo=bun" alt="Bun" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/types-TypeScript-blue?style=flat-square&logo=typescript" alt="TypeScript" /></a>
</p>

<p align="center">
  <a href="#why-forgewright">Why</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#commands">Commands</a>
</p>

---

## The Problem

Current release tools were designed for **human development velocity**:

| Tool | Assumption | Reality with AI |
|------|------------|-----------------|
| semantic-release | 1 PR = significant work | 50+ commits/day is normal |
| changesets | Developers write changelogs | AI generates hundreds of changes |
| release-it | Time-based releases | Value-based releases needed |

With LLM-assisted development, a single developer produces in **hours** what teams took **weeks**. Release tooling hasn't caught up.

## Why Forgewright?

Forgewright understands that **releases should happen when there's meaningful value to ship**, not when arbitrary conditions are met.

```
TRADITIONAL                          FORGEWRIGHT
───────────                          ───────────
commit → pattern match? → release    commits → AI analyzes VALUE → release when meaningful
```

### Key Concepts

- **Work Units** instead of commits — coherent bundles of changes that deliver value
- **Readiness Score** instead of rules — AI evaluates completeness, value, coherence, stability
- **Narrative Changelogs** — human-readable summaries, not commit lists

## Quick Start

```bash
# Initialize in your project
bunx forgewright init

# Check release readiness
bunx forgewright status

# Preview changelog
bunx forgewright preview

# Create release
bunx forgewright release
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        FORGEWRIGHT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. ANALYZE         2. SCORE           3. RELEASE          │
│   ┌─────────┐        ┌─────────┐        ┌─────────┐         │
│   │ Commits │───────▶│Readiness│───────▶│Changelog│         │
│   │    ↓    │        │  Score  │        │   +     │         │
│   │  Work   │        │ (0-100) │        │  Tag    │         │
│   │ Units   │        │         │        │   +     │         │
│   └─────────┘        └─────────┘        │ GitHub  │         │
│                                         │ Release │         │
│                                         └─────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Readiness Score

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| **Completeness** | 40% | Are work units finished? Tests passing? |
| **Value** | 30% | User-facing impact? Features vs fixes? |
| **Coherence** | 20% | Do changes make sense together? |
| **Stability** | 10% | CI green? No regressions? |

**Release threshold: 70/100** (configurable)

## Commands

### `forgewright init`

Initialize Forgewright in your project. Creates `forgewright.config.ts`.

```bash
forgewright init                    # Interactive setup
forgewright init --provider anthropic  # Non-interactive
```

### `forgewright status`

Check release readiness with detailed scoring.

```bash
forgewright status          # Human-readable output
forgewright status --json   # JSON for CI/CD
```

```
┌─ Forgewright Status ────────────────────────────┐
│ Release Readiness: 73/100              ✓ READY  │
├─────────────────────────────────────────────────┤
│ Completeness:  35/40  [████████░░]              │
│ Value:         22/30  [███████░░░]              │
│ Coherence:     12/20  [██████░░░░]              │
│ Stability:      4/10  [████░░░░░░]              │
├─────────────────────────────────────────────────┤
│ Suggested version: 0.8.0 (minor)                │
└─────────────────────────────────────────────────┘
```

### `forgewright preview`

Preview the generated changelog before releasing.

```bash
forgewright preview
```

### `forgewright release`

Create a new release with narrative changelog.

```bash
forgewright release            # Interactive confirmation
forgewright release --force    # Skip readiness check
forgewright release --ci       # Non-interactive for CI
forgewright release --dry-run  # Preview without releasing
```

## Configuration

```typescript
// forgewright.config.ts
import { defineConfig } from '@forgewright/core';

export default defineConfig({
  // AI Provider (required)
  ai: {
    provider: 'anthropic',  // 'anthropic' | 'openai' | 'google'
    model: 'claude-sonnet-4-20250514',  // optional override
  },

  // Release mode
  mode: 'confirm',  // 'auto' | 'confirm'

  // Readiness thresholds
  thresholds: {
    release: 70,        // Minimum score to release
    minWorkUnits: 1,    // At least 1 complete work unit
  },

  // GitHub integration
  github: {
    createRelease: true,
    releaseNotes: true,
  },
});
```

## Requirements

- [Bun](https://bun.sh) runtime
- AI provider API key:
  - `ANTHROPIC_API_KEY` for Claude
  - `OPENAI_API_KEY` for GPT-4
  - `GOOGLE_API_KEY` for Gemini

## GitHub Actions

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2

      - run: bun install

      - name: Check & Release
        run: |
          if bunx forgewright status --json | jq -e '.readiness.ready'; then
            bunx forgewright release --ci
          fi
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Philosophy

> "Ship when the ship is ready"

Forgewright is named after the craftspeople who build ships — emphasizing **careful construction before launch**. In a world of AI-assisted development velocity, the bottleneck isn't writing code, it's knowing **when your changes are ready to ship**.

## Packages

| Package | Description |
|---------|-------------|
| `@forgewright/core` | Git primitives and type definitions |
| `@forgewright/ai` | AI analysis, work units, changelog generation |
| `@forgewright/cli` | CLI and GitHub integration |

## Minimal Dependencies

Forgewright is built with **only 5 runtime dependencies** — everything else is ad-hoc TypeScript:

| Dependency | Purpose |
|------------|---------|
| `zod` | Schema validation |
| `ai` | Vercel AI SDK core |
| `@ai-sdk/anthropic` | Claude provider |
| `@ai-sdk/openai` | GPT-4 provider |
| `@ai-sdk/google` | Gemini provider |

All git operations, config loading, changelog formatting, CLI output, and GitHub integration are implemented from scratch using Bun's native APIs. No `execa`, `chalk`, `commander`, `inquirer`, or `octokit` — just TypeScript.

## Contributing

Forgewright releases itself using Forgewright (dogfooding from day 1).

## License

MIT © [Arakiss](https://github.com/Arakiss)
