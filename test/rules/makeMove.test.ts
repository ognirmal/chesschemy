import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import { createGame, makeMove, validateMove, ValidationError } from '../../src/index.js';

describe('move execution API', () => {
  it('validates and applies a simple legal move from user input', () => {
    const state = createGame();
    const validation = validateMove(state, {
      pieceId: 'white-pawn-5',
      to: { file: 5, rank: 4 },
    });

    expect(validation.valid).toBe(true);

    const nextState = makeMove(state, {
      pieceId: 'white-pawn-5',
      to: { file: 5, rank: 4 },
    });

    expect(nextState.pieces.find((piece) => piece.id === 'white-pawn-5')?.position).toEqual({
      file: 5,
      rank: 4,
    });
    expect(nextState.turn.activePlayer).toBe('black');
    expect(nextState.status).toEqual({ kind: 'active' });
  });

  it('returns structured validation failures for illegal moves', () => {
    const state = createGame();

    expect(
      validateMove(state, {
        pieceId: 'black-pawn-5',
        to: { file: 5, rank: 5 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Piece black-pawn-5 does not belong to the active player.',
    });

    expect(() =>
      makeMove(state, {
        pieceId: 'white-pawn-5',
        to: { file: 5, rank: 6 },
      }),
    ).toThrow(ValidationError);
  });

  it('requires promotion selection when multiple promotion moves match', () => {
    const state = gameState([
      piece('white-pawn', 'pawn', 'white', { file: 1, rank: 7 }),
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);

    expect(
      validateMove(state, {
        pieceId: 'white-pawn',
        to: { file: 1, rank: 8 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Move is ambiguous. Provide a promotion piece.',
    });

    const nextState = makeMove(state, {
      pieceId: 'white-pawn',
      to: { file: 1, rank: 8 },
      promotionDefinitionId: 'queen',
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-pawn')?.definitionId).toBe(
      'queen',
    );
  });

  it('updates status to won after checkmate', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-queen', 'queen', 'black', { file: 3, rank: 2 }),
        piece('black-king', 'king', 'black', { file: 3, rank: 3 }),
      ],
      'black',
    );

    const nextState = makeMove(state, {
      pieceId: 'black-queen',
      to: { file: 2, rank: 2 },
    });

    expect(nextState.status).toEqual({
      kind: 'won',
      winner: 'black',
      reason: 'checkmate',
    });
  });

  it('updates status to draw after stalemate', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-queen', 'queen', 'black', { file: 4, rank: 3 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'black',
    );

    const nextState = makeMove(state, {
      pieceId: 'black-queen',
      to: { file: 2, rank: 3 },
    });

    expect(nextState.status).toEqual({
      kind: 'draw',
      reason: 'stalemate',
    });
  });

  it('does not allow moves after the game has ended', () => {
    const state: GameState = {
      ...createGame(),
      status: {
        kind: 'draw',
        reason: 'stalemate',
      },
    };

    expect(
      validateMove(state, {
        pieceId: 'white-pawn-5',
        to: { file: 5, rank: 4 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Cannot move after the game has ended.',
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
