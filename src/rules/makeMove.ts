import type {
  CastlingSide,
  Coordinate,
  GameState,
  GameStatus,
  PieceInstance,
  PseudoLegalMove,
} from '../core/types.js';
import { sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import { isCoordinateInsideBoard } from '../core/coordinates.js';
import { toCoordinate } from '../core/squares.js';
import type { SquareInput } from '../core/squares.js';
import { resolveTriggeredAbilities } from '../events/resolveTriggeredAbilities.js';
import { applyMove, getMoveEvents } from './applyMove.js';
import { getGameOutcome } from './gameOutcome.js';
import { generateLegalMoves } from './legalMoveGeneration.js';
import { parseSanMoveInput } from './san.js';

export interface MoveInput {
  readonly pieceId: string;
  readonly to: SquareInput;
  readonly promotionDefinitionId?: string;
  readonly castleSide?: CastlingSide;
}

export interface MoveFromSquareInput {
  readonly from: SquareInput;
  readonly to: SquareInput;
  readonly promotionDefinitionId?: string;
  readonly castleSide?: CastlingSide;
}

export interface SimpleMoveOptions {
  readonly promotion?: string;
  readonly promotionDefinitionId?: string;
  readonly castleSide?: CastlingSide;
}

export type MoveValidationResult =
  | { readonly valid: true; readonly move: PseudoLegalMove }
  | { readonly valid: false; readonly reason: string };

interface NormalizedMoveInput extends Omit<MoveInput, 'to'> {
  readonly to: Coordinate;
}

export function validateMove(state: GameState, input: MoveInput): MoveValidationResult {
  if (state.status.kind !== 'active') {
    return {
      valid: false,
      reason: 'Cannot move after the game has ended.',
    };
  }

  const piece = state.pieces.find((candidate) => candidate.id === input.pieceId);
  if (piece === undefined) {
    return {
      valid: false,
      reason: `Unknown piece: ${input.pieceId}`,
    };
  }

  if (piece.owner !== state.turn.activePlayer) {
    return {
      valid: false,
      reason: `Piece ${input.pieceId} does not belong to the active player.`,
    };
  }

  const to = toOptionalCoordinate(input.to);
  if (to === undefined) {
    return {
      valid: false,
      reason: `Invalid square: ${formatSquareInput(input.to)}`,
    };
  }

  const normalizedInput = {
    ...input,
    to,
  };

  const matches = generateLegalMoves(state).filter((move) => isMoveMatch(move, normalizedInput));
  if (matches.length === 1) {
    const matchedMove = matches[0];
    if (matchedMove === undefined) {
      return {
        valid: false,
        reason: 'Move is not legal.',
      };
    }

    return {
      valid: true,
      move: matchedMove,
    };
  }

  if (matches.length > 1) {
    return {
      valid: false,
      reason: 'Move is ambiguous. Provide a promotion piece.',
    };
  }

  if (normalizedInput.promotionDefinitionId === undefined) {
    const promotionMatches = generateLegalMoves(state).filter((move) =>
      isMoveMatchIgnoringPromotion(move, normalizedInput),
    );

    if (promotionMatches.length > 1) {
      return {
        valid: false,
        reason: 'Move is ambiguous. Provide a promotion piece.',
      };
    }
  }

  return {
    valid: false,
    reason: 'Move is not legal.',
  };
}

function isMoveMatchIgnoringPromotion(move: PseudoLegalMove, input: NormalizedMoveInput): boolean {
  return (
    move.pieceId === input.pieceId &&
    sameCoordinate(move.to, input.to) &&
    optionalValueMatches(move.castleSide, input.castleSide)
  );
}

export function makeMove(state: GameState, input: MoveInput): GameState {
  const validation = validateMove(state, input);

  if (!validation.valid) {
    throw new ValidationError(validation.reason);
  }

  const movedState = applyMove(state, validation.move);
  return withUpdatedStatus(
    resolveTriggeredAbilities(movedState, getMoveEvents(state, validation.move)),
  );
}

export function validateMoveFromSquare(
  state: GameState,
  input: MoveFromSquareInput,
): MoveValidationResult {
  const from = toOptionalCoordinate(input.from);

  if (from === undefined || !isCoordinateInsideBoard(from, state.board)) {
    return {
      valid: false,
      reason: `Invalid square: ${formatSquareInput(input.from)}`,
    };
  }

  const piece = findPieceAt(state, from);
  if (piece === undefined) {
    return {
      valid: false,
      reason: `No piece at square: ${formatSquareInput(input.from)}`,
    };
  }

  return validateMove(state, {
    pieceId: piece.id,
    to: input.to,
    ...(input.promotionDefinitionId === undefined
      ? {}
      : { promotionDefinitionId: input.promotionDefinitionId }),
    ...(input.castleSide === undefined ? {} : { castleSide: input.castleSide }),
  });
}

export function makeMoveFromSquare(state: GameState, input: MoveFromSquareInput): GameState {
  const validation = validateMoveFromSquare(state, input);

  if (!validation.valid) {
    throw new ValidationError(validation.reason);
  }

  const movedState = applyMove(state, validation.move);
  return withUpdatedStatus(
    resolveTriggeredAbilities(movedState, getMoveEvents(state, validation.move)),
  );
}

export function validate(state: GameState, san: string): MoveValidationResult;
export function validate(
  state: GameState,
  from: SquareInput,
  to: SquareInput,
  options?: SimpleMoveOptions,
): MoveValidationResult;
export function validate(
  state: GameState,
  fromOrSan: SquareInput,
  to?: SquareInput,
  options: SimpleMoveOptions = {},
): MoveValidationResult {
  if (to === undefined) {
    if (typeof fromOrSan !== 'string') {
      return { valid: false, reason: 'Move notation must be a string.' };
    }

    try {
      return { valid: true, move: parseSanMoveInput(state, fromOrSan) };
    } catch (error) {
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Move is not legal.',
      };
    }
  }

  return validateMoveFromSquare(state, toMoveFromSquareInput(fromOrSan, to, options));
}

