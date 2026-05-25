import type { Coordinate, GameState, PieceInstance } from '../core/types.js';

export interface MovementContext {
  readonly state: GameState;
  readonly piece: PieceInstance;
}

export interface MovementPattern {
  readonly id: string;
  generateTargets(context: MovementContext): readonly Coordinate[];
}
