import { createGame } from '../../src/index.js';

describe('createGame', () => {
  it('creates a deterministic standard chess initial state', () => {
    const first = createGame();
    const second = createGame();

    expect(first).toEqual(second);
    expect(first.board).toEqual({ files: 8, ranks: 8 });
    expect(first.pieces).toHaveLength(32);
    expect(first.turn.activePlayer).toBe('white');
  });
});
