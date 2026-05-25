import { isCoordinateInsideBoard } from '../core/coordinates.js';
import type { Coordinate } from '../core/types.js';
import { findPieceAt, offsetCoordinate } from './boardQueries.js';
import type { DirectionSet, MovementContext, MovementPattern, Offset } from './movementPattern.js';

export interface LeaperOptions {
  readonly offsets?: readonly Offset[];
  readonly pattern?: 'knight';
}

export interface SliderOptions {
  readonly directions: DirectionSet | readonly Offset[];
}

export interface StepperOptions {
  readonly directions: DirectionSet | readonly Offset[];
}

const orthogonalDirections = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

const diagonalDirections = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

const knightOffsets = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
] as const;

export function leaper(options: LeaperOptions): MovementPattern {
  const offsets = options.pattern === 'knight' ? knightOffsets : (options.offsets ?? []);

  return {
    id: 'leaper',
    generateTargets(context: MovementContext): readonly Coordinate[] {
      return offsets
        .map(([fileOffset, rankOffset]) =>
          offsetCoordinate(context.piece.position, fileOffset, rankOffset),
        )
        .filter((target) => isCoordinateInsideBoard(target, context.state.board));
    },
  };
}

export function stepper(options: StepperOptions): MovementPattern {
  const directions = resolveDirections(options.directions);

  return {
    id: 'stepper',
    generateTargets(context: MovementContext): readonly Coordinate[] {
      return directions
        .map(([fileOffset, rankOffset]) =>
          offsetCoordinate(context.piece.position, fileOffset, rankOffset),
        )
        .filter((target) => isCoordinateInsideBoard(target, context.state.board));
    },
  };
}

export function slider(options: SliderOptions): MovementPattern {
  const directions = resolveDirections(options.directions);

  return {
    id: 'slider',
    generateTargets(context: MovementContext): readonly Coordinate[] {
      const targets: Coordinate[] = [];

      for (const [fileOffset, rankOffset] of directions) {
        let target = offsetCoordinate(context.piece.position, fileOffset, rankOffset);

        while (isCoordinateInsideBoard(target, context.state.board)) {
          targets.push(target);

          if (findPieceAt(context.state.pieces, target) !== undefined) {
            break;
          }

          target = offsetCoordinate(target, fileOffset, rankOffset);
        }
      }

      return targets;
    },
  };
}

export function stationary(): MovementPattern {
  return {
    id: 'stationary',
    generateTargets(): readonly Coordinate[] {
      return [];
    },
  };
}

function resolveDirections(directions: DirectionSet | readonly Offset[]): readonly Offset[] {
  if (directions === 'orthogonal') {
    return orthogonalDirections;
  }

  if (directions === 'diagonal') {
    return diagonalDirections;
  }

  if (directions === 'all') {
    return [...orthogonalDirections, ...diagonalDirections];
  }

  return directions;
}
