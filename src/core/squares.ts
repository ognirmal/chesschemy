import type { Coordinate } from './types.js';

export type AlgebraicSquare = string;
export type SquareInput = Coordinate | AlgebraicSquare;

export function parseSquare(square: AlgebraicSquare): Coordinate {
  const match = /^([a-z]+)([1-9][0-9]*)$/u.exec(square.toLowerCase());

  if (match === null) {
    throw new Error(`Invalid square: ${square}`);
  }

  const [, fileLabel, rankLabel] = match;
  if (fileLabel === undefined || rankLabel === undefined) {
    throw new Error(`Invalid square: ${square}`);
  }

  return {
    file: fileLabelToNumber(fileLabel),
    rank: Number(rankLabel),
  };
}

export function formatSquare(coordinate: Coordinate): AlgebraicSquare {
  if (
    !Number.isInteger(coordinate.file) ||
    !Number.isInteger(coordinate.rank) ||
    coordinate.file < 1 ||
    coordinate.rank < 1
  ) {
    throw new Error(`Invalid coordinate: ${String(coordinate.file)},${String(coordinate.rank)}`);
  }

  return `${numberToFileLabel(coordinate.file)}${String(coordinate.rank)}`;
}

export function toCoordinate(input: SquareInput): Coordinate {
  return typeof input === 'string' ? parseSquare(input) : input;
}

function fileLabelToNumber(label: string): number {
  let file = 0;

  for (let index = 0; index < label.length; index += 1) {
    file = file * 26 + label.charCodeAt(index) - 96;
  }

  return file;
}

function numberToFileLabel(file: number): string {
  let remaining = file;
  let label = '';

  while (remaining > 0) {
    remaining -= 1;
    label = String.fromCharCode(97 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26);
  }

  return label;
}
