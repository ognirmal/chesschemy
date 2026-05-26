# Changelog

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
