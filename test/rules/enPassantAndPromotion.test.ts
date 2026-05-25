import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../../src/index.js';
import { applyMove, generateLegalMoves, ValidationError } from '../../src/index.js';

describe('en passant and promotion', () => {
  it('sets an en passant target after a two-square pawn move', () => {
    const state = gameState([
      piece('white-pawn', 'pawn', 'white', { file: 5, rank: 2 }),
      piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);

    const nextState = applyMove(
      state,
      move('white-pawn', { file: 5, rank: 2 }, { file: 5, rank: 4 }),
    );

    expect(nextState.standard?.enPassantTarget).toEqual({ file: 5, rank: 3 });
  });

  it('generates and applies en passant captures', () => {
    const state = gameState(
      [
        piece('white-pawn', 'pawn', 'white', { file: 5, rank: 5 }),
        piece('black-pawn', 'pawn', 'black', { file: 4, rank: 5 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
      { file: 4, rank: 6 },
    );

    const enPassantMove = generateLegalMoves(state).find(
      (candidate) => candidate.enPassantCaptureSquare !== undefined,
    );

    expect(enPassantMove).toMatchObject({
      pieceId: 'white-pawn',
      to: { file: 4, rank: 6 },
      capturePieceId: 'black-pawn',
      enPassantCaptureSquare: { file: 4, rank: 5 },
    });

    if (enPassantMove === undefined) {
      throw new Error('Expected en passant move to be generated.');
    }

    const nextState = applyMove(state, enPassantMove);

    expect(nextState.pieces.find((candidate) => candidate.id === 'black-pawn')).toBeUndefined();
    expect(nextState.pieces.find((candidate) => candidate.id === 'white-pawn')?.position).toEqual({
      file: 4,
      rank: 6,
    });
    expect(nextState.standard?.enPassantTarget).toBeUndefined();
    expect(nextState.turn.halfMoveClock).toBe(0);
  });

  it('clears en passant targets after ordinary moves', () => {
    const state = gameState(
      [
        piece('white-knight', 'knight', 'white', { file: 2, rank: 1 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      'white',
      { file: 4, rank: 6 },
    );

    const nextState = applyMove(
      state,
      move('white-knight', { file: 2, rank: 1 }, { file: 3, rank: 3 }),
    );

    expect(nextState.standard?.enPassantTarget).toBeUndefined();
  });

  it('applies valid promotion and rejects invalid promotion requests', () => {
    const state = gameState([
      piece('white-pawn', 'pawn', 'white', { file: 1, rank: 7 }),
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);

    const promoted = applyMove(state, {
      kind: 'move',
      pieceId: 'white-pawn',
      from: { file: 1, rank: 7 },
      to: { file: 1, rank: 8 },
      promotionDefinitionId: 'queen',
    });

    expect(promoted.pieces.find((candidate) => candidate.id === 'white-pawn')?.definitionId).toBe(
      'queen',
    );
    expect(() =>
      applyMove(state, {
        kind: 'move',
        pieceId: 'white-pawn',
        from: { file: 1, rank: 7 },
        to: { file: 1, rank: 8 },
        promotionDefinitionId: 'king',
      }),
    ).toThrow(ValidationError);
  });
});

function gameState(
  pieces: readonly PieceInstance[],
  activePlayer: PlayerId = 'white',
  enPassantTarget?: Coordinate,
): GameState {
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
      ...(enPassantTarget === undefined ? {} : { enPassantTarget }),
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
