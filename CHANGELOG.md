# Changelog

## 0.6.1 - 2026-05-28

### Docs

- Refreshed the README opening section with a stronger package introduction,
  larger npm/GitHub badges, quick navigation links, and a visible collaboration
  message for stars, issues, examples, docs, and focused pull requests.
- Split the combined custom pieces and abilities guide into focused
  `docs/custom-pieces.md` and `docs/abilities.md` guides.
- Reworked the getting-started guide as `docs/getting-started.md`, including
  updated standard-game flow, save/restore guidance, and integration notes for
  rendering or networking.
- Added `docs/public-api.md`, `docs/collaboration.md`, and `docs/security.md`
  to clarify supported exports, contribution expectations, and trust boundaries.
- Expanded the architecture guide with an engine-flow section and diagram, module
  boundaries, determinism guidance, and public API compatibility notes.
- Updated the release guide with a documentation checklist for public API,
  behavior, examples, security, and changelog review.
- Updated runnable examples to use class-based `BasePiece` definitions and
  documented public package subpath imports.

## 0.6.0 - 2026-05-27

### Added

- Added package subpath exports for public domain APIs, including `chesschemy/abilities`, `chesschemy/core`, `chesschemy/effects`, `chesschemy/events`, `chesschemy/movement`, `chesschemy/pieces`, `chesschemy/presets`, `chesschemy/queries`, `chesschemy/rules`, `chesschemy/serialization`, `chesschemy/statuses`, and `chesschemy/validation`.

### Docs

- Updated focused ability, effect, status, piece, and movement examples to prefer domain imports while keeping root `chesschemy` imports documented for broad workflows.

## 0.5.0 - 2026-05-27

### Changed

- Hid internal engine helpers from the public package root, including low-level move application, triggered ability resolution, pseudo-legal move generation, castling state helpers, and movement board utilities. Use `makeMove`, `validateMove`, `generateLegalMoves`, and public query helpers for package-level integration.
- Kings are now immune to built-in effect helpers and statuses. Built-in effects leave kings unchanged, and game-state validation rejects persisted statuses on kings.
- Game-state validation now enforces the current two-player king-based contract, including one king per player, non-adjacent kings, one-sided check positions, and castling rights that match the current players.
- Legal move generation no longer returns king-capture moves; kings remain attackable for check detection.
- Active and triggered abilities now reject effects that leave their source player's king in check unless the ability sets `allowsSelfCheck: true`.

### Added

- Added the `AbilityDefinition.allowsSelfCheck` option for variants that intentionally allow abilities to violate chess self-check legality.
- Added a coverage script backed by `@vitest/coverage-v8`.

### Docs

- Documented the two-player king-based rules boundary, king immunity behavior, ability self-check legality, and JSON runtime state/status metadata in the README and custom pieces and abilities guide.

## 0.4.1

- Fixed package repository, homepage, issue, and README badge links after the GitHub account rename.

## 0.4.0

- Added standard chess FEN import/export helpers.
- Added custom piece and ability guide.
- Added passive capture-rule hooks for shield and protection mechanics.
- Added runnable Teleporter, Freeze Tower, Vanish Assassin, and Guardian Shield examples.
- Added insufficient-material draw detection.
- Hardened game-state validation for duplicate IDs, unknown definitions, turn metadata, and ability metadata.

## 0.3.0

- Added custom piece definition support with declarative and class-based movement.
- Added active and triggered ability execution.
- Added generic effect primitives for state updates, statuses, cooldowns, removal, and teleporting.
- Added JSON-friendly status helpers with finite duration ticking.
- Added custom variant game creation with `createVariantGame`.
- Hardened serialization validation and custom definition reattachment on restore.

## 0.2.0

- Added standard chess legal move filtering.
- Added castling, en passant, and promotion handling.
- Added checkmate and stalemate outcome helpers.
- Added public `validateMove` and `makeMove` APIs.
- Added board query helpers for UI and game-flow integration.
- Added getting-started documentation and a basic game example.

## 0.1.0

- Initial package scaffold and standard board foundation.
