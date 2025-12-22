# Contributing to Forgewright

First off, thanks for taking the time to contribute!

## Development Setup

```bash
# Clone the repo
git clone https://github.com/Arakiss/forgewright.git
cd forgewright

# Install dependencies
bun install

# Run typecheck
bun run typecheck

# Run the CLI locally
bun run forgewright --help
```

## Project Structure

```
forgewright/
├── packages/
│   ├── core/     # Git primitives, types, configuration
│   ├── ai/       # AI analysis, work units, changelog generation
│   └── cli/      # CLI commands, GitHub integration, orchestration
└── forgewright.config.ts  # Dogfooding config
```

## Guidelines

### Code Style

- Use dictionary patterns over switch-case
- Prefer `const` and immutability
- TypeScript strict mode is enabled

### Commits

We use conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: code improvement without behavior change
```

### Pull Requests

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `bun run typecheck`
5. Submit a PR

## Dogfooding

Forgewright releases itself. After your PR is merged, Forgewright will analyze if there's enough value to release and create a new version automatically.

## Questions?

Open an issue — we're happy to help!
