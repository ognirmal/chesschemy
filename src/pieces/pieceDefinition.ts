import type { AbilityDefinition } from '../abilities/abilityDefinition.js';
import type { MovementPattern } from '../movement/movementPattern.js';

export interface PieceDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly canMove: boolean;
  readonly canCapture: boolean;
  readonly movements: readonly MovementPattern[];
  readonly abilities?: readonly AbilityDefinition[];
}
