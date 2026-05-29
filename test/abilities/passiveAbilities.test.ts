import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import type { AbilityDefinition } from '../../src/abilities/index.js';
import { definePiece } from '../../src/pieces/index.js';
import { generateLegalMoves, isKingInCheck, makeMove } from '../../src/rules/index.js';

describe('passive abilities', () => {
  it('can prevent captures through passive capture rules', () => {
    const guardian = defineGuardian();
    const state = gameState(
      [
        piece('white-guardian', 'guardian', 'white', { file: 4, rank: 6 }),
        piece('white-pawn', 'pawn', 'white', { file: 5, rank: 6 }),
        piece('black-rook', 'rook', 'black', { file: 5, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [guardian],
      'black',
    );

    const rookMoves = generateLegalMoves(state).filter((move) => move.pieceId === 'black-rook');

    expect(rookMoves.some((move) => coordinateKey(move.to) === '5,6')).toBe(false);
    expect(rookMoves.some((move) => coordinateKey(move.to) === '5,5')).toBe(true);
  });

  it('allows captures outside passive protection', () => {
    const guardian = defineGuardian();
    const state = gameState(
      [
        piece('white-guardian', 'guardian', 'white', { file: 1, rank: 6 }),
        piece('white-pawn', 'pawn', 'white', { file: 5, rank: 6 }),
        piece('black-rook', 'rook', 'black', { file: 5, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [guardian],
      'black',
    );

    const nextState = makeMove(state, {
      pieceId: 'black-rook',
      to: { file: 5, rank: 6 },
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-pawn')).toBeUndefined();
    expect(nextState.pieces.find((candidate) => candidate.id === 'black-rook')?.position).toEqual({
      file: 5,
      rank: 6,
    });
  });

  it('uses passive capture rules during check detection', () => {
    const guardian = defineGuardian();
    const shieldedState = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-guardian', 'guardian', 'white', { file: 2, rank: 1 }),
        piece('black-rook', 'rook', 'black', { file: 1, rank: 8 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [guardian],
      'black',
    );
    const exposedState = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-guardian', 'guardian', 'white', { file: 3, rank: 3 }),
        piece('black-rook', 'rook', 'black', { file: 1, rank: 8 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [guardian],
      'black',
    );

    expect(isKingInCheck(shieldedState, 'white')).toBe(false);
    expect(isKingInCheck(exposedState, 'white')).toBe(true);
  });
});

function defineGuardian() {
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

  return definePiece({
    id: 'guardian',
    displayName: 'Guardian',
    abilities: [shieldAdjacentAlly],
  });
}

function chebyshevDistance(left: Coordinate, right: Coordinate): number {
  return Math.max(Math.abs(left.file - right.file), Math.abs(left.rank - right.rank));
}

function gameState(
  pieces: readonly PieceInstance[],
  pieceDefinitions: GameState['pieceDefinitions'] = [],
  activePlayer: PlayerId = 'white',
): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    pieceDefinitions,
    turn: {
      activePlayer,
      fullMove: 1,
      halfMoveClock: 0,
    },
    ruleset: {
      id: 'passive-test',
      version: '0.4.0',
      displayName: 'Passive Test',
    },
    standard: {
      castlingRights: {
        black: { kingSide: false, queenSide: false },
        white: { kingSide: false, queenSide: false },
      },
    },
    history: [],
    status: { kind: 'active' },
  };
}

function piece(
  id: string,
  definitionId: string,
  owner: PlayerId,
  position: Coordinate,
): PieceInstance {
  return {
    id,
    definitionId,
    owner,
    position,
  };
}

function coordinateKey(coordinate: Coordinate): string {
  return `${String(coordinate.file)},${String(coordinate.rank)}`;
}
