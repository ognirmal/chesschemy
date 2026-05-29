import type { GameState, PlayerId } from './types.js';

export function turn(state: GameState): PlayerId {
  return state.turn.activePlayer;
}
