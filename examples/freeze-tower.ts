import { useAbility } from 'chesschemy/abilities';
import { createVariantGame } from 'chesschemy/core';
import { addTargetStatus } from 'chesschemy/effects';
import { definePiece } from 'chesschemy/pieces';
import { generateLegalMoves } from 'chesschemy/rules';
import { hasPieceStatus } from 'chesschemy/statuses';

const freezeTower = definePiece({
  id: 'freeze-tower',
  displayName: 'Freeze Tower',
  canMove: false,
  abilities: [
    {
      id: 'freeze',
      kind: 'active',
      displayName: 'Freeze',
      target: { range: 4, occupancy: 'enemy' },
      effects: [addTargetStatus({ id: 'frozen', duration: 1 })],
    },
  ],
});

const game = createVariantGame({
  board: { files: 8, ranks: 8 },
  pieces: [
    {
      id: 'white-freeze-tower',
      definitionId: 'freeze-tower',
      owner: 'white',
      position: { file: 3, rank: 3 },
    },
    { id: 'white-king', definitionId: 'king', owner: 'white', position: { file: 1, rank: 1 } },
    { id: 'black-rook', definitionId: 'rook', owner: 'black', position: { file: 5, rank: 5 } },
    { id: 'black-king', definitionId: 'king', owner: 'black', position: { file: 8, rank: 8 } },
  ],
  pieceDefinitions: [freezeTower],
  ruleset: {
    id: 'freeze-tower-demo',
    version: '1.0.0',
    displayName: 'Freeze Tower Demo',
  },
});

const frozenGame = useAbility(game, {
  pieceId: 'white-freeze-tower',
  abilityId: 'freeze',
  target: { file: 5, rank: 5 },
});

const rook = frozenGame.pieces.find((piece) => piece.id === 'black-rook');
const rookMoves = generateLegalMoves(frozenGame, { playerId: 'black' }).filter(
  (move) => move.pieceId === 'black-rook',
);

console.log({
  rookIsFrozen: rook === undefined ? false : hasPieceStatus(rook, 'frozen'),
  rookMoves,
  activePlayer: frozenGame.turn.activePlayer,
});
