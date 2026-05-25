import { coordinateKey, isCoordinateInsideBoard } from '../core/coordinates.js';
import type { BoardDimensions, Coordinate, PieceInstance } from '../core/types.js';

export function findPieceAt(
  pieces: readonly PieceInstance[],
  coordinate: Coordinate,
): PieceInstance | undefined {
  const key = coordinateKey(coordinate);
  return pieces.find((piece) => coordinateKey(piece.position) === key);
}

export function isOccupiedByOwner(
  pieces: readonly PieceInstance[],
  coordinate: Coordinate,
  owner: string,
): boolean {
  return findPieceAt(pieces, coordinate)?.owner === owner;
}

export function offsetCoordinate(
  coordinate: Coordinate,
  fileOffset: number,
  rankOffset: number,
): Coordinate {
  return {
    file: coordinate.file + fileOffset,
    rank: coordinate.rank + rankOffset,
  };
}

export function isTargetAvailable(
  pieces: readonly PieceInstance[],
  coordinate: Coordinate,
  owner: string,
  board: BoardDimensions,
): boolean {
  return (
    isCoordinateInsideBoard(coordinate, board) && !isOccupiedByOwner(pieces, coordinate, owner)
  );
}
