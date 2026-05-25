import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import { getGameOutcome, isCheckmate, isStalemate } from '../../src/index.js';

describe('game outcome helpers', () => {
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
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
    );

    expect(getGameOutcome(state)).toEqual({ kind: 'active' });
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
