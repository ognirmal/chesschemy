import { isCoordinateInsideBoard, sameCoordinate } from '../core/coordinates.js';
import { formatSquare, toCoordinate } from '../core/squares.js';
import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../core/types.js';
import type { SquareInput } from '../core/squares.js';
import { generateLegalMoves } from '../rules/legalMoveGeneration.js';

export interface PieceQueryOptions {
  readonly playerId?: PlayerId;
}

export function getPieceAt(state: GameState, square: SquareInput): PieceInstance | undefined {
  const coordinate = toOptionalCoordinate(square);

  if (coordinate === undefined) {
    return undefined;
  }

  if (!isCoordinateInsideBoard(coordinate, state.board)) {
    return undefined;
  }

  return state.pieces.find((piece) => sameCoordinate(piece.position, coordinate));
}

export function pieceAt(state: GameState, square: SquareInput): PieceInstance | undefined {
  return getPieceAt(state, square);
}

export function getPieceById(state: GameState, pieceId: string): PieceInstance | undefined {
  return state.pieces.find((piece) => piece.id === pieceId);
}

export function getPiecesForPlayer(state: GameState, playerId: PlayerId): readonly PieceInstance[] {
  return state.pieces.filter((piece) => piece.owner === playerId);
}

export function getActivePlayerPieces(state: GameState): readonly PieceInstance[] {
  return getPiecesForPlayer(state, state.turn.activePlayer);
}

export function isOccupied(state: GameState, square: SquareInput): boolean {
  return getPieceAt(state, square) !== undefined;
}

export function isOccupiedByPlayer(
  state: GameState,
  square: SquareInput,
  playerId: PlayerId,
): boolean {
  return getPieceAt(state, square)?.owner === playerId;
}

export function isOccupiedByOpponent(
  state: GameState,
  square: SquareInput,
  playerId: PlayerId = state.turn.activePlayer,
): boolean {
  const piece = getPieceAt(state, square);
  return piece !== undefined && piece.owner !== playerId;
}

export function getLegalMovesForPiece(
  state: GameState,
  pieceId: string,
): readonly PseudoLegalMove[] {
  return generateLegalMoves(state).filter((move) => move.pieceId === pieceId);
}

export function getLegalMovesForSquare(
  state: GameState,
  square: SquareInput,
): readonly PseudoLegalMove[] {
  const piece = getPieceAt(state, square);
  if (piece === undefined) {
    return [];
  }

  return getLegalMovesForPiece(state, piece.id);
}

export function legalMoves(state: GameState, square: SquareInput): readonly PseudoLegalMove[] {
  return getLegalMovesForSquare(state, square);
}

export function moves(state: GameState, square: SquareInput): readonly string[] {
  return getLegalMovesForSquare(state, square).map((move) => formatSquare(move.to));
}

export function getLegalDestinationsForPiece(
  state: GameState,
  pieceId: string,
): readonly Coordinate[] {
  return getLegalMovesForPiece(state, pieceId).map((move) => move.to);
}

function toOptionalCoordinate(square: SquareInput): Coordinate | undefined {
  try {
    return toCoordinate(square);
  } catch {
    return undefined;
  }
}
