# Public API Guide

Chesschemy exposes the package root and domain subpaths through `package.json`.
Import from these entry points:

```ts
import { createGame, makeMove } from 'chesschemy';
import { useAbility } from 'chesschemy/abilities';
import { stepper } from 'chesschemy/movement';
```

Do not import from `dist/*` or `src/*` in application code. Those paths are not
part of the compatibility contract.

## Root Export

The package root re-exports all public domain barrels. It is the easiest import
path for applications and examples:

```ts
import {
  createGame,
  createVariantGame,
  definePiece,
  getLegalMovesForPiece,
  makeMove,
  serializeGameState,
  useAbility,
} from 'chesschemy';
```

Use subpaths when you want clearer ownership or smaller import groups.

## Core

Subpath: `chesschemy/core`

Primary values:

- `createGame(options?)`: create and validate a standard game or validate a
  supplied initial state.
- `createVariantGame(options)`: create and validate a custom two-player,
  king-based variant state.
- `ValidationError`: thrown by fail-fast APIs when input is invalid.
- Coordinate helpers: `coordinateKey`, `isCoordinateInsideBoard`,
  `sameCoordinate`.
- State types: `GameState`, `PieceInstance`, `Coordinate`, `BoardDimensions`,
  `TurnState`, `GameStatus`, `MoveAction`, `AbilityAction`, `PseudoLegalMove`,
  `StandardChessState`, and related aliases.

```ts
import { createGame, isCoordinateInsideBoard } from 'chesschemy/core';

const game = createGame();
const onBoard = isCoordinateInsideBoard({ file: 5, rank: 4 }, game.board);
```

Coordinates are one-based. Standard `e4` is `{ file: 5, rank: 4 }`.

## Rules

Subpath: `chesschemy/rules`

Move APIs:

- `generateLegalMoves(state, options?)`: all legal moves for a player.
- `validateMove(state, input)`: returns a discriminated validation result.
- `makeMove(state, input)`: validates, applies, resolves triggered abilities,
  updates status, and returns the next state.

Check and outcome APIs:

- `isKingInCheck(state, playerId)`
- `isSquareAttacked(state, square, byPlayer)`
- `isCheckmate(state, playerId?)`
- `isStalemate(state, playerId?)`
- `isInsufficientMaterial(state)`
- `getGameOutcome(state)`
- `standardRuleset`

```ts
import { makeMove, validateMove } from 'chesschemy/rules';

const input = { pieceId: 'white-pawn-5', to: { file: 5, rank: 4 } };
const result = validateMove(game, input);

const nextGame = result.valid ? makeMove(game, input) : game;
```

`makeMove` throws `ValidationError` when the input does not match exactly one
legal move.

## Queries

Subpath: `chesschemy/queries`

Use query helpers for UI selection, move highlighting, and board inspection:

- `getPieceAt(state, coordinate)`
- `getPieceById(state, pieceId)`
- `getPiecesForPlayer(state, playerId)`
- `getActivePlayerPieces(state)`
- `isOccupied(state, coordinate)`
- `isOccupiedByPlayer(state, coordinate, playerId)`
- `isOccupiedByOpponent(state, coordinate, playerId?)`
- `getLegalMovesForPiece(state, pieceId)`
- `getLegalMovesForSquare(state, coordinate)`
- `getLegalDestinationsForPiece(state, pieceId)`

```ts
import { getLegalDestinationsForPiece, getPieceAt } from 'chesschemy/queries';

const selected = getPieceAt(game, { file: 5, rank: 2 });
const destinations = selected === undefined ? [] : getLegalDestinationsForPiece(game, selected.id);
```

## Pieces

Subpath: `chesschemy/pieces`

Piece APIs define reusable behavior for custom variants:

- `BasePiece`: class base for custom piece definitions.
- `definePiece(config)`: compact helper for small `PieceDefinition` objects.
- `PieceRegistry`: small registry with duplicate-id validation.
- `standardPieces`: built-in definitions for `king`, `queen`, `rook`,
  `bishop`, `knight`, and `pawn`.
- Types: `PieceDefinition`, `DefinePieceConfig`.

Choose the definition style by complexity:

- Use `BasePiece` as the primary style for pieces with custom movement
  composition, state-dependent guards, shared class helpers, multiple abilities,
  or behavior that is easier to read as named methods.
- Use `definePiece` for simple pieces with static movements, static abilities,
  or one or two concise callbacks.
- Use `PieceRegistry` when application code needs explicit registration and
  lookup outside `createVariantGame`.

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

Standard chess piece movement is implemented by the rules engine. Custom pieces
use their own movement definitions.

## Movement

Subpath: `chesschemy/movement`

Movement primitives generate target squares for custom pieces:

- `leaper(options)`: fixed offsets, including `pattern: 'knight'`.
- `stepper(options)`: one square in a direction set or explicit offsets.
- `slider(options)`: repeated movement in a direction set or explicit offsets.
- `stationary()`: no generated targets.
- Types: `MovementPattern`, `MovementContext`, `PieceBehaviorContext`,
  `MoveCandidate`, `Offset`, `DirectionSet`.

