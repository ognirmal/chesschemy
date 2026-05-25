import { isCoordinateInsideBoard, sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { Coordinate, GameState, PieceInstance, PlayerId } from '../core/types.js';
import { findPieceAt, offsetCoordinate } from '../movement/boardQueries.js';

const diagonalDirections = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

const orthogonalDirections = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

const knightOffsets = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
] as const;

const kingOffsets = [...diagonalDirections, ...orthogonalDirections] as const;

export function isKingInCheck(state: GameState, playerId: PlayerId): boolean {
  const king = state.pieces.find(
    (piece) => piece.owner === playerId && piece.definitionId === 'king',
  );

  if (king === undefined) {
    throw new ValidationError(`Cannot evaluate check without a king for player: ${playerId}`);
  }

  return isSquareAttacked(state, king.position, getOpposingPlayer(state, playerId));
}

export function isSquareAttacked(
  state: GameState,
  square: Coordinate,
  byPlayer: PlayerId,
): boolean {
  return state.pieces
    .filter((piece) => piece.owner === byPlayer)
    .some((piece) => doesPieceAttackSquare(state, piece, square));
}

function doesPieceAttackSquare(
  state: GameState,
  piece: PieceInstance,
  square: Coordinate,
): boolean {
  switch (piece.definitionId) {
    case 'pawn':
      return doesPawnAttackSquare(piece, square);
    case 'knight':
      return doesLeaperAttackSquare(state, piece, square, knightOffsets);
    case 'bishop':
      return doesSliderAttackSquare(state, piece, square, diagonalDirections);
    case 'rook':
      return doesSliderAttackSquare(state, piece, square, orthogonalDirections);
    case 'queen':
      return doesSliderAttackSquare(state, piece, square, [
        ...diagonalDirections,
        ...orthogonalDirections,
      ]);
    case 'king':
      return doesLeaperAttackSquare(state, piece, square, kingOffsets);
    default:
      return false;
  }
}

function doesPawnAttackSquare(piece: PieceInstance, square: Coordinate): boolean {
  const direction = piece.owner === 'black' ? -1 : 1;
  return [-1, 1].some((fileOffset) =>
    sameCoordinate(offsetCoordinate(piece.position, fileOffset, direction), square),
  );
}

function doesLeaperAttackSquare(
  state: GameState,
  piece: PieceInstance,
  square: Coordinate,
  offsets: readonly (readonly [number, number])[],
): boolean {
  return offsets
    .map(([fileOffset, rankOffset]) => offsetCoordinate(piece.position, fileOffset, rankOffset))
    .filter((target) => isCoordinateInsideBoard(target, state.board))
    .some((target) => sameCoordinate(target, square));
}

function doesSliderAttackSquare(
  state: GameState,
  piece: PieceInstance,
  square: Coordinate,
  directions: readonly (readonly [number, number])[],
): boolean {
  for (const [fileOffset, rankOffset] of directions) {
    let target = offsetCoordinate(piece.position, fileOffset, rankOffset);

    while (isCoordinateInsideBoard(target, state.board)) {
      if (sameCoordinate(target, square)) {
        return true;
      }

      if (findPieceAt(state.pieces, target) !== undefined) {
        break;
      }

      target = offsetCoordinate(target, fileOffset, rankOffset);
    }
  }

  return false;
}

function getOpposingPlayer(state: GameState, playerId: PlayerId): PlayerId {
  if (playerId === 'white') {
    return 'black';
  }

  if (playerId === 'black') {
    return 'white';
  }

  const opponent = state.pieces.find((piece) => piece.owner !== playerId)?.owner;
  if (opponent === undefined) {
    throw new ValidationError(`Cannot evaluate check without an opponent for player: ${playerId}`);
  }

  return opponent;
}
