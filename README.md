# Chesschemy Engine

TypeScript-first chess and chess-variant engine package.

Chesschemy provides a deterministic engine core for standard chess today, with
module boundaries for custom pieces, abilities, effects, and variant rules.

## Features

- Standard 8x8 chess initial state
- Legal move generation with check filtering
- Castling, en passant, and promotion
- Checkmate and stalemate outcome detection
- Public `validateMove` and `makeMove` APIs
- Board query helpers for UI and game-flow integration
- JSON-friendly state serialization baseline
- Strict TypeScript types and generated declarations

## Install

```sh
npm install chesschemy
```

For local development in this repository:

```sh
npm install
```

## Quick Start

```ts
import { createGame, getLegalMovesForPiece, makeMove } from 'chesschemy';

let game = createGame();

console.log(game.turn.activePlayer); // "white"
console.log(getLegalMovesForPiece(game, 'white-pawn-5'));

game = makeMove(game, {
  pieceId: 'white-pawn-5',
  to: { file: 5, rank: 4 },
});

console.log(game.turn.activePlayer); // "black"
```

Coordinates are one-based:

- `file: 1` is the `a` file.
- `file: 8` is the `h` file.
- `rank: 1` is White's home rank.
- `rank: 8` is Black's home rank.

## Core APIs

### Create a Game

```ts
import { createGame } from 'chesschemy';

const game = createGame();
```

### Query the Board

```ts
import { getPieceAt, getActivePlayerPieces, getLegalMovesForPiece } from 'chesschemy';

const king = getPieceAt(game, { file: 5, rank: 1 });
const activePieces = getActivePlayerPieces(game);
const pawnMoves = getLegalMovesForPiece(game, 'white-pawn-5');
```

### Validate and Apply Moves

```ts
import { makeMove, validateMove } from 'chesschemy';

const input = {
  pieceId: 'white-pawn-5',
  to: { file: 5, rank: 4 },
};

const validation = validateMove(game, input);

if (validation.valid) {
  const nextGame = makeMove(game, input);
  console.log(nextGame.status);
} else {
  console.error(validation.reason);
}
```

### Promotion

Promotion requires an explicit `promotionDefinitionId`.

```ts
game = makeMove(game, {
  pieceId: 'white-pawn-1',
  to: { file: 1, rank: 8 },
  promotionDefinitionId: 'queen',
});
```

Allowed standard promotion pieces are `queen`, `rook`, `bishop`, and `knight`.

### Castling

Castling is represented as a king move with a `castleSide`.

```ts
game = makeMove(game, {
  pieceId: 'white-king-5',
  to: { file: 7, rank: 1 },
  castleSide: 'kingSide',
});
```

The engine validates castling rights, empty path squares, check, transit-square
attacks, and rook relocation.

## Guides

- [Getting Started: Build a Basic Game](docs/getting-started-basic-game.md)
- [Architecture](docs/architecture.md)
- [Release Guide](docs/release.md)

## Development

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run format
```

## Current Status

The standard chess base is ready for development use. Future work will focus on
FEN support, richer draw rules, documentation examples, and the custom
piece/ability APIs described in the PRD.
