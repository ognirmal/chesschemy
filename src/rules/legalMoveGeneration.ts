import type { GameState, PlayerId, PseudoLegalMove } from '../core/types.js';
import { generatePseudoLegalMoves } from '../movement/standardMoveGeneration.js';
import { applyMove } from './applyMove.js';
import { isKingInCheck } from './attackDetection.js';
import { generateCastlingMoves } from './castling.js';

export interface LegalMoveGenerationOptions {
  readonly playerId?: PlayerId;
}

export function generateLegalMoves(
  state: GameState,
  options: LegalMoveGenerationOptions = {},
): readonly PseudoLegalMove[] {
  const playerId = options.playerId ?? state.turn.activePlayer;

  return [
    ...generatePseudoLegalMoves(state, { playerId }),
    ...generateCastlingMoves(state, playerId),
  ].filter((move) => {
    const nextState = applyMove(state, move);
    return !isKingInCheck(nextState, playerId);
  });
}
