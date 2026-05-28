<div align="center">

# Chesschemy Engine

**A TypeScript-first rules engine for standard chess and programmable chess variants.**

[![npm version](https://img.shields.io/npm/v/chesschemy.svg?style=for-the-badge&color=cb3837)](https://www.npmjs.com/package/chesschemy)
[![npm downloads](https://img.shields.io/npm/dm/chesschemy.svg?style=for-the-badge&color=0ea5e9)](https://www.npmjs.com/package/chesschemy)
[![GitHub stars](https://img.shields.io/github/stars/ognirmal/chesschemy?style=for-the-badge&logo=github&color=facc15)](https://github.com/ognirmal/chesschemy/stargazers)
[![types](https://img.shields.io/npm/types/chesschemy.svg?style=for-the-badge&color=3178c6)](https://www.npmjs.com/package/chesschemy)
[![CI](https://img.shields.io/github/actions/workflow/status/ognirmal/chesschemy/ci.yml?branch=main&label=CI&style=for-the-badge)](https://github.com/ognirmal/chesschemy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a.svg?style=for-the-badge)](LICENSE)

Build chess-like games with legal move generation, check filtering, custom
pieces, active abilities, triggered effects, statuses, FEN support, and
JSON-friendly serialization.

**Star the repo if Chesschemy helps you. Open issues, ideas, examples, docs, and
focused pull requests are welcome. This project is open for collaboration.**

[npm package](https://www.npmjs.com/package/chesschemy) ·
[guides](#guides) ·
[quick start](#quick-start) ·
[collaboration](docs/collaboration.md)

</div>

Chesschemy provides a deterministic engine core for standard chess today, with
module boundaries for custom pieces, abilities, effects, and variant rules.
The current rules engine is intentionally two-player and king-based: validated
games must have exactly two players and exactly one `king` piece for each
player.

Use Chesschemy when you want rules, state transitions, validation, and
serialization for a chess-like game. Bring your own renderer, network transport,
database, matchmaking, auth, clocks, and UI.

## Features

- Standard 8x8 chess initial state
- Legal move generation with check filtering
- Castling, en passant, and promotion
- Checkmate, stalemate, and insufficient-material outcome detection
- Public `validateMove` and `makeMove` APIs
- Public `validateAbility` and `useAbility` APIs
- Passive capture-rule hooks for shield and protection mechanics
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

## Package

- Runtime: Node.js 20 or newer
- Module formats: ESM and CommonJS
- Types: generated TypeScript declarations included
- Tree-shaking: package is marked side-effect free

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
import { createVariantGame } from 'chesschemy';
import type { MoveCandidate, PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';

class Wizard extends BasePiece {
  public readonly id = 'wizard';
  public readonly displayName = 'Wizard';

  public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return this.step(context, 'diagonal');
  }
}

const wizard = new Wizard();

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
import { getLegalMovesForPiece } from 'chesschemy/rules';
import { getActivePlayerPieces, getPieceAt } from 'chesschemy/queries';

const king = getPieceAt(game, { file: 5, rank: 1 });
const activePieces = getActivePlayerPieces(game);
const pawnMoves = getLegalMovesForPiece(game, 'white-pawn-5');
```

### Validate and Apply Moves

```ts
import { makeMove, validateMove } from 'chesschemy/rules';

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
      target: { range: 2, occupancy: 'empty' },
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

Active and triggered abilities use chess legality by default: after their
effects resolve, the source player's king must not be left in check. Set
`allowsSelfCheck: true` on an ability only for variants that intentionally allow
non-chess self-check behavior.

### Statuses and Cooldowns

```ts
import { addTargetStatus, setSourceAbilityCooldown } from 'chesschemy/effects';
import { hasAbilityCooldown } from 'chesschemy/statuses';

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

`PieceInstance.state` is JSON runtime state owned by a piece. Status entries live
under `state.statuses`; `PieceStatus.data` is optional JSON metadata for a
specific status.

Kings are immune to built-in effects and statuses. Built-in effect helpers such
as `removeTargetPiece`, `teleportSourceToTarget`, `updateTargetPieceState`, and
`addTargetStatus` leave kings unchanged, and serialized game states with king
statuses are rejected by validation.

### Serialization

```ts
import {
  deserializeFen,
  deserializeGameState,
  serializeFen,
  serializeGameState,
} from 'chesschemy/serialization';

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

- [Getting Started: Build a Basic Game](docs/getting-started.md)
- [Public API Guide](docs/public-api.md)
- [Custom Pieces](docs/custom-pieces.md)
- [Abilities](docs/abilities.md)
- [Passive Abilities](docs/passive-abilities.md)
- [Architecture](docs/architecture.md)
- [Security Notes](docs/security.md)
- [Collaboration Guide](docs/collaboration.md)
- [Release Guide](docs/release.md)
- [Changelog](CHANGELOG.md)

## Development

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run format
```

For contribution workflow, API compatibility expectations, and documentation
standards, see [Collaboration Guide](docs/collaboration.md).

## Current Status

The standard chess base is ready for development use. Custom pieces and active
ability execution are available as extension APIs within the current two-player,
king-based rules boundary, and triggered abilities can react to deterministic
engine events. Statuses and cooldowns are available for temporary effects.
Standard FEN import/export is available for normal chess positions. Passive
capture-rule hooks are available for shield-style mechanics. Future work will
focus on richer draw rules, broader examples, and deeper passive ability
handling.
