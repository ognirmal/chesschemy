import type { GameState, PlayerId } from '../core/types.js';
import { generateLegalMoves } from './legalMoveGeneration.js';
import { isKingInCheck } from './attackDetection.js';

export type GameOutcome =
  | { readonly kind: 'active' }
  | { readonly kind: 'checkmate'; readonly winner: PlayerId; readonly loser: PlayerId }
  | { readonly kind: 'stalemate'; readonly player: PlayerId };

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

  return { kind: 'active' };
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
