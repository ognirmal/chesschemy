import type {
  CastlingSide,
  Coordinate,
  GameState,
  GameStatus,
  PseudoLegalMove,
} from '../core/types.js';
import { sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import { resolveTriggeredAbilities } from '../events/resolveTriggeredAbilities.js';
import { applyMove, getMoveEvents } from './applyMove.js';
import { getGameOutcome } from './gameOutcome.js';
import { generateLegalMoves } from './legalMoveGeneration.js';

export interface MoveInput {
  readonly pieceId: string;
  readonly to: Coordinate;
  readonly promotionDefinitionId?: string;
  readonly castleSide?: CastlingSide;
}

export type MoveValidationResult =
  | { readonly valid: true; readonly move: PseudoLegalMove }
  | { readonly valid: false; readonly reason: string };

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

  const matches = generateLegalMoves(state).filter((move) => isMoveMatch(move, input));
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

  if (input.promotionDefinitionId === undefined) {
    const promotionMatches = generateLegalMoves(state).filter((move) =>
      isMoveMatchIgnoringPromotion(move, input),
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

function isMoveMatchIgnoringPromotion(move: PseudoLegalMove, input: MoveInput): boolean {
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

function isMoveMatch(move: PseudoLegalMove, input: MoveInput): boolean {
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
  }
}
