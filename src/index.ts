export {
  coordinateKey,
  Game,
  isCoordinateInsideBoard,
  parseSquare,
  formatSquare,
  sameCoordinate,
  toCoordinate,
  turn,
  ValidationError,
  createVariantGame,
} from './core/index.js';
export type * from './core/types.js';

export * from './abilities/index.js';
export * from './effects/index.js';
export * from './events/index.js';
export * from './movement/index.js';
export * from './pieces/index.js';
export * from './presets/index.js';
export * from './statuses/index.js';
export * from './validation/index.js';

export {
  getActivePlayerPieces,
  getLegalDestinationsForPiece,
  getLegalMovesForPiece,
  getPieceById,
  getPiecesForPlayer,
  isOccupied,
  isOccupiedByOpponent,
  isOccupiedByPlayer,
  moves,
  pieceAt,
} from './queries/index.js';

export {
  fen,
  fromFen,
  load,
  save,
  SERIALIZATION_VERSION,
  STARTING_FEN,
} from './serialization/index.js';
export type {
  DeserializeGameStateOptions,
  SerializableGameState,
  SerializedGameState,
} from './serialization/index.js';

export {
  formatSan,
  generateLegalMoves,
  getGameOutcome,
  isCheck,
  isCheckmate,
  isInsufficientMaterial,
  isSquareAttacked,
  isStalemate,
  move,
  moveSan,
  result,
  standardRuleset,
  validate,
} from './rules/index.js';
