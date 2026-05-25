import { ValidationError } from '../core/errors.js';
import type {
  Coordinate,
  GameState,
  MoveAction,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
  StandardChessState,
} from '../core/types.js';
import type { GameEvent } from '../events/gameEvent.js';
import { findPieceAt } from '../movement/boardQueries.js';
import { getCastlingRookMove, updateCastlingRights } from './castling.js';

const allowedPromotionDefinitionIds = new Set(['queen', 'rook', 'bishop', 'knight']);

export function applyMove(state: GameState, move: PseudoLegalMove): GameState {
  const movingPiece = state.pieces.find((piece) => piece.id === move.pieceId);

  if (movingPiece === undefined) {
    throw new ValidationError(`Cannot move unknown piece: ${move.pieceId}`);
  }

  validatePromotion(movingPiece, move, state.board.ranks);

  const capturedPiece = findCapturedPiece(state, move);
  if (capturedPiece?.owner === movingPiece.owner) {
    throw new ValidationError(`Cannot capture a friendly piece: ${capturedPiece.id}`);
  }

  const nextPieces = state.pieces
    .filter((piece) => piece.id !== capturedPiece?.id)
    .map((piece) => movePieceForAction(state, movingPiece, piece, move));

  const nextStandard = updateStandardChessState(state, movingPiece, capturedPiece, move);

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

export function getMoveEvents(state: GameState, move: PseudoLegalMove): readonly GameEvent[] {
  const movingPiece = state.pieces.find((piece) => piece.id === move.pieceId);

  if (movingPiece === undefined) {
    throw new ValidationError(`Cannot build move events for unknown piece: ${move.pieceId}`);
  }

  const action = toMoveAction(move);
  const capturedPiece = findCapturedPiece(state, move);
  const events: GameEvent[] = [
    { kind: 'action:accepted', action },
    {
      kind: 'piece:moved',
      action,
      piece: movingPiece,
      from: move.from,
      to: move.to,
    },
  ];

  if (capturedPiece !== undefined) {
    events.push({
      kind: 'piece:captured',
      piece: capturedPiece,
      byPiece: movingPiece,
      at: capturedPiece.position,
    });
  }

  events.push({
    kind: 'turn:ended',
    previousPlayer: movingPiece.owner,
    nextPlayer: getNextPlayer(state, movingPiece.owner),
  });

  return events;
}

function movePiece(piece: PieceInstance, move: PseudoLegalMove): PieceInstance {
  return {
    ...piece,
    definitionId: move.promotionDefinitionId ?? piece.definitionId,
    position: move.to,
  };
}

function findCapturedPiece(state: GameState, move: PseudoLegalMove): PieceInstance | undefined {
  if (move.enPassantCaptureSquare !== undefined) {
    return findPieceAt(state.pieces, move.enPassantCaptureSquare);
  }

  return findPieceAt(state.pieces, move.to);
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

function updateStandardChessState(
  state: GameState,
  movingPiece: PieceInstance,
  capturedPiece: PieceInstance | undefined,
  move: PseudoLegalMove,
): StandardChessState | undefined {
  const nextStandard = updateCastlingRights(state, movingPiece, capturedPiece);
  if (nextStandard === undefined) {
    return undefined;
  }

  const enPassantTarget =
    movingPiece.definitionId === 'pawn' && Math.abs(move.to.rank - move.from.rank) === 2
      ? {
          file: move.from.file,
          rank: (move.from.rank + move.to.rank) / 2,
        }
      : undefined;

  return {
    castlingRights: nextStandard.castlingRights,
    ...(enPassantTarget === undefined ? {} : { enPassantTarget }),
  };
}

function validatePromotion(
  movingPiece: PieceInstance,
  move: PseudoLegalMove,
  boardRanks: number,
): void {
  if (move.promotionDefinitionId === undefined) {
    return;
  }

  if (movingPiece.definitionId !== 'pawn') {
    throw new ValidationError('Only pawns can promote.');
  }

  if (!allowedPromotionDefinitionIds.has(move.promotionDefinitionId)) {
    throw new ValidationError(`Invalid promotion piece: ${move.promotionDefinitionId}`);
  }

  const promotionRank = movingPiece.owner === 'black' ? 1 : boardRanks;
  if (move.to.rank !== promotionRank) {
    throw new ValidationError('Pawn promotion must end on the final rank.');
  }
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
