import { coordinateKey, isCoordinateInsideBoard } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { GameState, PieceInstance } from '../core/types.js';

export function validateGameState(state: GameState): void {
  if (state.board.files < 1 || state.board.ranks < 1) {
    throw new ValidationError('Board dimensions must be positive.');
  }

  const occupied = new Set<string>();

  for (const piece of state.pieces) {
    if (!isCoordinateInsideBoard(piece.position, state.board)) {
      throw new ValidationError(`Piece ${piece.id} is outside the board.`);
    }

    const key = coordinateKey(piece.position);
    if (occupied.has(key)) {
      throw new ValidationError(`Multiple pieces occupy ${key}.`);
    }

    occupied.add(key);
    validatePieceState(piece);
  }
}

function validatePieceState(piece: PieceInstance): void {
  if (piece.state === undefined) {
    return;
  }

  if (!isPlainObject(piece.state)) {
    throw new ValidationError(`Piece ${piece.id} state must be a JSON object.`);
  }

  validateJsonValue(piece.state, `Piece ${piece.id} state`);
  validatePieceStatuses(piece);
}

function validatePieceStatuses(piece: PieceInstance): void {
  if (piece.state === undefined || !('statuses' in piece.state)) {
    return;
  }

  const statuses = piece.state.statuses;
  if (!Array.isArray(statuses)) {
    throw new ValidationError(`Piece ${piece.id} statuses must be an array.`);
  }

  statuses.forEach((status, index) => {
    const path = `Piece ${piece.id} status ${String(index)}`;

    if (!isPlainObject(status)) {
      throw new ValidationError(`${path} must be a JSON object.`);
    }

    if (typeof status.id !== 'string' || status.id.length === 0) {
      throw new ValidationError(`${path} must have a non-empty string id.`);
    }

    if (
      'duration' in status &&
      !(
        typeof status.duration === 'number' &&
        Number.isInteger(status.duration) &&
        status.duration > 0
      )
    ) {
      throw new ValidationError(`${path} duration must be a positive integer.`);
    }

    if ('data' in status && !isPlainObject(status.data)) {
      throw new ValidationError(`${path} data must be a JSON object.`);
    }
  });
}

function validateJsonValue(value: unknown, path: string, seen = new WeakSet()): void {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return;
  }

  if (Array.isArray(value)) {
    validateJsonObjectNotSeen(value, path, seen);
    value.forEach((entry, index) => {
      validateJsonValue(entry, `${path}[${String(index)}]`, seen);
    });
    seen.delete(value);
    return;
  }

  if (isPlainObject(value)) {
    validateJsonObjectNotSeen(value, path, seen);
    for (const [key, entry] of Object.entries(value)) {
      validateJsonValue(entry, `${path}.${key}`, seen);
    }
    seen.delete(value);
    return;
  }

  throw new ValidationError(`${path} must be JSON-serializable.`);
}

function validateJsonObjectNotSeen(value: object, path: string, seen: WeakSet<object>): void {
  if (seen.has(value)) {
    throw new ValidationError(`${path} must not contain circular references.`);
  }

  seen.add(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
