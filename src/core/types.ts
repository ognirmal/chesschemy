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
  readonly turn: TurnState;
  readonly ruleset: RulesetMetadata;
  readonly history: readonly GameAction[];
  readonly status: GameStatus;
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
}

export interface PseudoLegalMove extends MoveAction {
  readonly from: Coordinate;
  readonly capturePieceId?: string;
}

export interface AbilityAction {
  readonly kind: 'ability';
  readonly pieceId: string;
  readonly abilityId: string;
  readonly target?: Coordinate;
}
