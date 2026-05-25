import { createGame, getLegalMovesForPiece, makeMove, validateMove } from '../src/index.js';

let game = createGame();

console.log({
  activePlayer: game.turn.activePlayer,
  pieceCount: game.pieces.length,
  ruleset: game.ruleset.displayName,
});

const input = {
  pieceId: 'white-pawn-5',
  to: { file: 5, rank: 4 },
};

console.log({
  legalMoves: getLegalMovesForPiece(game, input.pieceId),
});

const validation = validateMove(game, input);

if (!validation.valid) {
  throw new Error(validation.reason);
}

game = makeMove(game, input);

console.log({
  activePlayer: game.turn.activePlayer,
  status: game.status,
});
