import type { GameState } from '../core/types.js';
import { validateGameState } from '../validation/validateGameState.js';

export const SERIALIZATION_VERSION = 1;

export interface SerializedGameState {
  readonly version: number;
  readonly state: GameState;
}

export function serializeGameState(state: GameState): SerializedGameState {
  validateGameState(state);
  return {
    version: SERIALIZATION_VERSION,
    state,
  };
}

export function deserializeGameState(serialized: SerializedGameState): GameState {
  if (serialized.version !== SERIALIZATION_VERSION) {
    throw new Error(`Unsupported game state version: ${String(serialized.version)}`);
  }

  validateGameState(serialized.state);
  return serialized.state;
}
