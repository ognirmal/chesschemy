<div align="center">

# Chesschemy

**A TypeScript chess engine for standard chess and programmable variants.**

[![npm version](https://img.shields.io/npm/v/chesschemy.svg?style=for-the-badge&color=cb3837)](https://www.npmjs.com/package/chesschemy)
[![npm downloads](https://img.shields.io/npm/dm/chesschemy.svg?style=for-the-badge&color=0ea5e9)](https://www.npmjs.com/package/chesschemy)
[![types](https://img.shields.io/npm/types/chesschemy.svg?style=for-the-badge&color=3178c6)](https://www.npmjs.com/package/chesschemy)
[![CI](https://img.shields.io/github/actions/workflow/status/ognirmal/chesschemy/ci.yml?branch=main&label=CI&style=for-the-badge)](https://github.com/ognirmal/chesschemy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a.svg?style=for-the-badge)](LICENSE)

[Install](#install) · [Quick Start](#quick-start) · [Guides](#guides) · [API](docs/public-api.md)

</div>

Chesschemy gives you deterministic rules, legal move generation, check
filtering, state transitions, validation, FEN helpers, and JSON-friendly
serialization. It does not include a renderer, server, database, auth,
matchmaking, clocks, or UI.

Use it when you want to build a chess-like game and keep your application code
focused on presentation and product behavior.

## Install

```sh
npm install chesschemy
```

Package basics:

- Node.js 20 or newer
- ESM and CommonJS builds
- TypeScript declarations included
- Side-effect free package for tree-shaking

## Quick Start

```ts
import { Game, move, moves, turn } from 'chesschemy';

let game = Game();

console.log(turn(game)); // "white"
console.log(moves(game, 'e2')); // ['e3', 'e4']

game = move(game, 'e2', 'e4');

console.log(turn(game)); // "black"
```

You can also pass one move string:

```ts
game = move(game, 'Nf3'); // SAN
game = move(game, 'e7e5'); // coordinate notation
```

Most board APIs accept algebraic squares such as `'e4'` and numeric coordinates
such as `{ file: 5, rank: 4 }`.

## What It Supports

- Standard 8x8 chess initial state
- Legal move generation with check filtering
- Castling, en passant, and promotion
- Checkmate, stalemate, and insufficient-material detection
- Custom pieces and movement patterns
- Active, passive, and triggered abilities
- Statuses, cooldowns, and built-in effect helpers
- Board query helpers for UI integration
- Standard chess FEN import/export
- JSON-friendly game-state serialization

The current rules engine is intentionally two-player and king-based: validated
games must have exactly two players and exactly one `king` piece for each
player.

## Custom Variants

Custom variants are built with piece definitions, movement patterns, abilities,
effects, and an explicit initial position.

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

console.log(game.ruleset.displayName);
```

## Import Paths

Most application code can import from the package root:

```ts
import {
  Game,
  fen,
  fromFen,
  isCheck,
  load,
  move,
  moves,
  pieceAt,
  result,
  save,
  turn,
  validate,
} from 'chesschemy';
```

```ts
const text = fen(game);
const fromText = fromFen(text);

const snapshot = save(game);
const restored = load(snapshot);
```

Focused subpaths are available for variant-building APIs:

```ts
import { useAbility } from 'chesschemy/abilities';
import { teleportSourceToTarget } from 'chesschemy/effects';
import { stepper } from 'chesschemy/movement';
```

Do not import from `src/*` or `dist/*`; those paths are not public API.

## Guides

- [Getting Started](docs/getting-started.md)
- [Simple API](docs/public-api.md)
- [Advanced API](docs/advanced-api.md)
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
```

Run `npm run prepublishOnly` before publishing.
