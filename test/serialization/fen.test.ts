import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import {
  createGame,
  definePiece,
  deserializeFen,
  serializeFen,
  STARTING_FEN,
} from '../../src/index.js';

describe('FEN serialization', () => {
  it('serializes the standard initial position', () => {
    expect(serializeFen(createGame())).toBe(STARTING_FEN);
  });

  it('deserializes the standard initial position', () => {
    const state = deserializeFen(STARTING_FEN);

    expect(state.board).toEqual({ files: 8, ranks: 8 });
    expect(state.pieces).toHaveLength(32);
    expect(state.turn).toEqual({
      activePlayer: 'white',
      halfMoveClock: 0,
      fullMove: 1,
    });
    expect(state.standard).toEqual({
      castlingRights: {
        black: { kingSide: true, queenSide: true },
        white: { kingSide: true, queenSide: true },
      },
    });
  });

  it('preserves active color, castling rights, en passant target, and clocks', () => {
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
        piece('white-rook-a', 'rook', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
        piece('black-pawn', 'pawn', 'black', { file: 4, rank: 5 }),
      ],
      'black',
      {
        enPassantTarget: { file: 4, rank: 6 },
        halfMoveClock: 7,
        fullMove: 12,
      },
    );

    const fen = serializeFen(state);
    const restored = deserializeFen(fen);

    expect(fen).toBe('4k3/8/8/3p4/8/8/8/R3K3 b Q d6 7 12');
    expect(serializeFen(restored)).toBe(fen);
  });

  it('rejects malformed FEN strings', () => {
    expect(() => deserializeFen('8/8/8/8/8/8/8/8 w - - 0')).toThrow(
      'FEN must contain exactly 6 fields.',
    );
    expect(() => deserializeFen('8/8/8/8/8/8/8 w - - 0 1')).toThrow(
      'FEN piece placement must contain 8 ranks.',
    );
    expect(() => deserializeFen('8/8/8/8/8/8/8/7x w - - 0 1')).toThrow('Invalid FEN piece: x.');
    expect(() => deserializeFen('8/8/8/8/8/8/8/8 z - - 0 1')).toThrow(
      'Invalid FEN active color: z.',
    );
    expect(() => deserializeFen('8/8/8/8/8/8/8/8 w KK - 0 1')).toThrow(
      'Invalid FEN castling rights: KK.',
    );
    expect(() => deserializeFen('8/8/8/8/8/8/8/8 w - i9 0 1')).toThrow('Invalid FEN square: i9.');
    expect(() => deserializeFen('8/8/8/8/8/8/8/8 w - - -1 1')).toThrow(
      'Invalid FEN halfmove clock: -1.',
    );
    expect(() => deserializeFen('8/8/8/8/8/8/8/8 w - - 0 0')).toThrow(
      'Invalid FEN fullmove number: 0.',
    );
  });

  it('rejects states FEN cannot represent', () => {
    const wizard = definePiece({ id: 'wizard', displayName: 'Wizard' });

    expect(() =>
      serializeFen({
        ...gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          'white',
        ),
        pieceDefinitions: [wizard],
      }),
    ).toThrow('FEN serialization does not support piece definition: wizard.');

    expect(() =>
      serializeFen({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        board: { files: 10, ranks: 8 },
      }),
    ).toThrow('FEN serialization only supports 8x8 boards.');
  });
});

interface GameStateOptions {
  readonly enPassantTarget?: Coordinate;
  readonly halfMoveClock?: number;
  readonly fullMove?: number;
}

function gameState(
  pieces: readonly PieceInstance[],
  activePlayer: PlayerId = 'white',
  options: GameStateOptions = {},
): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    turn: {
      activePlayer,
      halfMoveClock: options.halfMoveClock ?? 0,
      fullMove: options.fullMove ?? 1,
    },
    ruleset: {
      id: 'standard-chess',
      version: '0.1.0',
      displayName: 'Standard Chess',
    },
    standard: {
      castlingRights: {
        black: { kingSide: false, queenSide: false },
        white: { kingSide: false, queenSide: true },
      },
      ...(options.enPassantTarget === undefined
        ? {}
        : { enPassantTarget: options.enPassantTarget }),
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
