import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../../src/index.js';
import {
  applyMove,
  createGame,
  generateLegalMoves,
  isKingInCheck,
  isSquareAttacked,
} from '../../src/index.js';

describe('legal move generation', () => {
  it('keeps the standard initial position at 20 legal moves', () => {
    expect(generateLegalMoves(createGame())).toHaveLength(20);
  });

  it('rejects moves that leave a checked king in check', () => {
    const whiteKing = piece('white-king', 'king', 'white', { file: 5, rank: 1 });
    const blackRook = piece('black-rook', 'rook', 'black', { file: 5, rank: 8 });
    const whiteKnight = piece('white-knight', 'knight', 'white', { file: 2, rank: 1 });
    const blackKing = piece('black-king', 'king', 'black', { file: 1, rank: 8 });
    const state = gameState([whiteKing, blackRook, whiteKnight, blackKing]);

    const moves = generateLegalMoves(state);

    expect(isKingInCheck(state, 'white')).toBe(true);
    expect(moves.map((move) => move.pieceId)).not.toContain('white-knight');
    expect(moveTargets(moves)).toEqual(['4,1', '4,2', '6,1', '6,2']);
  });

  it('rejects pinned piece moves that expose the king', () => {
    const whiteKing = piece('white-king', 'king', 'white', { file: 5, rank: 1 });
    const pinnedRook = piece('white-rook', 'rook', 'white', { file: 5, rank: 2 });
    const blackRook = piece('black-rook', 'rook', 'black', { file: 5, rank: 8 });
    const blackKing = piece('black-king', 'king', 'black', { file: 1, rank: 8 });
    const state = gameState([whiteKing, pinnedRook, blackRook, blackKing]);

    const pinnedRookMoves = generateLegalMoves(state).filter(
      (move) => move.pieceId === 'white-rook',
    );

    expect(moveTargets(pinnedRookMoves)).toEqual(['5,3', '5,4', '5,5', '5,6', '5,7', '5,8']);
  });

  it('rejects king moves into attacked squares', () => {
    const whiteKing = piece('white-king', 'king', 'white', { file: 4, rank: 4 });
    const blackRook = piece('black-rook', 'rook', 'black', { file: 5, rank: 8 });
    const blackKing = piece('black-king', 'king', 'black', { file: 1, rank: 8 });
    const state = gameState([whiteKing, blackRook, blackKing]);

    expect(
      moveTargets(generateLegalMoves(state).filter((move) => move.pieceId === 'white-king')),
    ).toEqual(['3,3', '3,4', '3,5', '4,3', '4,5']);
  });

  it('detects pawn attacks separately from pawn forward movement', () => {
    const whitePawn = piece('white-pawn', 'pawn', 'white', { file: 4, rank: 4 });
    const state = gameState([
      whitePawn,
      piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);

    expect(isSquareAttacked(state, { file: 5, rank: 5 }, 'white')).toBe(true);
    expect(isSquareAttacked(state, { file: 4, rank: 5 }, 'white')).toBe(false);
  });

  it('applies moves immutably with captures, history, clocks, and turn changes', () => {
    const whiteRook = piece('white-rook', 'rook', 'white', { file: 1, rank: 1 });
    const blackKnight = piece('black-knight', 'knight', 'black', { file: 1, rank: 8 });
    const state = gameState([
      whiteRook,
      blackKnight,
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);
    const move: PseudoLegalMove = {
      kind: 'move',
      pieceId: 'white-rook',
      from: { file: 1, rank: 1 },
      to: { file: 1, rank: 8 },
      capturePieceId: 'black-knight',
    };

    const nextState = applyMove(state, move);

    expect(state.pieces.find((candidate) => candidate.id === 'white-rook')?.position).toEqual({
      file: 1,
      rank: 1,
    });
    expect(nextState.pieces.find((candidate) => candidate.id === 'black-knight')).toBeUndefined();
    expect(nextState.pieces.find((candidate) => candidate.id === 'white-rook')?.position).toEqual({
      file: 1,
      rank: 8,
    });
    expect(nextState.turn.activePlayer).toBe('black');
    expect(nextState.turn.halfMoveClock).toBe(0);
    expect(nextState.history).toEqual([
      { kind: 'move', pieceId: 'white-rook', to: { file: 1, rank: 8 } },
    ]);
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

function moveTargets(moves: readonly PseudoLegalMove[]): string[] {
  return moves.map((move) => coordinateKey(move.to)).sort();
}

function coordinateKey(coordinate: Coordinate): string {
  return `${String(coordinate.file)},${String(coordinate.rank)}`;
}
