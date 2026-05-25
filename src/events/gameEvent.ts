import type {
  AbilityAction,
  Coordinate,
  GameAction,
  MoveAction,
  PieceInstance,
  PlayerId,
} from '../core/types.js';

export type GameEvent =
  | { readonly kind: 'action:accepted'; readonly action: GameAction }
  | { readonly kind: 'ability:used'; readonly action: AbilityAction }
  | {
      readonly kind: 'piece:moved';
      readonly action: MoveAction;
      readonly piece: PieceInstance;
      readonly from: Coordinate;
      readonly to: Coordinate;
    }
  | {
      readonly kind: 'piece:captured';
      readonly piece: PieceInstance;
      readonly byPiece: PieceInstance;
      readonly at: Coordinate;
    }
  | { readonly kind: 'piece:removed'; readonly piece: PieceInstance }
  | {
      readonly kind: 'turn:ended';
      readonly previousPlayer: PlayerId;
      readonly nextPlayer: PlayerId;
    };
