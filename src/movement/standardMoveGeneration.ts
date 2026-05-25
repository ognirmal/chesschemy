import { isCoordinateInsideBoard } from '../core/coordinates.js';
import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../core/types.js';
import { findPieceAt, isTargetAvailable, offsetCoordinate } from './boardQueries.js';

export interface MoveGenerationOptions {
  readonly playerId?: PlayerId;
}

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

const standardPromotionDefinitionIds = ['queen', 'rook', 'bishop', 'knight'] as const;

export function generatePseudoLegalMoves(
  state: GameState,
  options: MoveGenerationOptions = {},
): readonly PseudoLegalMove[] {
  const playerId = options.playerId ?? state.turn.activePlayer;

  return state.pieces
    .filter((piece) => piece.owner === playerId)
    .flatMap((piece) => generatePseudoLegalMovesForPiece(state, piece));
}

export function generatePseudoLegalMovesForPiece(
  state: GameState,
  piece: PieceInstance,
): readonly PseudoLegalMove[] {
  switch (piece.definitionId) {
    case 'pawn':
      return generatePawnMoves(state, piece);
    case 'knight':
      return generateLeaperMoves(state, piece, knightOffsets);
    case 'bishop':
      return generateSlidingMoves(state, piece, diagonalDirections);
    case 'rook':
      return generateSlidingMoves(state, piece, orthogonalDirections);
    case 'queen':
      return generateSlidingMoves(state, piece, [...diagonalDirections, ...orthogonalDirections]);
    case 'king':
      return generateLeaperMoves(state, piece, kingOffsets);
    default:
      return [];
  }
}

function generatePawnMoves(state: GameState, piece: PieceInstance): readonly PseudoLegalMove[] {
  const moves: PseudoLegalMove[] = [];
  const direction = getPawnDirection(piece.owner);
  const startingRank = getPawnStartingRank(piece.owner);
  const promotionRank = getPawnPromotionRank(piece.owner, state.board.ranks);

  const oneStep = offsetCoordinate(piece.position, 0, direction);
  const oneStepPiece = findPieceAt(state.pieces, oneStep);

  if (isCoordinateInsideBoard(oneStep, state.board) && oneStepPiece === undefined) {
    moves.push(...createPawnMoves(piece, oneStep, promotionRank));

    const twoStep = offsetCoordinate(piece.position, 0, direction * 2);
    const twoStepPiece = findPieceAt(state.pieces, twoStep);

    if (
      piece.position.rank === startingRank &&
      isCoordinateInsideBoard(twoStep, state.board) &&
      twoStepPiece === undefined
    ) {
      moves.push(createMove(piece, twoStep));
    }
  }

  for (const fileOffset of [-1, 1]) {
    const target = offsetCoordinate(piece.position, fileOffset, direction);

    if (!isCoordinateInsideBoard(target, state.board)) {
      continue;
    }

    const capturedPiece = findPieceAt(state.pieces, target);
    if (capturedPiece !== undefined && capturedPiece.owner !== piece.owner) {
      moves.push(...createPawnMoves(piece, target, promotionRank, capturedPiece.id));
    }
  }

  return moves;
}

function generateLeaperMoves(
  state: GameState,
  piece: PieceInstance,
  offsets: readonly (readonly [number, number])[],
): readonly PseudoLegalMove[] {
  return offsets
    .map(([fileOffset, rankOffset]) => offsetCoordinate(piece.position, fileOffset, rankOffset))
    .filter((target) => isTargetAvailable(state.pieces, target, piece.owner, state.board))
    .map((target) => createMove(piece, target, findPieceAt(state.pieces, target)?.id));
}

function generateSlidingMoves(
  state: GameState,
  piece: PieceInstance,
  directions: readonly (readonly [number, number])[],
): readonly PseudoLegalMove[] {
  const moves: PseudoLegalMove[] = [];

  for (const [fileOffset, rankOffset] of directions) {
    let target = offsetCoordinate(piece.position, fileOffset, rankOffset);

    while (isCoordinateInsideBoard(target, state.board)) {
      const occupiedPiece = findPieceAt(state.pieces, target);

      if (occupiedPiece === undefined) {
        moves.push(createMove(piece, target));
        target = offsetCoordinate(target, fileOffset, rankOffset);
        continue;
      }

      if (occupiedPiece.owner !== piece.owner) {
        moves.push(createMove(piece, target, occupiedPiece.id));
      }

      break;
    }
  }

  return moves;
}

function createPawnMoves(
  piece: PieceInstance,
  target: Coordinate,
  promotionRank: number,
  capturePieceId?: string,
): readonly PseudoLegalMove[] {
  if (target.rank !== promotionRank) {
    return [createMove(piece, target, capturePieceId)];
  }

  return standardPromotionDefinitionIds.map((promotionDefinitionId) =>
    createMove(piece, target, capturePieceId, promotionDefinitionId),
  );
}

function createMove(
  piece: PieceInstance,
  target: Coordinate,
  capturePieceId?: string,
  promotionDefinitionId?: string,
): PseudoLegalMove {
  return {
    kind: 'move',
    pieceId: piece.id,
    from: piece.position,
    to: target,
    ...(capturePieceId === undefined ? {} : { capturePieceId }),
    ...(promotionDefinitionId === undefined ? {} : { promotionDefinitionId }),
  };
}

function getPawnDirection(owner: PlayerId): number {
  return owner === 'black' ? -1 : 1;
}

function getPawnStartingRank(owner: PlayerId): number {
  return owner === 'black' ? 7 : 2;
}

function getPawnPromotionRank(owner: PlayerId, boardRanks: number): number {
  return owner === 'black' ? 1 : boardRanks;
}
