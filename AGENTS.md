# Repository Guidelines

## Project Structure & Module Organization
This repository currently contains the product requirements in `PRD.md`. The planned codebase is a TypeScript-first npm package organized around engine modules described in the PRD: `src/core`, `src/rules`, `src/pieces`, `src/movement`, `src/abilities`, `src/effects`, `src/events`, `src/validation`, `src/serialization`, and `src/presets`. Keep tests in `test/` or colocated as `*.test.ts` for small units. Put usage examples in `examples/` and reference docs in `docs/` if those directories are added.

## Build, Test, and Development Commands
Implementation scaffolding is not present yet, so contributors should add the standard package scripts early. Target commands:

- `npm install`: install dependencies.
- `npm run build`: compile the package and emit typings.
- `npm test`: run the unit test suite in a deterministic environment.
- `npm run lint`: check TypeScript and style issues.
- `npm run format`: apply repository formatting rules.

Prefer keeping scripts portable and CI-friendly; avoid browser-only tooling for core engine validation.

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation and semicolon-consistent formatting. Prefer named exports for public engine APIs. Use `camelCase` for functions and variables, `PascalCase` for types/classes, and `SCREAMING_SNAKE_CASE` only for true constants. Name files by responsibility, such as `createGame.ts`, `pieceRegistry.ts`, or `standardPreset.ts`. Keep engine logic deterministic and side-effect conscious.

## Testing Guidelines
Favor unit tests over broad integration tests for move legality, state transitions, serialization, and custom ability resolution. Name tests `*.test.ts` and mirror module names where possible, for example `test/rules/checkmate.test.ts`. Add replay-style fixtures for bug regressions and verify identical inputs produce identical outcomes.

## Commit & Pull Request Guidelines
There is no existing commit history yet, so start with short imperative commit subjects, for example `Add standard board state model`. Keep commits focused. PRs should explain the rule or engine behavior being changed, list affected modules, summarize test coverage, and include API examples when public contracts move.

## Security & Configuration Tips
Do not couple the engine to UI frameworks, network state, or nondeterministic APIs such as `Date.now()` or random number generation without injectable seams. Serialization formats should remain JSON-friendly and versionable from the start.
