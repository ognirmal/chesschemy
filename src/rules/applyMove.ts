import { ValidationError } from '../core/errors.js';
import type {
  Coordinate,
  GameState,
  MoveAction,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../core/types.js';
import { findPieceAt } from '../movement/boardQueries.js';
import { getCastlingRookMove, updateCastlingRights } from './castling.js';

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
    .map((piece) => movePieceForAction(state, movingPiece, piece, move));

  const nextStandard = updateCastlingRights(state, movingPiece, capturedPiece);

  return {
    ...state,
    pieces: nextPieces,
    ...(nextStandard === undefined ? {} : { standard: nextStandard }),
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

function movePieceForAction(
  state: GameState,
  movingPiece: PieceInstance,
  piece: PieceInstance,
  move: PseudoLegalMove,
): PieceInstance {
  if (piece.id === movingPiece.id) {
    return movePiece(piece, move);
  }

  const rookMove = getRookMoveForCastle(state, movingPiece, move);
  if (rookMove !== undefined && sameSquare(piece.position, rookMove.rookFrom)) {
    return {
      ...piece,
      position: rookMove.rookTo,
    };
  }

  return piece;
}

function getRookMoveForCastle(
  state: GameState,
  movingPiece: PieceInstance,
  move: PseudoLegalMove,
): { readonly rookFrom: Coordinate; readonly rookTo: Coordinate } | undefined {
  if (movingPiece.definitionId !== 'king' || move.castleSide === undefined) {
    return undefined;
  }

  return getCastlingRookMove(state, movingPiece.owner, move.castleSide);
}

function toMoveAction(move: PseudoLegalMove): MoveAction {
  return {
    kind: 'move',
    pieceId: move.pieceId,
    to: move.to,
    ...(move.castleSide === undefined ? {} : { castleSide: move.castleSide }),
    ...(move.promotionDefinitionId === undefined
      ? {}
      : { promotionDefinitionId: move.promotionDefinitionId }),
  };
}

function sameSquare(left: Coordinate, right: Coordinate): boolean {
  return left.file === right.file && left.rank === right.rank;
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
