import { ValidationError } from '../core/errors.js';
import type {
  GameState,
  MoveAction,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../core/types.js';
import { findPieceAt } from '../movement/boardQueries.js';

export function applyMove(state: GameState, move: PseudoLegalMove): GameState {
  const movingPiece = state.pieces.find((piece) => piece.id === move.pieceId);

  if (movingPiece === undefined) {
    throw new ValidationError(`Cannot move unknown piece: ${move.pieceId}`);
  }

  const capturedPiece = findPieceAt(state.pieces, move.to);
  if (capturedPiece?.owner === movingPiece.owner) {
    throw new ValidationError(`Cannot capture a friendly piece: ${capturedPiece.id}`);
  }

  const nextPieces = state.pieces
    .filter((piece) => piece.id !== capturedPiece?.id)
    .map((piece) => (piece.id === movingPiece.id ? movePiece(piece, move) : piece));

  return {
    ...state,
    pieces: nextPieces,
    turn: {
      activePlayer: getNextPlayer(state, movingPiece.owner),
      fullMove: movingPiece.owner === 'black' ? state.turn.fullMove + 1 : state.turn.fullMove,
      halfMoveClock: shouldResetHalfMoveClock(movingPiece, capturedPiece)
        ? 0
        : state.turn.halfMoveClock + 1,
    },
    history: [...state.history, toMoveAction(move)],
  };
}

function movePiece(piece: PieceInstance, move: PseudoLegalMove): PieceInstance {
  return {
    ...piece,
    definitionId: move.promotionDefinitionId ?? piece.definitionId,
    position: move.to,
  };
}

function toMoveAction(move: PseudoLegalMove): MoveAction {
  return {
    kind: 'move',
    pieceId: move.pieceId,
    to: move.to,
    ...(move.promotionDefinitionId === undefined
      ? {}
      : { promotionDefinitionId: move.promotionDefinitionId }),
  };
}

function shouldResetHalfMoveClock(
  movingPiece: PieceInstance,
  capturedPiece: PieceInstance | undefined,
): boolean {
  return movingPiece.definitionId === 'pawn' || capturedPiece !== undefined;
}

function getNextPlayer(state: GameState, currentPlayer: PlayerId): PlayerId {
  if (currentPlayer === 'white') {
    return 'black';
  }

  if (currentPlayer === 'black') {
    return 'white';
  }

  const players = [...new Set(state.pieces.map((piece) => piece.owner))].sort();
  return players.find((player) => player !== currentPlayer) ?? currentPlayer;
}
