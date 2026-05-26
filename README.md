# Chesschemy Engine

TypeScript-first chess and chess-variant engine package.

Chesschemy provides a deterministic engine core for standard chess today, with
module boundaries for custom pieces, abilities, effects, and variant rules.

## Features

- Standard 8x8 chess initial state
- Legal move generation with check filtering
- Castling, en passant, and promotion
- Checkmate, stalemate, and insufficient-material outcome detection
- Public `validateMove` and `makeMove` APIs
- Public `validateAbility` and `useAbility` APIs
- Triggered ability resolution from deterministic engine events
- Generic effect helpers for teleporting, removing pieces, and updating piece state
- JSON-friendly piece statuses with finite duration ticking and cooldown helpers
- Board query helpers for UI and game-flow integration
- JSON-friendly state serialization baseline
- Standard chess FEN import/export
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

### Create a Custom Variant

```ts
import { createVariantGame, definePiece, stepper } from 'chesschemy';

const wizard = definePiece({
  id: 'wizard',
  displayName: 'Wizard',
  movements: [stepper({ directions: 'diagonal' })],
});

const game = createVariantGame({
  board: { files: 8, ranks: 8 },
  pieces: [
    {
      id: 'white-wizard',
      definitionId: 'wizard',
      owner: 'white',
      position: { file: 4, rank: 1 },
    },
    {
      id: 'white-king',
      definitionId: 'king',
      owner: 'white',
      position: { file: 5, rank: 1 },
    },
    {
      id: 'black-king',
      definitionId: 'king',
      owner: 'black',
      position: { file: 5, rank: 8 },
    },
  ],
  pieceDefinitions: [wizard],
  ruleset: {
    id: 'wizard-chess',
    version: '1.0.0',
    displayName: 'Wizard Chess',
  },
});
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

### Use Active Abilities

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
      target: { range: 2, occupancy: 'empty' },
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

### Statuses and Cooldowns

```ts
import { addTargetStatus, hasAbilityCooldown, setSourceAbilityCooldown } from 'chesschemy';

const freeze = {
  id: 'freeze',
  kind: 'active',
  displayName: 'Freeze',
  target: { range: 3, occupancy: 'enemy' },
  effects: [addTargetStatus({ id: 'frozen', duration: 1 })],
};

const blink = {
  id: 'blink',
  kind: 'active',
  displayName: 'Blink',
  canActivate: ({ source }) => !hasAbilityCooldown(source, 'blink'),
  effects: [setSourceAbilityCooldown('blink', 2)],
};
```

Pieces with a `frozen` status do not generate legal moves. Finite statuses tick
down when their owner's turn ends and are removed when their duration reaches
zero.

### Serialization

```ts
import { deserializeGameState, deserializeFen, serializeFen, serializeGameState } from 'chesschemy';

const serialized = serializeGameState(game);
const restored = deserializeGameState(serialized, {
  pieceDefinitions: [wizard],
});

const fen = serializeFen(createGame());
const fromFen = deserializeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
```

Serialized game state is JSON-friendly runtime data. Custom piece definitions,
abilities, effects, classes, and callbacks are intentionally not included in the
serialized payload; pass them back through `deserializeGameState` when restoring
custom games. FEN support is intended for standard chess positions.

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
- [Custom Pieces And Abilities](docs/custom-pieces-and-abilities.md)
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

The standard chess base is ready for development use. Custom pieces and active
ability execution are available as extension APIs, and triggered abilities can
react to deterministic engine events. Statuses and cooldowns are available for
temporary effects. Standard FEN import/export is available for normal chess
positions. Future work will focus on richer draw rules, broader examples, and
deeper passive ability handling.
