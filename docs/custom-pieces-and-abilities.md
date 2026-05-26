# Custom Pieces And Abilities

Chesschemy variants are built from piece definitions, movement patterns,
abilities, effects, and JSON-friendly runtime state. The engine keeps rule
resolution deterministic and leaves balance decisions to the variant author.

## Define A Moving Piece

Use `definePiece` with movement helpers such as `stepper`, `slider`, or
`leaper`. Custom pieces participate in the same board, turn, and legality flow
as standard pieces.

```ts
import { createVariantGame, definePiece, stepper } from 'chesschemy';

const teleporter = definePiece({
  id: 'teleporter',
  displayName: 'Teleporter',
  movements: [stepper({ directions: 'orthogonal' })],
});

const game = createVariantGame({
  board: { files: 8, ranks: 8 },
  pieces: [
    {
      id: 'white-teleporter',
      definitionId: 'teleporter',
      owner: 'white',
      position: { file: 4, rank: 4 },
    },
    { id: 'white-king', definitionId: 'king', owner: 'white', position: { file: 1, rank: 1 } },
    { id: 'black-king', definitionId: 'king', owner: 'black', position: { file: 8, rank: 8 } },
  ],
  pieceDefinitions: [teleporter],
  ruleset: {
    id: 'teleporter-demo',
    version: '1.0.0',
    displayName: 'Teleporter Demo',
  },
});
```

## Add An Active Ability

Active abilities are invoked with `useAbility`. Target rules describe whether a
target is required, how far it can be, and what occupancy it must satisfy.

```ts
import { definePiece, teleportSourceToTarget, useAbility } from 'chesschemy';

const wizard = definePiece({
  id: 'wizard',
  displayName: 'Wizard',
  abilities: [
    {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 3, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    },
  ],
});

const nextGame = useAbility(game, {
  pieceId: 'white-wizard',
  abilityId: 'blink',
  target: { file: 6, rank: 5 },
});
```

Unless `consumesTurn` is set to `false`, active abilities advance the turn and
record an ability action in history.

## Create A Stationary Piece

Stationary pieces are normal pieces with `canMove: false`. They can still own
abilities, receive statuses, and serialize as runtime state.

```ts
import { addTargetStatus, definePiece } from 'chesschemy';

const freezeTower = definePiece({
  id: 'freeze-tower',
  displayName: 'Freeze Tower',
  canMove: false,
  abilities: [
    {
      id: 'freeze',
      kind: 'active',
      displayName: 'Freeze',
      target: { range: 4, occupancy: 'enemy' },
      effects: [addTargetStatus({ id: 'frozen', duration: 1 })],
    },
  ],
});
```

Pieces with a `frozen` status generate no legal moves. Finite statuses tick down
when their owner ends a turn.

## React To Events

Triggered abilities run from deterministic engine events. The example below
removes the source piece after it captures another piece.

```ts
import type { AbilityDefinition } from 'chesschemy';
import { definePiece, removeSource, stepper } from 'chesschemy';

const vanishAfterCapture: AbilityDefinition = {
  id: 'vanish-after-capture',
  kind: 'triggered',
  displayName: 'Vanish After Capture',
  shouldTrigger: ({ event, source }) =>
    event?.kind === 'piece:captured' && event.byPiece.id === source.id,
  effects: [removeSource()],
};

const assassin = definePiece({
  id: 'assassin',
  displayName: 'Assassin',
  movements: [stepper({ directions: 'diagonal' })],
  abilities: [vanishAfterCapture],
});
```

Current engine events include accepted actions, moved pieces, captured pieces,
used abilities, removed pieces, and ended turns.

## Add Passive Protection

Passive abilities can currently answer capture-rule questions with `canCapture`.
This supports shield-style mechanics where a piece protects nearby allies from
being captured.

```ts
import type { AbilityDefinition } from 'chesschemy';

const shieldAdjacentAlly: AbilityDefinition = {
  id: 'shield-adjacent-ally',
  kind: 'passive',
  displayName: 'Shield Adjacent Ally',
  effects: [],
  canCapture: ({ source, attacker, targetPiece }) => {
    if (attacker.owner === source.owner || targetPiece.owner !== source.owner) {
      return true;
    }

    const fileDistance = Math.abs(source.position.file - targetPiece.position.file);
    const rankDistance = Math.abs(source.position.rank - targetPiece.position.rank);
    return Math.max(fileDistance, rankDistance) > 1;
  },
};
```

See [Passive Abilities](passive-abilities.md) for design notes and the current
supported hook.

## Serialize Custom Games

`serializeGameState` stores JSON-friendly runtime state. Piece definitions,
ability callbacks, and effect functions are intentionally not included in the
serialized payload. Reattach definitions when restoring.

```ts
import { deserializeGameState, serializeGameState } from 'chesschemy';

const saved = serializeGameState(game);
const restored = deserializeGameState(saved, {
  pieceDefinitions: [teleporter, freezeTower, assassin],
});
```

FEN support is for standard chess positions only. Use `serializeGameState` for
custom pieces and abilities.

## Runnable Examples

- `examples/teleporter.ts`
- `examples/freeze-tower.ts`
- `examples/vanish-assassin.ts`
- `examples/guardian-shield.ts`
