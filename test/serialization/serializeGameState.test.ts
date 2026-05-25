import { createGame, deserializeGameState, serializeGameState } from '../../src/index.js';

describe('game state serialization', () => {
  it('round-trips the standard initial state', () => {
    const state = createGame();
    const serialized = serializeGameState(state);

    expect(deserializeGameState(serialized)).toEqual(state);
  });
});
