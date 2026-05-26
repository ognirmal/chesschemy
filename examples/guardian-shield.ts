import type { AbilityDefinition, Coordinate } from 'chesschemy';
import { createVariantGame, definePiece, generateLegalMoves } from 'chesschemy';

const shieldAdjacentAlly: AbilityDefinition = {
  id: 'shield-adjacent-ally',
  kind: 'passive',
  displayName: 'Shield Adjacent Ally',
  effects: [],
  canCapture: ({ source, attacker, targetPiece }) => {
    if (attacker.owner === source.owner || targetPiece.owner !== source.owner) {
      return true;
    }

    if (targetPiece.id === source.id) {
      return true;
    }

    return chebyshevDistance(source.position, targetPiece.position) > 1;
  },
};

const guardian = definePiece({
  id: 'guardian',
  displayName: 'Guardian',
  abilities: [shieldAdjacentAlly],
});

const game = createVariantGame({
  board: { files: 8, ranks: 8 },
  pieces: [
    {
      id: 'white-guardian',
      definitionId: 'guardian',
      owner: 'white',
      position: { file: 4, rank: 6 },
    },
    { id: 'white-pawn', definitionId: 'pawn', owner: 'white', position: { file: 5, rank: 6 } },
    { id: 'black-rook', definitionId: 'rook', owner: 'black', position: { file: 5, rank: 4 } },
    { id: 'white-king', definitionId: 'king', owner: 'white', position: { file: 1, rank: 1 } },
    { id: 'black-king', definitionId: 'king', owner: 'black', position: { file: 8, rank: 8 } },
  ],
  pieceDefinitions: [guardian],
  activePlayer: 'black',
  ruleset: {
    id: 'guardian-shield-demo',
    version: '1.0.0',
    displayName: 'Guardian Shield Demo',
  },
});

const rookMoves = generateLegalMoves(game).filter((move) => move.pieceId === 'black-rook');

console.log({
  canCaptureShieldedPawn: rookMoves.some((move) => move.to.file === 5 && move.to.rank === 6),
  availableRookTargets: rookMoves.map((move) => move.to),
});

function chebyshevDistance(left: Coordinate, right: Coordinate): number {
  return Math.max(Math.abs(left.file - right.file), Math.abs(left.rank - right.rank));
}
