import type { GameState } from '../core/types.js';
import type { RuleCheckResult, Ruleset } from './ruleset.js';

export const standardRuleset: Ruleset = {
  id: 'standard-chess',
  version: '0.1.0',
  displayName: 'Standard Chess',
  validateState(state: GameState): RuleCheckResult {
    if (state.board.files !== 8 || state.board.ranks !== 8) {
      return { valid: false, reason: 'Standard chess requires an 8x8 board.' };
    }

    return { valid: true };
  },
};
