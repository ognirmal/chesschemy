# Custom Pieces

Chesschemy variants are built from piece definitions, movement patterns, and
JSON-friendly runtime state. The engine keeps rule resolution deterministic and
leaves balance decisions to the variant author.

The current engine validates two-player, king-based games: each side must have
exactly one `king`, kings cannot be adjacent, and generated legal moves never
capture kings.

## Choose A Definition Style

Use `BasePiece` as the main authoring style for custom pieces. It keeps a
piece's movement, guards, abilities, and future complex behavior together in one
named class. This is the best fit for pieces that should feel like first-class
game objects rather than configuration records.

Use `definePiece` as a lightweight shortcut for simple pieces with static
movement patterns, static abilities, or a few small callbacks. It is useful for
quick prototypes and tiny pieces, but class-based pieces scale better when
variant logic grows.

## Define A Moving Piece

Use `BasePiece` with movement helper methods such as `step`, `leap`, and
`slide`. Custom pieces participate in the same board, turn, and legality flow as
standard pieces.

```ts
import type { MoveCandidate, PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';

class Teleporter extends BasePiece {
  public readonly id = 'teleporter';
  public readonly displayName = 'Teleporter';

  public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return this.step(context, 'orthogonal');
  }
}

const teleporter = new Teleporter();
```

Pass piece definition instances such as `teleporter` through
`createVariantGame({ pieceDefinitions: [...] })` when assembling a variant.

## Compose Richer Movement

`BasePiece` includes default guards and helper methods for movement:

- `this.step(context, directionsOrOffsets)`
- `this.leap(context, offsetsOrPattern)`
- `this.slide(context, directionsOrOffsets)`

```ts
import type { MoveCandidate, PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';

class Archer extends BasePiece {
  public readonly id = 'archer';
  public readonly displayName = 'Archer';

  public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return this.leap(context, 'knight');
  }
}

const archer = new Archer();
```

For example, a piece can combine one-step orthogonal moves, a two-square leap,
and a diagonal ray:

```ts
import type { MoveCandidate, PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';

class PatternTester extends BasePiece {
  public readonly id = 'pattern-tester';
  public readonly displayName = 'Pattern Tester';

  public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return [
      ...this.step(context, 'orthogonal'),
      ...this.leap(context, [
        [2, 0],
        [-2, 0],
      ]),
      ...this.slide(context, [[1, 1]]),
    ];
  }
}
```

## Create A Stationary Piece

Stationary pieces are normal pieces whose `canMovePiece` guard returns `false`.
They can still own abilities, receive statuses, and serialize as runtime state.

```ts
import type { AbilityDefinition } from 'chesschemy/abilities';
import { addTargetStatus } from 'chesschemy/effects';
import type { PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';

class FreezeTower extends BasePiece {
  public readonly id = 'freeze-tower';
  public readonly displayName = 'Freeze Tower';
  public override readonly abilities: readonly AbilityDefinition[] = [
    {
      id: 'freeze',
      kind: 'active',
      displayName: 'Freeze',
      target: { range: 4, occupancy: 'enemy' },
      effects: [addTargetStatus({ id: 'frozen', duration: 1 })],
    },
  ];

  public override canMovePiece(_context: PieceBehaviorContext): boolean {
    void _context;
    return false;
  }
}

const freezeTower = new FreezeTower();
```

Pieces with a `frozen` status generate no legal moves. Finite statuses tick down
when their owner ends a turn.

`PieceInstance.state` is JSON runtime state for a piece. Statuses are stored in
`state.statuses`; `PieceStatus.data` is optional JSON metadata for an individual
status.

Kings are immune to statuses and built-in effects. If an ability targets a king
with helpers such as `addTargetStatus`, `removeTargetPiece`, or
`updateTargetPieceState`, the king is left unchanged. Persisted game states that
already contain statuses on kings fail validation.

## Use definePiece For Small Pieces

`definePiece` is still useful when the whole piece fits comfortably in one small
object.

```ts
import { leaper } from 'chesschemy/movement';
import { definePiece } from 'chesschemy/pieces';

const camel = definePiece({
  id: 'camel',
  displayName: 'Camel',
  movements: [
    leaper({
      offsets: [
        [1, 3],
        [3, 1],
        [-1, 3],
        [-3, 1],
      ],
    }),
  ],
});
```

Reach for a class once the piece needs named methods, conditional behavior,
state-dependent guards, multiple abilities, or shared logic across a piece
family.

## Next Reads

- [Abilities](abilities.md)
- [Passive Abilities](passive-abilities.md)
- [Advanced API](advanced-api.md)
