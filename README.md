# Forgewright

> Intelligent Release System for LLM-Assisted Development

Forgewright is a release tool designed from the ground up for AI-assisted development workflows. It uses AI to understand when there's meaningful value to ship, not arbitrary triggers like time or commit counts.

## Why Forgewright?

Current release tools (semantic-release, release-it, changesets) were designed for human development velocity. With LLM-assisted development, a single developer can produce in hours what previously took teams weeks.

Forgewright understands:
- **Work Units** instead of commits — coherent bundles of changes that deliver value
- **Readiness** instead of rules — AI evaluates when a release makes sense
- **Narrative changelogs** — human-readable summaries, not commit lists

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

## Requirements

- Bun runtime
- AI provider API key (Anthropic, OpenAI, or Google)

## Configuration

```typescript
// forgewright.config.ts
import { defineConfig } from '@forgewright/core';

export default defineConfig({
  ai: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
  },

  mode: 'confirm', // 'auto' | 'confirm'

  thresholds: {
    release: 70,        // Minimum readiness score
    minWorkUnits: 1,    // At least 1 complete work unit
  },

  github: {
    createRelease: true,
    releaseNotes: true,
  },
});
```

## How It Works

1. **Analyze commits** — Groups commits into Work Units (features, fixes, refactors)
2. **Score readiness** — Evaluates completeness, value, coherence, and stability
3. **Generate changelog** — Creates narrative documentation of changes
4. **Create release** — Tags, pushes, and creates GitHub release

## License

MIT
