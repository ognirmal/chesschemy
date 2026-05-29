import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../../src/index.js';
import { generateLegalMoves } from '../../src/rules/index.js';
import { applyMove } from '../../src/rules/applyMove.js';

describe('castling', () => {
  it('generates king-side and queen-side castling when rights, path, and attacks allow it', () => {
    const state = gameState([
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-rook-a', 'rook', 'white', { file: 1, rank: 1 }),
      piece('white-rook-h', 'rook', 'white', { file: 8, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);

    const castlingMoves = generateLegalMoves(state).filter((move) => move.castleSide !== undefined);

    expect(
      castlingMoves.map((move) => `${String(move.castleSide)}:${coordinateKey(move.to)}`).sort(),
    ).toEqual(['kingSide:7,1', 'queenSide:3,1']);
  });

  it('moves the rook and clears castling rights when castling is applied', () => {
    const state = gameState([
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-rook-h', 'rook', 'white', { file: 8, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);
    const castlingMove = generateLegalMoves(state).find((move) => move.castleSide === 'kingSide');

    expect(castlingMove).toBeDefined();
    if (castlingMove === undefined) {
      throw new Error('Expected king-side castling move to be generated.');
    }

    const nextState = applyMove(state, castlingMove);

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-king')?.position).toEqual({
      file: 7,
      rank: 1,
    });
    expect(nextState.pieces.find((candidate) => candidate.id === 'white-rook-h')?.position).toEqual(
      {
        file: 6,
        rank: 1,
      },
    );
    expect(nextState.standard?.castlingRights.white).toEqual({
      kingSide: false,
      queenSide: false,
    });
    expect(nextState.history.at(-1)).toEqual({
      kind: 'move',
      pieceId: 'white-king',
      to: { file: 7, rank: 1 },
      castleSide: 'kingSide',
    });
  });

  it('does not generate castling through occupied squares', () => {
    const state = gameState([
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-rook-h', 'rook', 'white', { file: 8, rank: 1 }),
      piece('white-bishop', 'bishop', 'white', { file: 6, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);

    expect(generateLegalMoves(state).some((move) => move.castleSide === 'kingSide')).toBe(false);
  });

  it('does not generate castling out of, through, or into check', () => {
    const state = gameState([
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-rook-h', 'rook', 'white', { file: 8, rank: 1 }),
      piece('black-rook', 'rook', 'black', { file: 6, rank: 8 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);

    expect(generateLegalMoves(state).some((move) => move.castleSide === 'kingSide')).toBe(false);
  });

  it('clears castling rights when a king or starting rook moves', () => {
    const kingState = gameState([
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-rook-h', 'rook', 'white', { file: 8, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);
    const afterKingMove = applyMove(
      kingState,
      move('white-king', { file: 5, rank: 1 }, { file: 5, rank: 2 }),
    );

    expect(afterKingMove.standard?.castlingRights.white).toEqual({
      kingSide: false,
      queenSide: false,
    });

    const rookState = gameState([
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-rook-a', 'rook', 'white', { file: 1, rank: 1 }),
      piece('white-rook-h', 'rook', 'white', { file: 8, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);
    const afterRookMove = applyMove(
      rookState,
      move('white-rook-a', { file: 1, rank: 1 }, { file: 1, rank: 2 }),
    );

    expect(afterRookMove.standard?.castlingRights.white).toEqual({
      kingSide: true,
      queenSide: false,
    });
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
        black: { kingSide: true, queenSide: true },
        white: { kingSide: true, queenSide: true },
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

function move(pieceId: string, from: Coordinate, to: Coordinate): PseudoLegalMove {
  return {
    kind: 'move',
    pieceId,
    from,
    to,
  };
}

function coordinateKey(coordinate: Coordinate): string {
  return `${String(coordinate.file)},${String(coordinate.rank)}`;
}
