import type { AbilityDefinition } from 'chesschemy/abilities';
import { createVariantGame } from 'chesschemy/core';
import { removeSource } from 'chesschemy/effects';
import type { MoveCandidate, PieceBehaviorContext } from 'chesschemy/movement';
import { BasePiece } from 'chesschemy/pieces';
import { makeMove } from 'chesschemy/rules';

const vanishAfterCapture: AbilityDefinition = {
  id: 'vanish-after-capture',
  kind: 'triggered',
  displayName: 'Vanish After Capture',
  shouldTrigger: ({ event, source }) =>
    event?.kind === 'piece:captured' && event.byPiece.id === source.id,
  effects: [removeSource()],
};

class Assassin extends BasePiece {
  public readonly id = 'assassin';
  public readonly displayName = 'Assassin';
  public override readonly abilities: readonly AbilityDefinition[] = [vanishAfterCapture];

  public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return this.step(context, 'diagonal');
  }
}

const assassin = new Assassin();

const game = createVariantGame({
  board: { files: 8, ranks: 8 },
  pieces: [
    {
      id: 'white-assassin',
      definitionId: 'assassin',
      owner: 'white',
      position: { file: 4, rank: 4 },
    },
    { id: 'white-king', definitionId: 'king', owner: 'white', position: { file: 1, rank: 1 } },
    { id: 'black-pawn', definitionId: 'pawn', owner: 'black', position: { file: 5, rank: 5 } },
    { id: 'black-king', definitionId: 'king', owner: 'black', position: { file: 8, rank: 8 } },
  ],
  pieceDefinitions: [assassin],
  ruleset: {
    id: 'vanish-assassin-demo',
    version: '1.0.0',
    displayName: 'Vanish Assassin Demo',
  },
});

const nextGame = makeMove(game, {
  pieceId: 'white-assassin',
  to: { file: 5, rank: 5 },
});

console.log({
  assassinExists: nextGame.pieces.some((piece) => piece.id === 'white-assassin'),
  blackPawnExists: nextGame.pieces.some((piece) => piece.id === 'black-pawn'),
  history: nextGame.history,
});
