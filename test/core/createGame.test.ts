import {
  createGame,
  createVariantGame,
  definePiece,
  generateLegalMoves,
  stepper,
} from '../../src/index.js';

describe('createGame', () => {
  it('creates a deterministic standard chess initial state', () => {
    const first = createGame();
    const second = createGame();

    expect(first).toEqual(second);
    expect(first.board).toEqual({ files: 8, ranks: 8 });
    expect(first.pieces).toHaveLength(32);
    expect(first.turn.activePlayer).toBe('white');
  });

  it('creates validated custom variant games with defaults', () => {
    const wazir = definePiece({
      id: 'wazir',
      displayName: 'Wazir',
      movements: [stepper({ directions: 'orthogonal' })],
    });

    const state = createVariantGame({
      board: { files: 8, ranks: 8 },
      pieces: [
        {
          id: 'white-wazir',
          definitionId: 'wazir',
          owner: 'white',
          position: { file: 4, rank: 4 },
        },
        {
          id: 'white-king',
          definitionId: 'king',
          owner: 'white',
          position: { file: 1, rank: 1 },
        },
        {
          id: 'black-king',
          definitionId: 'king',
          owner: 'black',
          position: { file: 8, rank: 8 },
        },
      ],
      pieceDefinitions: [wazir],
      ruleset: {
        id: 'wazir-test',
        version: '1.0.0',
        displayName: 'Wazir Test',
      },
    });

    expect(state.turn).toEqual({
      activePlayer: 'white',
      fullMove: 1,
      halfMoveClock: 0,
    });
    expect(state.history).toEqual([]);
    expect(state.status).toEqual({ kind: 'active' });
    expect(
      generateLegalMoves(state)
        .filter((move) => move.pieceId === 'white-wazir')
        .map((move) => `${String(move.to.file)},${String(move.to.rank)}`)
        .sort(),
    ).toEqual(['3,4', '4,3', '4,5', '5,4']);
  });

  it('honors custom turn metadata for variant games', () => {
    const state = createVariantGame({
      board: { files: 4, ranks: 4 },
      pieces: [
        {
          id: 'black-king',
          definitionId: 'king',
          owner: 'black',
          position: { file: 4, rank: 4 },
        },
        {
          id: 'white-king',
          definitionId: 'king',
          owner: 'white',
          position: { file: 1, rank: 1 },
        },
      ],
      activePlayer: 'black',
      fullMove: 7,
      halfMoveClock: 3,
      ruleset: {
        id: 'small-board',
        version: '1.0.0',
        displayName: 'Small Board',
      },
    });

    expect(state.turn).toEqual({
      activePlayer: 'black',
      fullMove: 7,
      halfMoveClock: 3,
    });
  });
});
