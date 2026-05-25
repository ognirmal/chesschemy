import type { PieceDefinition } from './pieceDefinition.js';

export const standardPieces: readonly PieceDefinition[] = [
  { id: 'king', displayName: 'King', canMove: true, canCapture: true, movements: [] },
  { id: 'queen', displayName: 'Queen', canMove: true, canCapture: true, movements: [] },
  { id: 'rook', displayName: 'Rook', canMove: true, canCapture: true, movements: [] },
  { id: 'bishop', displayName: 'Bishop', canMove: true, canCapture: true, movements: [] },
  { id: 'knight', displayName: 'Knight', canMove: true, canCapture: true, movements: [] },
  { id: 'pawn', displayName: 'Pawn', canMove: true, canCapture: true, movements: [] },
];
