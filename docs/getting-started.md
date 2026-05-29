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
import { Game } from 'chesschemy';

let game = Game();

console.log(game.ruleset.displayName); // "Standard Chess"
console.log(game.turn.activePlayer); // "white"
console.log(game.pieces.length); // 32
```

`Game()` returns an immutable `GameState`. Treat each move as producing a new
state.

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
import { moves, pieceAt, turn } from 'chesschemy';

const activePlayer = turn(game);
const whiteKing = pieceAt(game, 'e1');
const pawnMoves = moves(game, 'e2');

console.log(activePlayer);
console.log(whiteKing?.id);
console.log(pawnMoves);
```

Simple helpers:

- `pieceAt(state, square)`
- `moves(state, square)`
- `turn(state)`
- `result(state)`

Use [Advanced API](advanced-api.md) for full move objects, occupancy checks,
player-piece filtering, and piece-id queries.

## 5. Validate a Move Before Applying It

`validate` is useful for UI flows where you want to show an error without
throwing.

```ts
import { validate } from 'chesschemy';

const validation = validate(game, 'e2', 'e4');

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

Use `move` for normal application code. It validates the input, applies the
matched legal move, advances the turn, records history, and updates terminal
status.

```ts
import { move } from 'chesschemy';

game = move(game, 'e2', 'e4');

console.log(game.turn.activePlayer); // "black"
```

`move` also accepts one-string moves:

```ts
game = move(game, 'Nf3'); // SAN
game = move(game, 'e7e5'); // coordinate notation
```

If the move is invalid, `move` throws `ValidationError`.

```ts
import { ValidationError } from 'chesschemy';

try {
  game = move(game, 'e7', 'e4');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message);
  }
}
```

## 7. Handle Special Moves

### Promotion

Promotion requires a promotion piece.

```ts
game = move(game, 'a7', 'a8', { promotion: 'queen' });
```

Allowed standard promotion pieces:

- `queen`
- `rook`
- `bishop`
- `knight`

### Castling

Castling is submitted as a king move with `castleSide`.

```ts
game = move(game, 'e1', 'g1', { castleSide: 'kingSide' });
```

The engine handles the rook move and clears castling rights.

### En Passant

En passant is submitted like a normal pawn move to the en passant target square.

```ts
game = move(game, 'e5', 'd6');
```

If the position has a valid en passant target, the captured pawn is removed.

## 8. Check Game Status

After `move`, inspect `game.status`.

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
import { Game, move, moves, validate } from 'chesschemy';

let game = Game();

function playMove(from: string, to: string): void {
  const validation = validate(game, from, to);

  if (!validation.valid) {
    console.error(validation.reason);
    return;
  }

  game = move(game, from, to);
  console.log(game.status);
}

console.log(moves(game, 'e2'));
playMove('e2', 'e4');
```

This is enough to connect Chesschemy to a board UI:

1. Render `game.pieces`.
2. On piece selection, call `moves`.
3. On destination selection, call `validate`.
4. If valid, call `move` and replace your local state.
5. Inspect `game.status` after every move.

## 10. Save and Restore

Use `save` for engine snapshots.

```ts
import { load, save } from 'chesschemy';

const saved = save(game);
const restored = load(saved);
```

For standard chess interoperability, use FEN.

```ts
import { fen, fromFen } from 'chesschemy';

const text = fen(game);
const restoredFromFen = fromFen(text);
```

FEN is limited to active standard chess positions. Use state serialization for
custom variants.

## 11. Add Rendering or Networking

Chesschemy does not own the UI. A typical application loop is:

1. Keep the authoritative `GameState` in your app or server.
2. Render pieces from `game.pieces`.
3. Use query helpers to highlight legal destinations.
4. Submit a square move or `AbilityInput`.
5. Call `move` or `useAbility`.
6. Store and render the returned state.

Next reads:

- [Simple API](public-api.md)
- [Advanced API](advanced-api.md)
- [Custom Pieces](custom-pieces.md)
- [Abilities](abilities.md)
- [Security Notes](security.md)
