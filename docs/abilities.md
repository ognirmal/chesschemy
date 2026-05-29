# Abilities

Abilities add programmable behavior to custom pieces. Active abilities are
called by application code, passive abilities answer engine rule questions, and
triggered abilities react to deterministic engine events.

Abilities are part of trusted piece definitions. Serialized game state does not
store ability callbacks or effect functions; reattach trusted definitions when
restoring custom games.

## Add An Active Ability

Active abilities are invoked with `useAbility`. Target rules describe whether a
target is required, how far it can be, and what occupancy it must satisfy.

```ts
import type { AbilityDefinition } from 'chesschemy/abilities';
import { useAbility } from 'chesschemy/abilities';
import { teleportSourceToTarget } from 'chesschemy/effects';
import { BasePiece } from 'chesschemy/pieces';

class Wizard extends BasePiece {
  public readonly id = 'wizard';
  public readonly displayName = 'Wizard';
  public override readonly abilities: readonly AbilityDefinition[] = [
    {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 3, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    },
  ];
}

const wizard = new Wizard();

const nextGame = useAbility(game, {
  pieceId: 'white-wizard',
  abilityId: 'blink',
  target: { file: 6, rank: 5 },
});
```

Unless `consumesTurn` is set to `false`, active abilities advance the turn and
record an ability action in history.

Active abilities also obey king safety by default. After an ability's effects
resolve, the acting player's king must not be in check, even when
`consumesTurn: false`. Set `allowsSelfCheck: true` only for variants that
intentionally allow this non-chess behavior.

## Add Statuses And Cooldowns

Statuses are JSON-friendly entries stored under `PieceInstance.state.statuses`.
Built-in status helpers can add, remove, inspect, and tick statuses.

```ts
import { addTargetStatus, setSourceAbilityCooldown } from 'chesschemy/effects';
import { hasAbilityCooldown } from 'chesschemy/statuses';

const freeze = {
  id: 'freeze',
  kind: 'active',
  displayName: 'Freeze',
  target: { range: 3, occupancy: 'enemy' },
  canActivate: ({ source }) => !hasAbilityCooldown(source, 'freeze'),
  effects: [addTargetStatus({ id: 'frozen', duration: 1 }), setSourceAbilityCooldown('freeze', 2)],
};
```

Pieces with a `frozen` status generate no legal moves. Finite statuses tick down
when their owner ends a turn and are removed when their duration reaches zero.
Kings are immune to built-in statuses and effects.

## React To Events

Triggered abilities run from deterministic engine events. The example below
removes the source piece after it captures another piece.

```ts
import type { AbilityDefinition } from 'chesschemy/abilities';
import { removeSource } from 'chesschemy/effects';
import type { MoveCandidate, PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';

const vanishAfterCapture: AbilityDefinition = {
  id: 'vanish-after-capture',
  kind: 'triggered',
  displayName: 'Vanish After Capture',
  shouldTrigger: ({ event, source }) =>
    event?.kind === 'piece:captured' && event.byPiece.id === source.id,
  effects: [removeSource()],
};

class Assassin extends BasePiece {
  public readonly id = 'assassin';
  public readonly displayName = 'Assassin';
  public override readonly abilities = [vanishAfterCapture];

  public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return this.step(context, 'diagonal');
  }
}

const assassin = new Assassin();
```

Current engine events include accepted actions, moved pieces, captured pieces,
used abilities, removed pieces, and ended turns.

Triggered abilities follow the same royal immunity rule for built-in effects:
`removeSource` will not remove a king, and source/target state or status helpers
will not mutate kings.

Triggered abilities also use the same king-safety default as active abilities:
they are rejected if their effects leave the source player's king in check,
unless the ability sets `allowsSelfCheck: true`.

## Add Passive Protection

Passive abilities can currently answer capture-rule questions with `canCapture`.
This supports shield-style mechanics where a piece protects nearby allies from
being captured.

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

    const fileDistance = Math.abs(source.position.file - targetPiece.position.file);
    const rankDistance = Math.abs(source.position.rank - targetPiece.position.rank);
    return Math.max(fileDistance, rankDistance) > 1;
  },
};
```

See [Passive Abilities](passive-abilities.md) for design notes and the current
supported hook.

## Serialize Custom Games

`save` stores JSON-friendly runtime state. Piece definitions, ability callbacks,
and effect functions are intentionally not included in the saved payload.
Reattach definitions when restoring with `load`.

```ts
import { load, save } from 'chesschemy';

const saved = save(game);
const restored = load(saved, {
  pieceDefinitions: [wizard, assassin],
});
```

FEN support is for standard chess positions only. Use `save` and `load` for
custom pieces and abilities.

## Runnable Examples

- `examples/teleporter.ts`
- `examples/freeze-tower.ts`
- `examples/vanish-assassin.ts`
- `examples/guardian-shield.ts`
