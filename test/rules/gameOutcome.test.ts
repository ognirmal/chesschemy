import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import {
  getGameOutcome,
  isCheck,
  isCheckmate,
  isInsufficientMaterial,
  isStalemate,
  result,
} from '../../src/index.js';

describe('game outcome helpers', () => {
  it('checks the active player by default or an explicit player', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        piece('black-rook', 'rook', 'black', { file: 5, rank: 8 }),
      ],
      'white',
    );

    expect(isCheck(state)).toBe(true);
    expect(isCheck(state, 'white')).toBe(true);
    expect(isCheck(state, 'black')).toBe(false);
  });

  it('detects checkmate', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-queen', 'queen', 'black', { file: 2, rank: 2 }),
        piece('black-king', 'king', 'black', { file: 3, rank: 3 }),
      ],
      'white',
    );

    expect(isCheckmate(state)).toBe(true);
    expect(getGameOutcome(state)).toEqual({
      kind: 'checkmate',
      winner: 'black',
      loser: 'white',
    });
  });

  it('detects stalemate', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-queen', 'queen', 'black', { file: 2, rank: 3 }),
        piece('black-king', 'king', 'black', { file: 3, rank: 2 }),
      ],
      'white',
    );

    expect(isStalemate(state)).toBe(true);
    expect(getGameOutcome(state)).toEqual({
      kind: 'stalemate',
      player: 'white',
    });
  });

  it('reports active games when legal moves remain', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-rook', 'rook', 'white', { file: 1, rank: 2 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
    );

    expect(getGameOutcome(state)).toEqual({ kind: 'active' });
    expect(result(state)).toBe('active');
  });

  it('returns simple result strings from game status', () => {
    expect(result({ ...gameState([], 'white'), status: { kind: 'draw', reason: 'test' } })).toBe(
      'draw',
    );
    expect(
      result({
        ...gameState([], 'white'),
        status: { kind: 'won', winner: 'black', reason: 'checkmate' },
      }),
    ).toBe('black-won');
  });

  it('detects insufficient material with bare kings', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
    );

    expect(isInsufficientMaterial(state)).toBe(true);
    expect(getGameOutcome(state)).toEqual({ kind: 'insufficientMaterial' });
  });

  it('detects insufficient material with one minor piece', () => {
    const bishopState = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-bishop', 'bishop', 'white', { file: 3, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
    );
    const knightState = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-knight', 'knight', 'white', { file: 2, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
    );

    expect(getGameOutcome(bishopState)).toEqual({ kind: 'insufficientMaterial' });
    expect(getGameOutcome(knightState)).toEqual({ kind: 'insufficientMaterial' });
  });

  it('detects insufficient material with bishops on the same color', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-bishop', 'bishop', 'white', { file: 3, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        piece('black-bishop', 'bishop', 'black', { file: 6, rank: 4 }),
      ],
      'white',
    );

    expect(getGameOutcome(state)).toEqual({ kind: 'insufficientMaterial' });
  });

  it('does not report insufficient material with mating material', () => {
    const rookState = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-rook', 'rook', 'white', { file: 1, rank: 2 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
    );
    const oppositeBishopState = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-bishop', 'bishop', 'white', { file: 3, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        piece('black-bishop', 'bishop', 'black', { file: 6, rank: 5 }),
      ],
      'white',
    );

    expect(isInsufficientMaterial(rookState)).toBe(false);
    expect(isInsufficientMaterial(oppositeBishopState)).toBe(false);
  });
});

function gameState(pieces: readonly PieceInstance[], activePlayer: PlayerId): GameState {
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
