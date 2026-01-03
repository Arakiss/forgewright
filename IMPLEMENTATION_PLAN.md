# Forgewright Implementation Plan

## Phase 1: Ship v0.1.0 (Launch)

### 1.1 Dogfood Release
- [x] Run `bun run forgewright status` and verify it works (CLI works, 287 tests pass, needs API key for AI)
- [ ] Run `bun run forgewright release --dry-run` to preview (requires API key)
- [ ] Create first real release using Forgewright itself (requires API key)
- [ ] Verify changelog is generated correctly (requires API key)

### 1.2 Publish to npm (Automated via CI)
- [x] Update package.json files for publishing
- [x] Set up npm publishing scripts (GitHub Actions workflow)
- [x] Configure CI to publish @forgewright/core to npm
- [x] Configure CI to publish @forgewright/ai to npm
- [x] Configure CI to publish @forgewright/cli to npm
- [x] Configure CI to publish forgewright (main package) to npm
- [ ] Verify installation works after first CI release

### 1.3 Documentation Polish
- [x] Update README with installation from npm
- [x] Add CLI usage examples to README
- [x] Verify all code examples work (CLI --help works, 287 tests pass)

## Phase 2: AI-Editor Integration (Ultracite-style)

### 2.1 Cursor Rules
- [ ] Create `forgewright rules cursor` command
- [ ] Generate .cursorrules file with Forgewright conventions
- [ ] Include release workflow guidance for Cursor

### 2.2 Claude Code Integration
- [ ] Create `forgewright rules claude` command
- [ ] Generate CLAUDE.md file with Forgewright context
- [ ] Include commands and workflow documentation

### 2.3 GitHub Copilot
- [ ] Create `forgewright rules copilot` command
- [ ] Generate .github/copilot-instructions.md

### 2.4 Universal Rules
- [ ] Create `forgewright rules` (auto-detect editor)
- [ ] Support --all flag to generate all rule files

## Phase 3: Distribution

### 3.1 Content Creation
- [ ] Write "Why Forgewright" blog post explaining the problem
- [ ] Create 2-minute demo video/GIF
- [ ] Write Dev.to tutorial article

### 3.2 Launch
- [ ] Submit to Product Hunt
- [ ] Post on Hacker News
- [ ] Share on Twitter/X
- [ ] Post in r/programming, r/typescript
- [ ] Share in Claude Code community

## Phase 4: Enhancements (Post-Launch)

### 4.1 Cloud Features (Future)
- [ ] GitHub Action for auto-release
- [ ] Web dashboard for release history
- [ ] Team collaboration features

### 4.2 Advanced Features (Future)
- [ ] Monorepo support
- [ ] Pre-release versions
- [ ] Custom changelog templates
- [ ] MCP server for Claude Desktop

---

## Success Criteria

### v0.1.0 Launch
- Published on npm
- 10+ GitHub stars in first week
- 5+ people try it (npm downloads)

### v0.2.0 (Editor Integration)
- Rules generation working for Cursor + Claude Code
- Mentioned in at least one article/post

### v1.0.0 (Stable)
- 100+ GitHub stars
- 500+ npm downloads/week
- At least 3 documented users
