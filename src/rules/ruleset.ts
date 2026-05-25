import type { GameState } from '../core/types.js';

export interface RuleCheckResult {
  readonly valid: boolean;
  readonly reason?: string;
}

export interface Ruleset {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  validateState(state: GameState): RuleCheckResult;
}
