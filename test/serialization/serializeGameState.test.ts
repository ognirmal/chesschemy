import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import { createGame } from '../../src/core/index.js';
import { definePiece } from '../../src/pieces/index.js';
import { generateLegalMoves } from '../../src/rules/index.js';
import { stepper } from '../../src/movement/index.js';
import {
  deserializeGameState,
  load,
  save,
  serializeGameState,
} from '../../src/serialization/index.js';

describe('game state serialization', () => {
  it('round-trips the standard initial state', () => {
    const state = createGame();
    const serialized = serializeGameState(state);

    expect(deserializeGameState(serialized)).toEqual(state);
    expect(load(save(state))).toEqual(state);
  });

  it('preserves JSON-friendly piece statuses', () => {
    const state = gameState([
      piece(
        'white-rook',
        'rook',
        'white',
        { file: 1, rank: 2 },
        {
          statuses: [{ id: 'shielded', duration: 2, data: { source: 'test' } }],
        },
      ),
      piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);

    const { pieceDefinitions: _pieceDefinitions, ...serializableState } = state;
    void _pieceDefinitions;

    expect(deserializeGameState(serializeGameState(state))).toEqual(serializableState);
  });

  it('rejects malformed statuses', () => {
    const state = gameState([
      piece(
        'white-rook',
        'rook',
        'white',
        { file: 1, rank: 2 },
        {
          statuses: [{ id: 'bad', duration: 0 }],
        },
      ),
      piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);

    expect(() => serializeGameState(state)).toThrow(
      'Piece white-rook status 0 duration must be a positive integer.',
    );
  });

  it('rejects non-JSON piece state', () => {
    const state = gameState([
      piece(
        'white-king',
        'king',
        'white',
        { file: 1, rank: 1 },
        {
          calculate: () => 1,
        },
      ),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);

    expect(() => serializeGameState(state)).toThrow(
      'Piece white-king state.calculate must be JSON-serializable.',
    );
  });

  it('strips custom definitions from serialized data and reattaches them on restore', () => {
    const wazir = definePiece({
      id: 'wazir',
      displayName: 'Wazir',
      movements: [stepper({ directions: 'orthogonal' })],
    });
    const state = gameState(
      [
        piece('white-wazir', 'wazir', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wazir],
    );

    const serialized = serializeGameState(state);
    expect('pieceDefinitions' in serialized.state).toBe(false);

    const restored = deserializeGameState(serialized, { pieceDefinitions: [wazir] });

    expect(restored.pieceDefinitions).toEqual([wazir]);
    expect(
      generateLegalMoves(restored)
        .filter((move) => move.pieceId === 'white-wazir')
        .map((move) => `${String(move.to.file)},${String(move.to.rank)}`)
        .sort(),
    ).toEqual(['3,4', '4,3', '4,5', '5,4']);
  });
});

function gameState(
  pieces: readonly PieceInstance[],
  pieceDefinitions: GameState['pieceDefinitions'] = [],
): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    pieceDefinitions,
    turn: {
      activePlayer: 'white',
      fullMove: 1,
      halfMoveClock: 0,
    },
    ruleset: {
      id: 'serialization-test',
      version: '0.2.0',
      displayName: 'Serialization Test',
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
  state?: Record<string, unknown>,
): PieceInstance {
  return {
    id,
    definitionId,
    owner,
    position,
    ...(state === undefined ? {} : { state }),
  };
}