Direction sets are `orthogonal`, `diagonal`, and `all`.

```ts
import { slider, stepper } from 'chesschemy/movement';

const rookLike = slider({ directions: 'orthogonal' });
const kingLike = stepper({ directions: 'all' });
```

## Abilities

Subpath: `chesschemy/abilities`

Ability APIs:

- `validateAbility(state, input)`: validate an active ability without throwing.
- `useAbility(state, input)`: validate and apply an active ability.
- `canCaptureTarget(state, attacker, targetPiece)`: evaluate passive capture
  hooks.
- Types: `AbilityDefinition`, `AbilityInput`, `AbilityValidationResult`,
  `AbilityContext`, `PassiveCaptureContext`, `AbilityTargetRules`.

Ability kinds:

- `active`: called by application code with `useAbility`.
- `passive`: always-on hooks such as `canCapture`.
- `triggered`: resolved from deterministic engine events.

```ts
import { useAbility } from 'chesschemy/abilities';
import { teleportSourceToTarget } from 'chesschemy/effects';

const blink = {
  id: 'blink',
  kind: 'active',
  displayName: 'Blink',
  target: { range: 3, occupancy: 'empty' },
  effects: [teleportSourceToTarget()],
} as const;

const nextGame = useAbility(game, {
  pieceId: 'white-teleporter',
  abilityId: 'blink',
  target: { file: 6, rank: 5 },
});
```

Active and triggered abilities enforce king safety unless
`allowsSelfCheck: true` is set on the ability.

## Effects

Subpath: `chesschemy/effects`

Built-in effect helpers:

- `teleportSourceToTarget(options?)`
- `removeSource(options?)`
- `removeTargetPiece(options?)`
- `updateSourceState(patch, options?)`
- `updateTargetPieceState(patch, options?)`
- `addSourceStatus(status, options?)`
- `addTargetStatus(status, options?)`
- `removeSourceStatus(statusId, options?)`
- `removeTargetStatus(statusId, options?)`
- `setSourceAbilityCooldown(abilityId, duration, options?)`
- Types: `EffectDefinition`, `EffectContext`, `EffectOptions`.

Effects are plain state-transition objects with an `apply(context)` function.
Built-in effects do not mutate kings.

## Statuses

Subpath: `chesschemy/statuses`

Status APIs work with `PieceInstance.state.statuses`:

- `getPieceStatuses(piece)`
- `getPieceStatus(piece, statusId)`
- `hasPieceStatus(piece, statusId)`
- `withAddedPieceStatus(piece, status)`
- `withRemovedPieceStatus(piece, statusId)`
- `tickPieceStatuses(piece)`
- `getAbilityCooldownStatusId(abilityId)`
- `hasAbilityCooldown(piece, abilityId)`
- Type: `PieceStatus`

Finite statuses have positive integer `duration` values. Kings are status
immune.

## Events

Subpath: `chesschemy/events`

Public type:

- `GameEvent`

Current event kinds include `action:accepted`, `ability:used`, `piece:moved`,
`piece:captured`, `piece:removed`, and `turn:ended`. Triggered abilities receive
events through their ability context.

## Serialization

Subpath: `chesschemy/serialization`

State snapshot APIs:

- `serializeGameState(state)`
- `deserializeGameState(serialized, options?)`
- `SERIALIZATION_VERSION`
- Types: `SerializedGameState`, `SerializableGameState`,
  `DeserializeGameStateOptions`.

FEN APIs:

- `STARTING_FEN`
- `serializeFen(state)`
- `deserializeFen(fen)`

Use `serializeGameState` for custom variants. The payload intentionally omits
piece definitions, ability callbacks, and effect functions; pass definitions to
`deserializeGameState` when restoring. Use FEN for standard chess positions.

## Presets

Subpath: `chesschemy/presets`

- `standardPreset`: creates the standard 8x8 starting state.
- Type: `GamePreset`

Most applications should call `createGame()` instead of using the preset
directly.

## Validation

Subpath: `chesschemy/validation`

- `validateGameState(state)`: throws `ValidationError` when a state violates
  engine invariants.

Validation currently enforces positive board dimensions, unique piece ids, known
piece definitions, on-board placement, no overlapping pieces, JSON-friendly
piece state, exactly two players, exactly one king per player, non-adjacent
kings, and standard castling-state consistency when `state.standard` is present.

## Public But Lower Level

Some exports are useful for advanced integration, but most applications will not
need them directly:

- `Ruleset` and `RuleCheckResult` describe ruleset metadata validation.
- `standardRuleset` is the built-in standard-chess ruleset object.
- `PieceRegistry` is a small helper for definition lookup.
- `canCaptureTarget` evaluates passive capture hooks for custom rules logic.

## Internal APIs

The following engine internals are intentionally not exposed through public
barrels and should not be documented as consumer APIs: raw move application,
castling implementation helpers, pseudo-legal move generation, internal
movement board queries, and triggered-ability resolution.
