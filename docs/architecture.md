# Architecture

Chesschemy is organized around deterministic engine modules:

- `core`: shared state, coordinates, errors, and creation helpers.
- `rules`: ruleset contracts and standard chess rule validation.
- `pieces`: piece definitions and registries.
- `movement`: movement generation contracts.
- `queries`: UI-friendly board and move lookup helpers.
- `abilities`: active, passive, and triggered ability contracts.
- `effects`: state transition primitives used by abilities and rules.
- `events`: typed engine event records.
- `validation`: fail-fast state validation.
- `serialization`: JSON-friendly versioned game state persistence.
- `presets`: ready-to-use game setups.

The standard chess base currently supports legal move generation, castling, en
passant, promotion, checkmate/stalemate outcomes, public move execution, and
board query helpers.

Feature implementations should keep public contracts stable and grow tests with
the risk of the behavior being added.
