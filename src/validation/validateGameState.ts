import { coordinateKey, isCoordinateInsideBoard } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { GameState } from '../core/types.js';

export function validateGameState(state: GameState): void {
  if (state.board.files < 1 || state.board.ranks < 1) {
    throw new ValidationError('Board dimensions must be positive.');
  }

  const occupied = new Set<string>();

  for (const piece of state.pieces) {
    if (!isCoordinateInsideBoard(piece.position, state.board)) {
      throw new ValidationError(`Piece ${piece.id} is outside the board.`);
    }

    const key = coordinateKey(piece.position);
    if (occupied.has(key)) {
      throw new ValidationError(`Multiple pieces occupy ${key}.`);
    }

    occupied.add(key);
  }
}
