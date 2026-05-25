export type PlayerId = string;

export interface Coordinate {
  readonly file: number;
  readonly rank: number;
}

export interface BoardDimensions {
  readonly files: number;
  readonly ranks: number;
}

export interface PieceInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly owner: PlayerId;
  readonly position: Coordinate;
  readonly state?: Record<string, unknown>;
}

export interface TurnState {
  readonly activePlayer: PlayerId;
  readonly fullMove: number;
  readonly halfMoveClock: number;
}

export interface RulesetMetadata {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
}

export interface GameState {
  readonly board: BoardDimensions;
  readonly pieces: readonly PieceInstance[];
  readonly pieceDefinitions?: readonly import('../pieces/pieceDefinition.js').PieceDefinition[];
  readonly turn: TurnState;
  readonly ruleset: RulesetMetadata;
  readonly standard?: StandardChessState;
  readonly history: readonly GameAction[];
  readonly status: GameStatus;
}

export type CastlingSide = 'kingSide' | 'queenSide';

export interface CastlingRights {
  readonly kingSide: boolean;
  readonly queenSide: boolean;
}

export interface StandardChessState {
  readonly castlingRights: Readonly<Record<PlayerId, CastlingRights>>;
  readonly enPassantTarget?: Coordinate;
}

export type GameStatus =
  | { readonly kind: 'active' }
  | { readonly kind: 'draw'; readonly reason: string }
  | { readonly kind: 'won'; readonly winner: PlayerId; readonly reason: string };

export type GameAction = MoveAction | AbilityAction;

export interface MoveAction {
  readonly kind: 'move';
  readonly pieceId: string;
  readonly to: Coordinate;
  readonly promotionDefinitionId?: string;
  readonly castleSide?: CastlingSide;
}

export interface PseudoLegalMove extends MoveAction {
  readonly from: Coordinate;
  readonly capturePieceId?: string;
  readonly enPassantCaptureSquare?: Coordinate;
}

export interface AbilityAction {
  readonly kind: 'ability';
  readonly pieceId: string;
  readonly abilityId: string;
  readonly target?: Coordinate;
}
