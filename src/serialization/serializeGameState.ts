import type { GameState } from '../core/types.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import { validateGameState } from '../validation/validateGameState.js';

export const SERIALIZATION_VERSION = 1;

export type SerializableGameState = Omit<GameState, 'pieceDefinitions'>;

export interface SerializedGameState {
  readonly version: number;
  readonly state: SerializableGameState;
}

export interface DeserializeGameStateOptions {
  readonly pieceDefinitions?: readonly PieceDefinition[];
}

export function serializeGameState(state: GameState): SerializedGameState {
  validateGameState(state);

  const { pieceDefinitions: _pieceDefinitions, ...serializableState } = state;
  void _pieceDefinitions;

  return {
    version: SERIALIZATION_VERSION,
    state: serializableState,
  };
}

export function deserializeGameState(
  serialized: SerializedGameState,
  options: DeserializeGameStateOptions = {},
): GameState {
  if (serialized.version !== SERIALIZATION_VERSION) {
    throw new Error(`Unsupported game state version: ${String(serialized.version)}`);
  }

  const state: GameState =
    options.pieceDefinitions === undefined
      ? serialized.state
      : { ...serialized.state, pieceDefinitions: options.pieceDefinitions };

  validateGameState(state);
  return state;
}
