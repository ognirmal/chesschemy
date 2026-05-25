import type { AbilityAction, Coordinate, GameState, PieceInstance } from '../core/types.js';
import type { EffectDefinition } from '../effects/effectDefinition.js';
import type { GameEvent } from '../events/gameEvent.js';

export interface AbilityContext {
  readonly state: GameState;
  readonly source: PieceInstance;
  readonly ability?: AbilityDefinition;
  readonly target?: Coordinate;
  readonly action?: AbilityAction;
  readonly event?: GameEvent;
}

export type AbilityKind = 'active' | 'passive' | 'triggered';

export type AbilityTargetDistance = 'chebyshev' | 'manhattan';

export type AbilityTargetOccupancy = 'any' | 'empty' | 'occupied' | 'enemy' | 'friendly';

export interface AbilityTargetRules {
  readonly required?: boolean;
  readonly range?: number;
  readonly distance?: AbilityTargetDistance;
  readonly includeSelf?: boolean;
  readonly occupancy?: AbilityTargetOccupancy;
  validate?(context: AbilityContext): boolean;
}

export interface AbilityDefinition {
  readonly id: string;
  readonly kind: AbilityKind;
  readonly displayName: string;
  readonly consumesTurn?: boolean;
  readonly target?: AbilityTargetRules;
  readonly effects: readonly EffectDefinition[];
  canActivate?(context: AbilityContext): boolean;
  shouldTrigger?(context: AbilityContext): boolean;
  resolveTarget?(context: AbilityContext): Coordinate | undefined;
}
