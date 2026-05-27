import { isCoordinateInsideBoard } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { AbilityAction, Coordinate, GameState, PieceInstance } from '../core/types.js';
import type { AbilityDefinition } from '../abilities/abilityDefinition.js';
import type { GameEvent } from '../events/gameEvent.js';
import { findPieceAt } from '../movement/boardQueries.js';
import type { PieceStatus } from '../statuses/statusDefinition.js';
import {
  getAbilityCooldownStatusId,
  withAddedPieceStatus,
  withRemovedPieceStatus,
} from '../statuses/statusDefinition.js';

export interface EffectContext {
  readonly state: GameState;
  readonly source: PieceInstance;
  readonly ability: AbilityDefinition;
  readonly action: AbilityAction;
  readonly target?: Coordinate;
  readonly event?: GameEvent;
}

export interface EffectDefinition {
  readonly id: string;
  readonly description: string;
  apply(context: EffectContext): GameState;
}

export interface EffectOptions {
  readonly id?: string;
  readonly description?: string;
}

export function teleportSourceToTarget(options: EffectOptions = {}): EffectDefinition {
  return {
    id: options.id ?? 'teleport-source-to-target',
    description: options.description ?? 'Move the source piece to the target square.',
    apply(context) {
      const target = requireTarget(context);
      if (isEffectImmunePiece(context.source)) {
        return context.state;
      }

      validateTargetInsideBoard(context.state, target);

      const occupiedPiece = findPieceAt(context.state.pieces, target);
      if (occupiedPiece !== undefined && occupiedPiece.id !== context.source.id) {
        throw new ValidationError(`Cannot teleport to occupied square: ${targetKey(target)}`);
      }

      return {
        ...context.state,
        pieces: context.state.pieces.map((piece) =>
          piece.id === context.source.id ? { ...piece, position: target } : piece,
        ),
      };
    },
  };
}

export function removeSource(options: EffectOptions = {}): EffectDefinition {
  return {
    id: options.id ?? 'remove-source',
    description: options.description ?? 'Remove the source piece from the board.',
    apply(context) {
      if (isEffectImmunePiece(context.source)) {
        return context.state;
      }

      return {
        ...context.state,
        pieces: context.state.pieces.filter((piece) => piece.id !== context.source.id),
      };
    },
  };
}

export function removeTargetPiece(options: EffectOptions = {}): EffectDefinition {
  return {
    id: options.id ?? 'remove-target-piece',
    description: options.description ?? 'Remove the piece on the target square.',
    apply(context) {
      const target = requireTarget(context);
      const targetPiece = findPieceAt(context.state.pieces, target);

      if (targetPiece === undefined) {
        throw new ValidationError(`No piece exists at target square: ${targetKey(target)}`);
      }

      if (isEffectImmunePiece(targetPiece)) {
        return context.state;
      }

      return {
        ...context.state,
        pieces: context.state.pieces.filter((piece) => piece.id !== targetPiece.id),
      };
    },
  };
}

export function updateSourceState(
  patch: Readonly<Record<string, unknown>>,
  options: EffectOptions = {},
): EffectDefinition {
  return {
    id: options.id ?? 'update-source-state',
    description: options.description ?? 'Merge state into the source piece.',
    apply(context) {
      if (isEffectImmunePiece(context.source)) {
        return context.state;
      }

      return updatePieceState(context.state, context.source.id, patch);
    },
  };
}

export function updateTargetPieceState(
  patch: Readonly<Record<string, unknown>>,
  options: EffectOptions = {},
): EffectDefinition {
  return {
    id: options.id ?? 'update-target-piece-state',
    description: options.description ?? 'Merge state into the target piece.',
    apply(context) {
      const target = requireTarget(context);
      const targetPiece = findPieceAt(context.state.pieces, target);

      if (targetPiece === undefined) {
        throw new ValidationError(`No piece exists at target square: ${targetKey(target)}`);
      }

      if (isEffectImmunePiece(targetPiece)) {
        return context.state;
      }

      return updatePieceState(context.state, targetPiece.id, patch);
    },
  };
}