export function move(state: GameState, san: string): GameState;
export function move(
  state: GameState,
  from: SquareInput,
  to: SquareInput,
  options?: SimpleMoveOptions,
): GameState;
export function move(
  state: GameState,
  fromOrSan: SquareInput,
  to?: SquareInput,
  options: SimpleMoveOptions = {},
): GameState {
  if (to === undefined) {
    if (typeof fromOrSan !== 'string') {
      throw new ValidationError('Move notation must be a string.');
    }

    return applyValidatedMove(state, parseSanMoveInput(state, fromOrSan));
  }

  return makeMoveFromSquare(state, toMoveFromSquareInput(fromOrSan, to, options));
}

function isMoveMatch(move: PseudoLegalMove, input: NormalizedMoveInput): boolean {
  return (
    move.pieceId === input.pieceId &&
    sameCoordinate(move.to, input.to) &&
    optionalValueMatches(move.promotionDefinitionId, input.promotionDefinitionId) &&
    optionalValueMatches(move.castleSide, input.castleSide)
  );
}

function optionalValueMatches<TValue>(
  moveValue: TValue | undefined,
  inputValue: TValue | undefined,
): boolean {
  if (inputValue !== undefined) {
    return moveValue === inputValue;
  }

  return moveValue === undefined;
}

function findPieceAt(state: GameState, coordinate: Coordinate): PieceInstance | undefined {
  return state.pieces.find((piece) => sameCoordinate(piece.position, coordinate));
}

function toOptionalCoordinate(square: SquareInput): Coordinate | undefined {
  try {
    return toCoordinate(square);
  } catch {
    return undefined;
  }
}

function formatSquareInput(square: SquareInput): string {
  return typeof square === 'string' ? square : `${String(square.file)},${String(square.rank)}`;
}

function applyValidatedMove(state: GameState, move: PseudoLegalMove): GameState {
  const movedState = applyMove(state, move);
  return withUpdatedStatus(resolveTriggeredAbilities(movedState, getMoveEvents(state, move)));
}

function toMoveFromSquareInput(
  from: SquareInput,
  to: SquareInput,
  options: SimpleMoveOptions,
): MoveFromSquareInput {
  return {
    from,
    to,
    ...(options.promotionDefinitionId === undefined && options.promotion === undefined
      ? {}
      : { promotionDefinitionId: options.promotionDefinitionId ?? options.promotion }),
    ...(options.castleSide === undefined ? {} : { castleSide: options.castleSide }),
  };
}

function withUpdatedStatus(state: GameState): GameState {
  return {
    ...state,
    status: getStatusFromOutcome(state),
  };
}

function getStatusFromOutcome(state: GameState): GameStatus {
  const outcome = getGameOutcome(state);

  switch (outcome.kind) {
    case 'active':
      return { kind: 'active' };
    case 'checkmate':
      return {
        kind: 'won',
        winner: outcome.winner,
        reason: 'checkmate',
      };
    case 'stalemate':
      return {
        kind: 'draw',
        reason: 'stalemate',
      };
    case 'insufficientMaterial':
      return {
        kind: 'draw',
        reason: 'insufficient-material',
      };
  }
}
