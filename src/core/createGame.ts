import { validateGameState } from '../validation/validateGameState.js';
import { standardPreset } from '../presets/standardPreset.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import type {
  BoardDimensions,
  GameState,
  PieceInstance,
  PlayerId,
  RulesetMetadata,
  StandardChessState,
} from './types.js';

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

export interface CreateVariantGameOptions {
  readonly board: BoardDimensions;
  readonly pieces: readonly PieceInstance[];
  readonly pieceDefinitions?: readonly PieceDefinition[];
  readonly activePlayer?: PlayerId;
  readonly ruleset: RulesetMetadata;
  readonly standard?: StandardChessState;
  readonly fullMove?: number;
  readonly halfMoveClock?: number;
}

export function createVariantGame(options: CreateVariantGameOptions): GameState {
  const state: GameState = {
    board: options.board,
    pieces: options.pieces,
    ...(options.pieceDefinitions === undefined
      ? {}
      : { pieceDefinitions: options.pieceDefinitions }),
    turn: {
      activePlayer: options.activePlayer ?? inferActivePlayer(options.pieces),
      fullMove: options.fullMove ?? 1,
      halfMoveClock: options.halfMoveClock ?? 0,
    },
    ruleset: options.ruleset,
    ...(options.standard === undefined ? {} : { standard: options.standard }),
    history: [],
    status: { kind: 'active' },
  };

  validateGameState(state);
  return state;
}

function inferActivePlayer(pieces: readonly PieceInstance[]): PlayerId {
  return pieces[0]?.owner ?? 'white';
}
