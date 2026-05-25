import type { GameAction, PieceInstance, PlayerId } from '../core/types.js';

export type GameEvent =
  | { readonly kind: 'action:accepted'; readonly action: GameAction }
  | { readonly kind: 'piece:captured'; readonly piece: PieceInstance }
  | { readonly kind: 'turn:ended'; readonly nextPlayer: PlayerId };
