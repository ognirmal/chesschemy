import { Game, move, moves, validate } from 'chesschemy';

let game = Game();

console.log({
  activePlayer: game.turn.activePlayer,
  pieceCount: game.pieces.length,
  ruleset: game.ruleset.displayName,
});

console.log({
  moves: moves(game, 'e2'),
});

const validation = validate(game, 'e2', 'e4');

if (!validation.valid) {
  throw new Error(validation.reason);
}

game = move(game, 'e2', 'e4');

console.log({
  activePlayer: game.turn.activePlayer,
  status: game.status,
});