export function addSourceStatus(
  status: PieceStatus,
  options: EffectOptions = {},
): EffectDefinition {
  return {
    id: options.id ?? 'add-source-status',
    description: options.description ?? 'Add a status to the source piece.',
    apply(context) {
      if (isEffectImmunePiece(context.source)) {
        return context.state;
      }

      return updatePiece(context.state, context.source.id, (piece) =>
        withAddedPieceStatus(piece, status),
      );
    },
  };
}

export function addTargetStatus(
  status: PieceStatus,
  options: EffectOptions = {},
): EffectDefinition {
  return {
    id: options.id ?? 'add-target-status',
    description: options.description ?? 'Add a status to the target piece.',
    apply(context) {
      const targetPiece = requireTargetPiece(context);
      if (isEffectImmunePiece(targetPiece)) {
        return context.state;
      }

      return updatePiece(context.state, targetPiece.id, (piece) =>
        withAddedPieceStatus(piece, status),
      );
    },
  };
}

export function removeSourceStatus(
  statusId: string,
  options: EffectOptions = {},
): EffectDefinition {
  return {
    id: options.id ?? 'remove-source-status',
    description: options.description ?? 'Remove a status from the source piece.',
    apply(context) {
      if (isEffectImmunePiece(context.source)) {
        return context.state;
      }

      return updatePiece(context.state, context.source.id, (piece) =>
        withRemovedPieceStatus(piece, statusId),
      );
    },
  };
}

export function removeTargetStatus(
  statusId: string,
  options: EffectOptions = {},
): EffectDefinition {
  return {
    id: options.id ?? 'remove-target-status',
    description: options.description ?? 'Remove a status from the target piece.',
    apply(context) {
      const targetPiece = requireTargetPiece(context);
      if (isEffectImmunePiece(targetPiece)) {
        return context.state;
      }

      return updatePiece(context.state, targetPiece.id, (piece) =>
        withRemovedPieceStatus(piece, statusId),
      );
    },
  };
}

export function setSourceAbilityCooldown(
  abilityId: string,
  duration: number,
  options: EffectOptions = {},
): EffectDefinition {
  return addSourceStatus(
    { id: getAbilityCooldownStatusId(abilityId), duration },
    {
      id: options.id ?? 'set-source-ability-cooldown',
      description: options.description ?? 'Set an ability cooldown on the source piece.',
    },
  );
}

function updatePieceState(
  state: GameState,
  pieceId: string,
  patch: Readonly<Record<string, unknown>>,
): GameState {
  return {
    ...state,
    pieces: state.pieces.map((piece) =>
      piece.id === pieceId
        ? {
            ...piece,
            state: {
              ...piece.state,
              ...patch,
            },
          }
        : piece,
    ),
  };
}

function updatePiece(
  state: GameState,
  pieceId: string,
  update: (piece: PieceInstance) => PieceInstance,
): GameState {
  return {
    ...state,
    pieces: state.pieces.map((piece) => (piece.id === pieceId ? update(piece) : piece)),
  };
}

function requireTargetPiece(context: EffectContext): PieceInstance {
  const target = requireTarget(context);
  const targetPiece = findPieceAt(context.state.pieces, target);

  if (targetPiece === undefined) {
    throw new ValidationError(`No piece exists at target square: ${targetKey(target)}`);
  }

  return targetPiece;
}

function requireTarget(context: EffectContext): Coordinate {
  if (context.target === undefined) {
    throw new ValidationError(`Ability ${context.ability.id} requires a target.`);
  }

  return context.target;
}

function validateTargetInsideBoard(state: GameState, target: Coordinate): void {
  if (!isCoordinateInsideBoard(target, state.board)) {
    throw new ValidationError(`Target is outside the board: ${targetKey(target)}`);
  }
}

function targetKey(target: Coordinate): string {
  return `${String(target.file)},${String(target.rank)}`;
}

function isEffectImmunePiece(piece: PieceInstance): boolean {
  return piece.definitionId === 'king';
}
