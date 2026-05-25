import type { Coordinate, GameState, PieceInstance } from '../core/types.js';

export interface MovementContext {
  readonly state: GameState;
  readonly piece: PieceInstance;
}

export type PieceBehaviorContext = MovementContext;

export interface MoveCandidate {
  readonly to: Coordinate;
}

export type Offset = readonly [number, number];

export type DirectionSet = 'orthogonal' | 'diagonal' | 'all';

export interface MovementPattern {
  readonly id: string;
  generateTargets(context: MovementContext): readonly Coordinate[];
}
