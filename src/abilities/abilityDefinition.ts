import type { Coordinate, GameState, PieceInstance } from '../core/types.js';
import type { EffectDefinition } from '../effects/effectDefinition.js';

export interface AbilityContext {
  readonly state: GameState;
  readonly source: PieceInstance;
  readonly target?: Coordinate;
}

export type AbilityKind = 'active' | 'passive' | 'triggered';

export interface AbilityDefinition {
  readonly id: string;
  readonly kind: AbilityKind;
  readonly displayName: string;
  readonly effects: readonly EffectDefinition[];
  canActivate?(context: AbilityContext): boolean;
}
