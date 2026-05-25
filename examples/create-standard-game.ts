import { createGame } from '../src/index.js';

const game = createGame();

console.log({
  activePlayer: game.turn.activePlayer,
  pieceCount: game.pieces.length,
  ruleset: game.ruleset.displayName,
});
