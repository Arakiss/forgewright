# Forgewright Code Conventions

## TypeScript
- Strict mode enabled
- Prefer `type` over `interface`
- Use Zod for runtime validation
- Export types from index.ts

## File Structure
```
src/
├── index.ts          # Public exports
├── __tests__/        # Tests next to source
└── [feature]/        # Feature folders
```

## Naming
- camelCase for functions/variables
- PascalCase for types/classes
- kebab-case for files
- SCREAMING_SNAKE for constants

## Functions
- Prefer pure functions
- Use Result pattern for errors (not exceptions)
- Small, focused functions
- Document with JSDoc for public APIs

## Git
- Conventional commits: feat, fix, chore, docs, test
- Commit message: imperative mood, lowercase start
- Example: `feat(ai): add retry wrapper for resilience`

## Testing
- Test file: `[name].test.ts`
- Use `describe` and `it` blocks
- Mock external services (AI, GitHub)
- Aim for 90%+ coverage

## CLI Output
- Use custom output functions (not console.log)
- Colors: green=success, red=error, yellow=warning, blue=info
- Spinners for async operations
- Boxes for important information

## Error Handling
- Return errors, don't throw
- Use typed error objects
- Provide actionable error messages
- Include context in errors
