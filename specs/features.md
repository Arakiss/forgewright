# Forgewright Features

## Implemented (v0.1.0)

### CLI Commands
- [x] `forgewright init` - Initialize config (interactive + non-interactive)
- [x] `forgewright status` - Show readiness score with visual box
- [x] `forgewright preview` - Preview generated changelog
- [x] `forgewright release` - Create release with --force, --dry-run, --ci, --skip-github

### AI Analysis
- [x] Work unit detection from commits
- [x] Readiness evaluation (0-100 score)
- [x] Version bump suggestion (major/minor/patch)
- [x] Narrative changelog generation
- [x] Retry utilities for AI resilience

### Providers
- [x] Anthropic (Claude)
- [x] OpenAI (GPT-4)
- [x] Google (Gemini)
- [x] xAI (Grok)
- [x] Mistral
- [x] Ollama (local)
- [x] OpenAI-compatible (custom)

### Infrastructure
- [x] GitHub integration (releases, workflows)
- [x] Zod schema validation
- [x] Git operations (commits, tags, remotes)
- [x] Beautiful CLI output (spinners, boxes, colors)

## Not Yet Done

### Publishing
- [ ] Publish to npm
- [ ] Create first real release (dogfood)
- [ ] Add to npm registry

### AI-Editor Integration (Ultracite-style)
- [ ] Generate .cursorrules file for Cursor
- [ ] Generate CLAUDE.md for Claude Code
- [ ] Generate .github/copilot-instructions.md
- [ ] MCP server for Claude Desktop

### Distribution
- [ ] Product Hunt launch
- [ ] Hacker News post
- [ ] Dev.to article explaining the concept
- [ ] Twitter/X announcement

### Nice to Have (Future)
- [ ] Ultracite Cloud-style: auto-release on CI
- [ ] Monorepo support
- [ ] Pre-release versions (alpha, beta)
- [ ] Web dashboard
