import type { GameState } from '../core/types.js';

export interface EffectContext {
  readonly state: GameState;
}

export interface EffectDefinition {
  readonly id: string;
  readonly description: string;
  apply(context: EffectContext): GameState;
}
