import type { GameState, PlayerId } from '../core/types.js';
import { generateLegalMoves } from './legalMoveGeneration.js';
import { isKingInCheck } from './attackDetection.js';

export type GameOutcome =
  | { readonly kind: 'active' }
  | { readonly kind: 'checkmate'; readonly winner: PlayerId; readonly loser: PlayerId }
  | { readonly kind: 'stalemate'; readonly player: PlayerId }
  | { readonly kind: 'insufficientMaterial' };

export function isCheckmate(
  state: GameState,
  playerId: PlayerId = state.turn.activePlayer,
): boolean {
  return isKingInCheck(state, playerId) && generateLegalMoves(state, { playerId }).length === 0;
}

export function isStalemate(
  state: GameState,
  playerId: PlayerId = state.turn.activePlayer,
): boolean {
  return !isKingInCheck(state, playerId) && generateLegalMoves(state, { playerId }).length === 0;
}

export function isInsufficientMaterial(state: GameState): boolean {
  const nonKingPieces = state.pieces.filter((piece) => piece.definitionId !== 'king');

  if (nonKingPieces.length === 0) {
    return true;
  }

  if (nonKingPieces.length === 1) {
    return isMinorPiece(nonKingPieces[0]?.definitionId);
  }

  if (
    nonKingPieces.length === 2 &&
    nonKingPieces.every((piece) => piece.definitionId === 'bishop') &&
    nonKingPieces[0] !== undefined &&
    nonKingPieces[1] !== undefined
  ) {
    return squareColor(nonKingPieces[0]) === squareColor(nonKingPieces[1]);
  }

  return false;
}

export function getGameOutcome(state: GameState): GameOutcome {
  const playerId = state.turn.activePlayer;

  if (isCheckmate(state, playerId)) {
    return {
      kind: 'checkmate',
      winner: getOpposingPlayer(state, playerId),
      loser: playerId,
    };
  }

  if (isStalemate(state, playerId)) {
    return {
      kind: 'stalemate',
      player: playerId,
    };
  }

  if (isInsufficientMaterial(state)) {
    return { kind: 'insufficientMaterial' };
  }

  return { kind: 'active' };
}

function isMinorPiece(definitionId: string | undefined): boolean {
  return definitionId === 'bishop' || definitionId === 'knight';
}

function squareColor(piece: {
  readonly position: { readonly file: number; readonly rank: number };
}): number {
  return (piece.position.file + piece.position.rank) % 2;
}

function getOpposingPlayer(state: GameState, playerId: PlayerId): PlayerId {
  if (playerId === 'white') {
    return 'black';
  }

  if (playerId === 'black') {
    return 'white';
  }

  return state.pieces.find((piece) => piece.owner !== playerId)?.owner ?? playerId;
}
