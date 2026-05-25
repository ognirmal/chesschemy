import type { BoardDimensions, Coordinate } from './types.js';

export function coordinateKey(coordinate: Coordinate): string {
  return `${String(coordinate.file)},${String(coordinate.rank)}`;
}

export function isCoordinateInsideBoard(coordinate: Coordinate, board: BoardDimensions): boolean {
  return (
    Number.isInteger(coordinate.file) &&
    Number.isInteger(coordinate.rank) &&
    coordinate.file >= 1 &&
    coordinate.file <= board.files &&
    coordinate.rank >= 1 &&
    coordinate.rank <= board.ranks
  );
}

export function sameCoordinate(left: Coordinate, right: Coordinate): boolean {
  return left.file === right.file && left.rank === right.rank;
}
