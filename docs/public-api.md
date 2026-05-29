# Simple API

This page shows the small Chesschemy API meant for most app code. The full
engine surface is documented in [Advanced API](advanced-api.md).

## Start

```ts
import {
  Game,
  fen,
  fromFen,
  load,
  move,
  moves,
  pieceAt,
  result,
  save,
  turn,
  validate,
} from 'chesschemy';

let game = Game();

console.log(turn(game)); // "white"
console.log(moves(game, 'e2')); // ['e3', 'e4']

game = move(game, 'e4');

console.log(pieceAt(game, 'e4'));
console.log(result(game)); // "active"
```

## Game

```ts
const game = Game();
```

`Game()` creates a standard chess game. It is the concise alias for
the advanced `createGame()` helper from `chesschemy/core`.

## Move

```ts
game = move(game, 'e2', 'e4');
game = move(game, 'Nf3');
game = move(game, 'e7e5');
```

`move` accepts:

- `from` and `to` squares: `move(game, 'e2', 'e4')`
- SAN: `move(game, 'Nf3')`, `move(game, 'O-O')`, `move(game, 'a8=Q')`
- Coordinate notation: `move(game, 'e2e4')`

Promotion options are supported for square moves:

```ts
game = move(game, 'a7', 'a8', { promotion: 'queen' });
```

## Validate

```ts
const validation = validate(game, 'e2', 'e4');
const sanValidation = validate(game, 'Nf3');
```

`validate` returns `{ valid: true, move }` or `{ valid: false, reason }`.

## Moves

```ts
const destinations = moves(game, 'e2');
```

`moves` returns simple destination squares:

```ts
['e3', 'e4'];
```

Use `legalMoves` from the advanced API when you need full move objects.

## Board

```ts
const piece = pieceAt(game, 'e4');
```

`pieceAt` returns a `PieceInstance` or `undefined`.

## Turn And Result

```ts
turn(game); // "white"
result(game); // "active" | "draw" | "<player>-won"
```

## FEN

```ts
const text = fen(game);
const restored = fromFen(text);
```

Use FEN for standard chess position interchange.

## Save And Load

```ts
const snapshot = save(game);
const restored = load(snapshot);
```

Use `save` and `load` for Chesschemy game-state snapshots. For custom variants,
reattach piece definitions when loading:

```ts
const restored = load(snapshot, { pieceDefinitions });
```

## Simple Exports

- `Game`
- `move`
- `moves`
- `validate`
- `pieceAt`
- `fen`
- `fromFen`
- `save`
- `load`
- `result`
- `turn`
