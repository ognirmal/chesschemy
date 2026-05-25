import type { AbilityDefinition } from '../abilities/abilityDefinition.js';
import type {
  MoveCandidate,
  PieceBehaviorContext,
  MovementPattern,
} from '../movement/movementPattern.js';

export interface PieceDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly canMove?: boolean;
  readonly canCapture?: boolean;
  readonly movements?: readonly MovementPattern[];
  readonly abilities?: readonly AbilityDefinition[];
  generateMoves?(context: PieceBehaviorContext): readonly MoveCandidate[];
  getAbilities?(context: PieceBehaviorContext): readonly AbilityDefinition[];
  canMovePiece?(context: PieceBehaviorContext): boolean;
  canCapturePiece?(context: PieceBehaviorContext): boolean;
}

export interface DefinePieceConfig {
  readonly id: string;
  readonly displayName: string;
  readonly canMove?: boolean;
  readonly canCapture?: boolean;
  readonly movements?: readonly MovementPattern[];
  readonly abilities?: readonly AbilityDefinition[];
  generateMoves?(context: PieceBehaviorContext): readonly MoveCandidate[];
  getAbilities?(context: PieceBehaviorContext): readonly AbilityDefinition[];
  canMovePiece?(context: PieceBehaviorContext): boolean;
  canCapturePiece?(context: PieceBehaviorContext): boolean;
}

export function definePiece(config: DefinePieceConfig): PieceDefinition {
  const definition: PieceDefinition = {
    id: config.id,
    displayName: config.displayName,
    canMove: config.canMove ?? true,
    canCapture: config.canCapture ?? true,
    movements: config.movements ?? [],
    ...(config.abilities === undefined ? {} : { abilities: config.abilities }),
  };

  if (config.generateMoves !== undefined) {
    definition.generateMoves = (context) => config.generateMoves?.(context) ?? [];
  }

  if (config.getAbilities !== undefined) {
    definition.getAbilities = (context) => config.getAbilities?.(context) ?? [];
  }

  if (config.canMovePiece !== undefined) {
    definition.canMovePiece = (context) => config.canMovePiece?.(context) ?? true;
  }

  if (config.canCapturePiece !== undefined) {
    definition.canCapturePiece = (context) => config.canCapturePiece?.(context) ?? true;
  }

  return definition;
}
