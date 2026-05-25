import { isCoordinateInsideBoard, sameCoordinate } from '../core/coordinates.js';
import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../core/types.js';
import { generateLegalMoves } from '../rules/legalMoveGeneration.js';

export interface PieceQueryOptions {
  readonly playerId?: PlayerId;
}

export function getPieceAt(state: GameState, coordinate: Coordinate): PieceInstance | undefined {
  if (!isCoordinateInsideBoard(coordinate, state.board)) {
    return undefined;
  }

  return state.pieces.find((piece) => sameCoordinate(piece.position, coordinate));
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

export function isOccupied(state: GameState, coordinate: Coordinate): boolean {
  return getPieceAt(state, coordinate) !== undefined;
}

export function isOccupiedByPlayer(
  state: GameState,
  coordinate: Coordinate,
  playerId: PlayerId,
): boolean {
  return getPieceAt(state, coordinate)?.owner === playerId;
}

export function isOccupiedByOpponent(
  state: GameState,
  coordinate: Coordinate,
  playerId: PlayerId = state.turn.activePlayer,
): boolean {
  const piece = getPieceAt(state, coordinate);
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
  coordinate: Coordinate,
): readonly PseudoLegalMove[] {
  const piece = getPieceAt(state, coordinate);
  if (piece === undefined) {
    return [];
  }

  return getLegalMovesForPiece(state, piece.id);
}

export function getLegalDestinationsForPiece(
  state: GameState,
  pieceId: string,
): readonly Coordinate[] {
  return getLegalMovesForPiece(state, pieceId).map((move) => move.to);
}
