# Advanced API

This page documents the full public engine surface. For common app code, start
with [Simple API](public-api.md).

Chesschemy exposes the package root and domain subpaths through `package.json`.
Import from these entry points:

```ts
import { Game, move } from 'chesschemy';
import { useAbility } from 'chesschemy/abilities';
import { stepper } from 'chesschemy/movement';
```

Do not import from `dist/*` or `src/*` in application code. Those paths are not
part of the compatibility contract.

## Root Export

The package root exposes the simple API plus a few common extension helpers:

```ts
import {
  Game,
  createVariantGame,
  definePiece,
  move,
  moves,
  fen,
  fromFen,
  save,
  load,
  useAbility,
} from 'chesschemy';
```

Use subpaths for the full engine APIs and verbose compatibility names.

## Core

Subpath: `chesschemy/core`

Primary values:

- `Game(options?)`: concise alias for creating and validating a standard game.
- `createGame(options?)`: create and validate a standard game or validate a
  supplied initial state.
- `createVariantGame(options)`: create and validate a custom two-player,
  king-based variant state.
- `ValidationError`: thrown by fail-fast APIs when input is invalid.
- Coordinate helpers: `coordinateKey`, `isCoordinateInsideBoard`,
  `sameCoordinate`.
- Square helpers: `parseSquare`, `formatSquare`, `toCoordinate`.
- State types: `GameState`, `PieceInstance`, `Coordinate`, `BoardDimensions`,
  `TurnState`, `GameStatus`, `MoveAction`, `AbilityAction`, `PseudoLegalMove`,
  `StandardChessState`, `AlgebraicSquare`, `SquareInput`, and related aliases.

```ts
import { Game, formatSquare, isCoordinateInsideBoard, parseSquare } from 'chesschemy/core';

const game = Game();
const onBoard = isCoordinateInsideBoard({ file: 5, rank: 4 }, game.board);
const e4 = parseSquare('e4');
const square = formatSquare(e4);
```

Coordinates are one-based. Standard `e4` is `{ file: 5, rank: 4 }`. Most board
APIs accept either algebraic squares such as `'e4'` or numeric coordinates.

## Rules

Subpath: `chesschemy/rules`

Move APIs:

- `generateLegalMoves(state, options?)`: all legal moves for a player.
- `validateMove(state, input)`: returns a discriminated validation result.
- `makeMove(state, input)`: validates, applies, resolves triggered abilities,
  updates status, and returns the next state.
- `validateMoveFromSquare(state, input)`: validate a move by `from` and `to`
  squares without looking up piece IDs in application code.
- `makeMoveFromSquare(state, input)`: apply a validated square-based move.
- `validate(state, from, to, options?)`: concise square-based validation.
- `move(state, from, to, options?)`: concise square-based move application.
- `validate(state, sanOrCoordinateMove)`: validate SAN such as `Nf3` or
  coordinate notation such as `e2e4`.
- `move(state, sanOrCoordinateMove)`: apply a one-string move.
- `formatSan(state, move)`: format a legal move as SAN.
- `moveSan(state, san)`: resolve SAN to the matching legal move.

Check and outcome APIs:

- `isKingInCheck(state, playerId)`
- `isCheck(state, playerId?)`
- `isSquareAttacked(state, square, byPlayer)`
- `isCheckmate(state, playerId?)`
- `isStalemate(state, playerId?)`
- `isInsufficientMaterial(state)`
- `getGameOutcome(state)`
- `standardRuleset`

```ts
import { makeMove, move, validateMove } from 'chesschemy/rules';

const input = { pieceId: 'white-pawn-5', to: { file: 5, rank: 4 } };
const result = validateMove(game, input);

const nextGame = result.valid ? makeMove(game, input) : game;
const nextGameBySquare = move(game, 'e2', 'e4');
const nextGameBySan = move(game, 'Nf3');
```

`makeMove` throws `ValidationError` when the input does not match exactly one
legal move. `move` follows the same validation rules after resolving the piece
on the `from` square.

## Queries

Subpath: `chesschemy/queries`

Use query helpers for UI selection, move highlighting, and board inspection:

- `getPieceAt(state, square)`
- `pieceAt(state, square)`
- `getPieceById(state, pieceId)`
- `getPiecesForPlayer(state, playerId)`
- `getActivePlayerPieces(state)`
- `isOccupied(state, square)`
- `isOccupiedByPlayer(state, square, playerId)`
- `isOccupiedByOpponent(state, square, playerId?)`
- `getLegalMovesForPiece(state, pieceId)`
- `getLegalMovesForSquare(state, square)`
- `legalMoves(state, square)`
- `moves(state, square)`
- `getLegalDestinationsForPiece(state, pieceId)`

```ts
import { moves, pieceAt } from 'chesschemy/queries';

const selected = pieceAt(game, 'e2');
const destinations = moves(game, 'e2');
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

- `save(state)`
- `load(serialized, options?)`
- `serializeGameState(state)`
- `deserializeGameState(serialized, options?)`
- `SERIALIZATION_VERSION`
- Types: `SerializedGameState`, `SerializableGameState`,
  `DeserializeGameStateOptions`.

FEN APIs:

- `STARTING_FEN`
- `fen(state)`
- `fromFen(fen)`
- `serializeFen(state)`
- `deserializeFen(fen)`

Use `save` for custom variants. The payload intentionally omits piece
definitions, ability callbacks, and effect functions; pass definitions to `load`
when restoring. Use `fen` for standard chess positions.

## Presets

Subpath: `chesschemy/presets`

- `standardPreset`: creates the standard 8x8 starting state.
- Type: `GamePreset`

Most applications should call `Game()` instead of using the preset directly.

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
