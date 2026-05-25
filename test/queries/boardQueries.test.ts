import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import {
  createGame,
  getActivePlayerPieces,
  getLegalDestinationsForPiece,
  getLegalMovesForPiece,
  getLegalMovesForSquare,
  getPieceAt,
  getPieceById,
  getPiecesForPlayer,
  isOccupied,
  isOccupiedByOpponent,
  isOccupiedByPlayer,
} from '../../src/index.js';

describe('board query API', () => {
  it('finds pieces by coordinate and id', () => {
    const state = createGame();

    expect(getPieceAt(state, { file: 5, rank: 1 })?.id).toBe('white-king-5');
    expect(getPieceById(state, 'black-queen-4')?.position).toEqual({ file: 4, rank: 8 });
    expect(getPieceAt(state, { file: 9, rank: 9 })).toBeUndefined();
    expect(getPieceById(state, 'missing')).toBeUndefined();
  });

  it('filters pieces by active player and explicit player', () => {
    const state = createGame();

    expect(getActivePlayerPieces(state)).toHaveLength(16);
    expect(getActivePlayerPieces(state).every((piece) => piece.owner === 'white')).toBe(true);
    expect(getPiecesForPlayer(state, 'black')).toHaveLength(16);
  });

  it('reports occupancy by player and opponent', () => {
    const state = createGame();

    expect(isOccupied(state, { file: 1, rank: 1 })).toBe(true);
    expect(isOccupied(state, { file: 4, rank: 4 })).toBe(false);
    expect(isOccupiedByPlayer(state, { file: 1, rank: 1 }, 'white')).toBe(true);
    expect(isOccupiedByPlayer(state, { file: 1, rank: 1 }, 'black')).toBe(false);
    expect(isOccupiedByOpponent(state, { file: 1, rank: 7 })).toBe(true);
    expect(isOccupiedByOpponent(state, { file: 1, rank: 2 })).toBe(false);
  });

  it('gets legal moves and destinations for a piece', () => {
    const state = createGame();

    expect(moveTargets(getLegalMovesForPiece(state, 'white-pawn-5'))).toEqual(['5,3', '5,4']);
    expect(getLegalDestinationsForPiece(state, 'white-knight-2')).toEqual([
      { file: 3, rank: 3 },
      { file: 1, rank: 3 },
    ]);
    expect(getLegalMovesForPiece(state, 'black-pawn-5')).toEqual([]);
    expect(getLegalMovesForPiece(state, 'missing')).toEqual([]);
  });

  it('gets legal moves from a board square', () => {
    const state = gameState([
      piece('white-rook', 'rook', 'white', { file: 4, rank: 4 }),
      piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);

    expect(getLegalMovesForSquare(state, { file: 4, rank: 4 })).toHaveLength(14);
    expect(getLegalMovesForSquare(state, { file: 2, rank: 2 })).toEqual([]);
  });
});

function gameState(pieces: readonly PieceInstance[], activePlayer: PlayerId = 'white'): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    turn: {
      activePlayer,
      fullMove: 1,
      halfMoveClock: 0,
    },
    ruleset: {
      id: 'standard-chess',
      version: '0.1.0',
      displayName: 'Standard Chess',
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

function moveTargets(moves: readonly { readonly to: Coordinate }[]): string[] {
  return moves.map((move) => `${String(move.to.file)},${String(move.to.rank)}`).sort();
}
