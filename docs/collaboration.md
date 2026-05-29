# Collaboration Guide

This guide is for contributors changing Chesschemy code, examples, or docs.

## Project Shape

Chesschemy is a TypeScript package with public root and subpath exports. The
engine should stay deterministic, JSON-friendly where state is persisted, and
clear about what is public API versus internal implementation.

Important directories:

- `src/core`: shared state, coordinates, creation, and errors.
- `src/rules`: move legality, check detection, outcomes, and move execution.
- `src/pieces` and `src/movement`: custom piece behavior.
- `src/abilities`, `src/effects`, `src/events`, `src/statuses`: variant hooks.
- `src/serialization`: versioned state snapshots and standard FEN.
- `docs`: user-facing guides.
- `examples`: small runnable examples that compile against public exports.
- `test`: behavior, API, and regression coverage.

## Development Loop

Install dependencies:

```sh
npm install
```

Useful checks:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Before publishing or asking for a release review, run:

```sh
npm run prepublishOnly
npm run pack:dry-run
npm run publish:dry-run
```

## API Change Rules

Prefer additive public API changes. When changing an existing API, update:

- the relevant source barrel export
- `package.json` exports if a new subpath is added
- `test/api/publicExports.test.ts`
- `README.md`
- `docs/public-api.md`
- `docs/advanced-api.md`
- at least one focused behavior test or example

Do not document planned APIs as available behavior. If a feature is a future
direction, say so explicitly.

## Test Expectations

Scale test coverage to risk:

- Standard chess rule changes need legal-move and outcome tests.
- Ability or effect changes need validation, state transition, and king-safety
  tests.
- Serialization changes need round-trip and validation tests.
- Public export changes need API compatibility tests.
- Documentation examples should compile against public package exports.

Use one-based coordinates in tests and examples unless the code under test is
specifically about coordinate conversion.

## Documentation Standards

Examples should be small, copy-pasteable, and realistic. Prefer imports from
`chesschemy` or documented subpaths. Avoid private module imports in docs and
examples.

When documenting custom variants, include both kings and keep examples within
the current two-player, king-based validation model.

Use `save` and `load` for custom variants. Use `fen` and `fromFen` only for
standard chess positions.

## Release Notes

Changelog entries should be user-facing and grouped by version:

- `Added`
- `Changed`
- `Fixed`
- `Docs`

Mention API names and behavior that package consumers care about. Avoid internal
implementation details unless they explain a compatibility or migration issue.
