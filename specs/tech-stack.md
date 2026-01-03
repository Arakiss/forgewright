# Forgewright Tech Stack

## Runtime
- **Bun** - Fast JavaScript runtime, native TypeScript

## Core Dependencies (Minimal - only 5)
| Package | Purpose |
|---------|---------|
| `zod` | Schema validation |
| `ai` | Vercel AI SDK v6.0 |
| `@ai-sdk/anthropic` | Claude provider |
| `@ai-sdk/openai` | GPT-4 provider |
| `@ai-sdk/google` | Gemini provider |
| `@ai-sdk/xai` | Grok provider |
| `@ai-sdk/mistral` | Mistral provider |
| `@ai-sdk/openai-compatible` | Custom providers |
| `ollama-ai-provider` | Ollama local |

## Custom Implementations (No External Deps)
- Git operations via Bun `$` shell
- CLI output (colors, spinners, boxes)
- Config loading
- Changelog formatting
- GitHub API integration

## Dev Dependencies
- TypeScript (strict mode)
- Biome (linting/formatting)
- Bun test (testing)

## Package Structure
```
packages/
├── core/     # Git, config, types
├── ai/       # AI analysis, prompts
└── cli/      # Commands, GitHub, output
```

## Philosophy
- Minimal dependencies
- Built from scratch when possible
- Type-safe throughout
- Fast (Bun + minimal deps)
