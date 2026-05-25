# Architecture

Chesschemy is organized around deterministic engine modules:

- `core`: shared state, coordinates, errors, and creation helpers.
- `rules`: ruleset contracts and standard chess rule validation.
- `pieces`: piece definitions and registries.
- `movement`: movement generation contracts.
- `abilities`: active, passive, and triggered ability contracts.
- `effects`: state transition primitives used by abilities and rules.
- `events`: typed engine event records.
- `validation`: fail-fast state validation.
- `serialization`: JSON-friendly versioned game state persistence.
- `presets`: ready-to-use game setups.

Feature implementations should keep public contracts stable and grow tests with
the risk of the behavior being added.
