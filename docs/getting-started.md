# Getting Started: Build a Basic Game

This guide shows how to create a minimal standard chess game loop with
Chesschemy. It does not include rendering, networking, persistence, or player
accounts. The engine owns game state and rules; your application owns the UI.

## 1. Install the Package

```sh
npm install chesschemy
```

When working inside this repository, install local dependencies instead:

```sh
npm install
```

## 2. Create the Initial Game

```ts
import { createGame } from 'chesschemy';

let game = createGame();

console.log(game.ruleset.displayName); // "Standard Chess"
console.log(game.turn.activePlayer); // "white"
console.log(game.pieces.length); // 32
```

`createGame()` returns an immutable `GameState`. Treat each move as producing a
new state.

## 3. Understand Coordinates

Chesschemy uses numeric, one-based coordinates:

```ts
type Coordinate = {
  file: number;
  rank: number;
};
```

Standard-board examples:

- White king starts at `{ file: 5, rank: 1 }`.
- Black king starts at `{ file: 5, rank: 8 }`.
- White's `e2` pawn starts at `{ file: 5, rank: 2 }`.
- Moving that pawn to `e4` means `{ file: 5, rank: 4 }`.

## 4. Read Board State

Use query helpers instead of scanning arrays in application code.

```ts
import {
  getActivePlayerPieces,
  getLegalMovesForPiece,
  getPieceAt,
  isOccupiedByOpponent,
} from 'chesschemy';

const activePieces = getActivePlayerPieces(game);
const whiteKing = getPieceAt(game, { file: 5, rank: 1 });
const pawnMoves = getLegalMovesForPiece(game, 'white-pawn-5');
const hasOpponent = isOccupiedByOpponent(game, { file: 5, rank: 7 });

console.log(activePieces.length);
console.log(whiteKing?.id);
console.log(pawnMoves);
console.log(hasOpponent);
```

Useful query helpers:

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

## 5. Validate a Move Before Applying It

`validateMove` is useful for UI flows where you want to show an error without
throwing.

```ts
import { validateMove } from 'chesschemy';

const input = {
  pieceId: 'white-pawn-5',
  to: { file: 5, rank: 4 },
};

const validation = validateMove(game, input);

if (!validation.valid) {
  console.error(validation.reason);
}
```

Validation checks:

- the game is still active
- the piece exists
- the piece belongs to the active player
- the requested move matches a legal move
- promotion input is not ambiguous

## 6. Apply a Move

Use `makeMove` for normal application code. It validates the input, applies the
matched legal move, advances the turn, records history, and updates terminal
status.

```ts
import { makeMove } from 'chesschemy';

game = makeMove(game, {
  pieceId: 'white-pawn-5',
  to: { file: 5, rank: 4 },
});

console.log(game.turn.activePlayer); // "black"
```

If the move is invalid, `makeMove` throws `ValidationError`.

```ts
import { ValidationError } from 'chesschemy';

try {
  game = makeMove(game, {
    pieceId: 'black-pawn-5',
    to: { file: 5, rank: 5 },
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message);
  }
}
```

## 7. Handle Special Moves

### Promotion

Promotion requires `promotionDefinitionId`.

```ts
game = makeMove(game, {
  pieceId: 'white-pawn-1',
  to: { file: 1, rank: 8 },
  promotionDefinitionId: 'queen',
});
```

Allowed standard promotion pieces:

- `queen`
- `rook`
- `bishop`
- `knight`

### Castling

Castling is submitted as a king move with `castleSide`.

```ts
game = makeMove(game, {
  pieceId: 'white-king-5',
  to: { file: 7, rank: 1 },
  castleSide: 'kingSide',
});
```

The engine handles the rook move and clears castling rights.

### En Passant

En passant is submitted like a normal pawn move to the en passant target square.

```ts
game = makeMove(game, {
  pieceId: 'white-pawn-5',
  to: { file: 4, rank: 6 },
});
```

If the position has a valid en passant target, the captured pawn is removed.

## 8. Check Game Status

After `makeMove`, inspect `game.status`.

```ts
switch (game.status.kind) {
  case 'active':
    console.log(`${game.turn.activePlayer} to move`);
    break;
  case 'won':
    console.log(`${game.status.winner} won by ${game.status.reason}`);
    break;
  case 'draw':
    console.log(`Draw by ${game.status.reason}`);
    break;
}
```

Current automatic terminal statuses:

- checkmate: `{ kind: 'won', winner, reason: 'checkmate' }`
- stalemate: `{ kind: 'draw', reason: 'stalemate' }`
- insufficient material: `{ kind: 'draw', reason: 'insufficient-material' }`

## 9. Minimal Game Loop

```ts
import { createGame, getLegalMovesForPiece, makeMove, validateMove } from 'chesschemy';

let game = createGame();

function playMove(pieceId: string, to: { file: number; rank: number }): void {
  const input = { pieceId, to };
  const validation = validateMove(game, input);

  if (!validation.valid) {
    console.error(validation.reason);
    return;
  }

  game = makeMove(game, input);
  console.log(game.status);
}

console.log(getLegalMovesForPiece(game, 'white-pawn-5'));
playMove('white-pawn-5', { file: 5, rank: 4 });
playMove('black-pawn-5', { file: 5, rank: 5 });
```

This is enough to connect Chesschemy to a board UI:

1. Render `game.pieces`.
2. On piece selection, call `getLegalMovesForPiece`.
3. On destination selection, call `validateMove`.
4. If valid, call `makeMove` and replace your local state.
5. Inspect `game.status` after every move.

## 10. Save and Restore

Use `serializeGameState` for engine snapshots.

```ts
import { deserializeGameState, serializeGameState } from 'chesschemy';

const saved = serializeGameState(game);
const restored = deserializeGameState(saved);
```

For standard chess interoperability, use FEN.

```ts
import { deserializeFen, serializeFen } from 'chesschemy';

const fen = serializeFen(game);
const restoredFromFen = deserializeFen(fen);
```

FEN is limited to active standard chess positions. Use state serialization for
custom variants.

## 11. Add Rendering or Networking

Chesschemy does not own the UI. A typical application loop is:

1. Keep the authoritative `GameState` in your app or server.
2. Render pieces from `game.pieces`.
3. Use query helpers to highlight legal destinations.
4. Submit a `MoveInput` or `AbilityInput`.
5. Call `makeMove` or `useAbility`.
6. Store and render the returned state.

Next reads:

- [Public API Guide](public-api.md)
- [Custom Pieces](custom-pieces.md)
- [Abilities](abilities.md)
- [Security Notes](security.md)
