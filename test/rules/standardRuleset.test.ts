import { createGame } from '../../src/core/index.js';
import { standardRuleset } from '../../src/rules/index.js';

describe('standardRuleset', () => {
  it('accepts only 8x8 boards', () => {
    expect(standardRuleset.validateState(createGame())).toEqual({ valid: true });

    expect(
      standardRuleset.validateState({
        ...createGame(),
        board: { files: 10, ranks: 8 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Standard chess requires an 8x8 board.',
    });
  });
});
