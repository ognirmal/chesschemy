import { validateGameState } from '../validation/validateGameState.js';
import { standardPreset } from '../presets/standardPreset.js';
import type { GameState } from './types.js';

export interface CreateGameOptions {
  readonly initialState?: GameState;
}

export function createGame(options: CreateGameOptions = {}): GameState {
  const state = options.initialState ?? standardPreset.createInitialState();
  validateGameState(state);
  return state;
}
