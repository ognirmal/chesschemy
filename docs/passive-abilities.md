# Passive Abilities

Passive abilities describe always-on rules owned by pieces. They are evaluated
from the current game state during engine queries and action validation. Passive
logic must be deterministic and should avoid mutating state directly.

## Current Hook: Capture Rules

The first supported passive hook is `canCapture`. It lets a passive ability
allow or deny a capture before the move is generated.

```ts
import type { AbilityDefinition } from 'chesschemy/abilities';

const shieldAdjacentAlly: AbilityDefinition = {
  id: 'shield-adjacent-ally',
  kind: 'passive',
  displayName: 'Shield Adjacent Ally',
  effects: [],
  canCapture: ({ source, attacker, targetPiece }) => {
    if (attacker.owner === source.owner || targetPiece.owner !== source.owner) {
      return true;
    }

    if (targetPiece.id === source.id) {
      return true;
    }

    const fileDistance = Math.abs(source.position.file - targetPiece.position.file);
    const rankDistance = Math.abs(source.position.rank - targetPiece.position.rank);
    return Math.max(fileDistance, rankDistance) > 1;
  },
};
```

When any passive `canCapture` hook returns `false`, the capture is not legal.
The same filtering is used by legal move generation and check detection, so a
shielded king is not considered in check from a piece that cannot capture it.

## Guardian Example

The Guardian pattern is a passive shield aura:

- The Guardian protects adjacent allied pieces.
- Enemy pieces cannot capture protected allies.
- The Guardian does not protect itself in the example.
- Friendly captures are already illegal and should return `true`.

See `examples/guardian-shield.ts` for a runnable version.

## Design Direction

Passive abilities should remain small hooks that answer a specific rules
question. Future hooks should be added only when a real variant example needs
them. Likely candidates:

- movement filtering
- target protection for active abilities
- effect interception
- aura-derived statuses
- attack contribution or suppression

Each hook should receive explicit context, return plain values, and avoid hidden
global state. Runtime state still belongs in `GameState`, and serialized payloads
should remain JSON-friendly.
