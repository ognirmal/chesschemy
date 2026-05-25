import { validateGameState } from '../validation/validateGameState.js';
import { standardPreset } from '../presets/standardPreset.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import type { GameState } from './types.js';

export interface CreateGameOptions {
  readonly initialState?: GameState;
  readonly pieceDefinitions?: readonly PieceDefinition[];
}

export function createGame(options: CreateGameOptions = {}): GameState {
  const baseState = options.initialState ?? standardPreset.createInitialState();
  const state =
    options.pieceDefinitions === undefined
      ? baseState
      : { ...baseState, pieceDefinitions: options.pieceDefinitions };

  validateGameState(state);
  return state;
}
