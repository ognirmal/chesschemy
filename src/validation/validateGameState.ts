import { coordinateKey, isCoordinateInsideBoard, sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { GameState, PieceInstance } from '../core/types.js';
import type { AbilityDefinition } from '../abilities/abilityDefinition.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import { standardPieces } from '../pieces/standardPieces.js';
import { isKingInCheck } from '../rules/attackDetection.js';

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

  validateRuleEvaluatedState(state);
  validateStandardChessState(state);
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

  if (ability.allowsSelfCheck !== undefined && typeof ability.allowsSelfCheck !== 'boolean') {
    throw new ValidationError(`${path} allowsSelfCheck must be a boolean.`);
  }
}

function validateRuleEvaluatedState(state: GameState): void {
  const players = [...new Set(state.pieces.map((piece) => piece.owner))].sort();

  if (players.length !== 2) {
    throw new ValidationError('Chesschemy requires exactly two players.');
  }

  for (const playerId of players) {
    const kings = state.pieces.filter(
      (piece) => piece.owner === playerId && piece.definitionId === 'king',
    );

    if (kings.length !== 1) {
      throw new ValidationError(
        `Player ${playerId} must have exactly one king; found ${String(kings.length)}.`,
      );
    }
  }

  const [firstKing, secondKing] = state.pieces
    .filter((piece) => piece.definitionId === 'king')
    .sort((left, right) => left.owner.localeCompare(right.owner));

  if (firstKing === undefined || secondKing === undefined) {
    return;
  }

  if (areKingsAdjacent(firstKing, secondKing)) {
    throw new ValidationError('Kings cannot occupy adjacent squares.');
  }

  const checkedPlayers = players.filter((playerId) => isKingInCheck(state, playerId));
  if (checkedPlayers.length === 2) {
    throw new ValidationError('Both kings cannot be in check.');
  }
}

function validateStandardChessState(state: GameState): void {
  if (state.standard === undefined) {
    return;
  }

  if (!isPlainObject(state.standard.castlingRights)) {
    throw new ValidationError('Standard castling rights must be a JSON object.');
  }

  const players = [...new Set(state.pieces.map((piece) => piece.owner))].sort();
  const castlingPlayers = Object.keys(state.standard.castlingRights).sort();

  if (
    castlingPlayers.length !== players.length ||
    castlingPlayers.some((playerId, index) => playerId !== players[index])
  ) {
    throw new ValidationError('Standard castling rights must match the current players.');
  }

  for (const [playerId, rights] of Object.entries(state.standard.castlingRights)) {
    if (
      rights === undefined ||
      typeof rights.kingSide !== 'boolean' ||
      typeof rights.queenSide !== 'boolean'
    ) {
      throw new ValidationError(
        `Standard castling rights for ${playerId} must include boolean kingSide and queenSide values.`,
      );
    }
  }

  if (
    state.standard.enPassantTarget !== undefined &&
    !isCoordinateInsideBoard(state.standard.enPassantTarget, state.board)
  ) {
    throw new ValidationError('Standard en passant target must be inside the board.');
  }
}

function areKingsAdjacent(firstKing: PieceInstance, secondKing: PieceInstance): boolean {
  if (sameCoordinate(firstKing.position, secondKing.position)) {
    return true;
  }

  return (
    Math.abs(firstKing.position.file - secondKing.position.file) <= 1 &&
    Math.abs(firstKing.position.rank - secondKing.position.rank) <= 1
  );
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

  if (piece.definitionId === 'king' && statuses.length > 0) {
    throw new ValidationError(`King ${piece.id} cannot have statuses.`);
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
