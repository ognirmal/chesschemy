import { coordinateKey, isCoordinateInsideBoard } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { GameState, PieceInstance } from '../core/types.js';
import type { AbilityDefinition } from '../abilities/abilityDefinition.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import { standardPieces } from '../pieces/standardPieces.js';

export function validateGameState(state: GameState): void {
  if (state.board.files < 1 || state.board.ranks < 1) {
    throw new ValidationError('Board dimensions must be positive.');
  }

  validateTurnState(state);

  const occupied = new Set<string>();
  const pieceIds = new Set<string>();
  const definitionIds = validatePieceDefinitions(state.pieceDefinitions ?? []);

  for (const piece of state.pieces) {
    if (piece.id.length === 0) {
      throw new ValidationError('Piece id must be a non-empty string.');
    }

    if (pieceIds.has(piece.id)) {
      throw new ValidationError(`Duplicate piece id: ${piece.id}.`);
    }

    pieceIds.add(piece.id);

    if (!definitionIds.has(piece.definitionId)) {
      throw new ValidationError(
        `Piece ${piece.id} references unknown definition: ${piece.definitionId}.`,
      );
    }

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

function validateTurnState(state: GameState): void {
  if (!Number.isInteger(state.turn.fullMove) || state.turn.fullMove < 1) {
    throw new ValidationError('Turn fullMove must be a positive integer.');
  }

  if (!Number.isInteger(state.turn.halfMoveClock) || state.turn.halfMoveClock < 0) {
    throw new ValidationError('Turn halfMoveClock must be a non-negative integer.');
  }

  if (
    state.pieces.length > 0 &&
    !state.pieces.some((piece) => piece.owner === state.turn.activePlayer)
  ) {
    throw new ValidationError(`Active player has no pieces: ${state.turn.activePlayer}.`);
  }
}

function validatePieceDefinitions(
  customDefinitions: readonly PieceDefinition[],
): ReadonlySet<string> {
  const definitionIds = new Set<string>();

  for (const definition of [...standardPieces, ...customDefinitions]) {
    if (typeof definition.id !== 'string' || definition.id.length === 0) {
      throw new ValidationError('Piece definition id must be a non-empty string.');
    }

    if (definitionIds.has(definition.id)) {
      throw new ValidationError(`Duplicate piece definition id: ${definition.id}.`);
    }

    if (typeof definition.displayName !== 'string' || definition.displayName.length === 0) {
      throw new ValidationError(
        `Piece definition ${definition.id} must have a non-empty displayName.`,
      );
    }

    definitionIds.add(definition.id);

    for (const ability of definition.abilities ?? []) {
      validateAbilityDefinition(definition, ability);
    }
  }

  return definitionIds;
}

function validateAbilityDefinition(definition: PieceDefinition, ability: AbilityDefinition): void {
  const abilityId = typeof ability.id === 'string' ? ability.id : String(ability.id);
  const path = `Ability ${abilityId} on piece definition ${definition.id}`;

  if (typeof ability.id !== 'string' || ability.id.length === 0) {
    throw new ValidationError(
      `Ability on piece definition ${definition.id} must have a non-empty id.`,
    );
  }

  const abilityKind: unknown = ability.kind;
  if (abilityKind !== 'active' && abilityKind !== 'passive' && abilityKind !== 'triggered') {
    throw new ValidationError(`${path} has invalid kind: ${String(abilityKind)}.`);
  }

  if (typeof ability.displayName !== 'string' || ability.displayName.length === 0) {
    throw new ValidationError(`${path} must have a non-empty displayName.`);
  }

  if (!Array.isArray(ability.effects)) {
    throw new ValidationError(`${path} must have an effects array.`);
  }

  if (
    ability.target?.range !== undefined &&
    (!Number.isFinite(ability.target.range) || ability.target.range < 0)
  ) {
    throw new ValidationError(`${path} target range must be a non-negative number.`);
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
