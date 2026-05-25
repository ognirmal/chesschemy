import { sameCoordinate } from '../core/coordinates.js';
import type {
  CastlingRights,
  CastlingSide,
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
  StandardChessState,
} from '../core/types.js';
import { findPieceAt } from '../movement/boardQueries.js';
import { isSquareAttacked } from './attackDetection.js';

interface CastlingLayout {
  readonly homeRank: number;
  readonly kingFrom: Coordinate;
  readonly kingTo: Coordinate;
  readonly rookFrom: Coordinate;
  readonly rookTo: Coordinate;
  readonly emptySquares: readonly Coordinate[];
  readonly safeSquares: readonly Coordinate[];
}

export function generateCastlingMoves(
  state: GameState,
  playerId: PlayerId,
): readonly PseudoLegalMove[] {
  const rights = state.standard?.castlingRights[playerId];
  if (rights === undefined || (!rights.kingSide && !rights.queenSide)) {
    return [];
  }

  const king = findHomeKing(state, playerId);
  if (king === undefined) {
    return [];
  }

  return (['kingSide', 'queenSide'] as const)
    .filter((side) => rights[side])
    .flatMap((side) => createCastlingMoveIfLegal(state, playerId, king, side));
}

export function updateCastlingRights(
  state: GameState,
  movingPiece: PieceInstance,
  capturedPiece: PieceInstance | undefined,
): StandardChessState | undefined {
  if (state.standard === undefined) {
    return undefined;
  }

  const castlingRights = { ...state.standard.castlingRights };

  for (const owner of Object.keys(castlingRights)) {
    const rights = castlingRights[owner] ?? { kingSide: false, queenSide: false };
    castlingRights[owner] = { ...rights };
  }

  clearMovedPieceRights(castlingRights, movingPiece);

  if (capturedPiece !== undefined) {
    clearCapturedRookRights(castlingRights, capturedPiece);
  }

  return { ...state.standard, castlingRights };
}

export function getCastlingRookMove(
  state: GameState,
  playerId: PlayerId,
  side: CastlingSide,
): { readonly rookFrom: Coordinate; readonly rookTo: Coordinate } | undefined {
  const layout = getCastlingLayout(state, playerId, side);
  if (layout === undefined) {
    return undefined;
  }

  return {
    rookFrom: layout.rookFrom,
    rookTo: layout.rookTo,
  };
}

function createCastlingMoveIfLegal(
  state: GameState,
  playerId: PlayerId,
  king: PieceInstance,
  side: CastlingSide,
): readonly PseudoLegalMove[] {
  const layout = getCastlingLayout(state, playerId, side);
  const opponent = getOpposingPlayer(state, playerId);

  if (layout === undefined || !sameCoordinate(king.position, layout.kingFrom)) {
    return [];
  }

  const rook = findPieceAt(state.pieces, layout.rookFrom);
  if (rook?.owner !== playerId || rook.definitionId !== 'rook') {
    return [];
  }

  if (layout.emptySquares.some((square) => findPieceAt(state.pieces, square) !== undefined)) {
    return [];
  }

  if (layout.safeSquares.some((square) => isSquareAttacked(state, square, opponent))) {
    return [];
  }

  return [
    {
      kind: 'move',
      pieceId: king.id,
      from: king.position,
      to: layout.kingTo,
      castleSide: side,
    },
  ];
}

function findHomeKing(state: GameState, playerId: PlayerId): PieceInstance | undefined {
  const homeRank = getHomeRank(playerId);
  if (homeRank === undefined) {
    return undefined;
  }

  return state.pieces.find(
    (piece) =>
      piece.owner === playerId &&
      piece.definitionId === 'king' &&
      sameCoordinate(piece.position, { file: 5, rank: homeRank }),
  );
}

function getCastlingLayout(
  state: GameState,
  playerId: PlayerId,
  side: CastlingSide,
): CastlingLayout | undefined {
  if (state.board.files !== 8 || state.board.ranks !== 8) {
    return undefined;
  }

  const homeRank = getHomeRank(playerId);
  if (homeRank === undefined) {
    return undefined;
  }

  if (side === 'kingSide') {
    return {
      homeRank,
      kingFrom: { file: 5, rank: homeRank },
      kingTo: { file: 7, rank: homeRank },
      rookFrom: { file: 8, rank: homeRank },
      rookTo: { file: 6, rank: homeRank },
      emptySquares: [
        { file: 6, rank: homeRank },
        { file: 7, rank: homeRank },
      ],
      safeSquares: [
        { file: 5, rank: homeRank },
        { file: 6, rank: homeRank },
        { file: 7, rank: homeRank },
      ],
    };
  }

  return {
    homeRank,
    kingFrom: { file: 5, rank: homeRank },
    kingTo: { file: 3, rank: homeRank },
    rookFrom: { file: 1, rank: homeRank },
    rookTo: { file: 4, rank: homeRank },
    emptySquares: [
      { file: 2, rank: homeRank },
      { file: 3, rank: homeRank },
      { file: 4, rank: homeRank },
    ],
    safeSquares: [
      { file: 5, rank: homeRank },
      { file: 4, rank: homeRank },
      { file: 3, rank: homeRank },
    ],
  };
}

function clearMovedPieceRights(
  castlingRights: Record<string, CastlingRights>,
  movingPiece: PieceInstance,
): void {
  if (movingPiece.definitionId === 'king') {
    castlingRights[movingPiece.owner] = { kingSide: false, queenSide: false };
    return;
  }

  if (movingPiece.definitionId !== 'rook') {
    return;
  }

  const side = getRookStartingSide(movingPiece);
  if (side === undefined) {
    return;
  }

  castlingRights[movingPiece.owner] = {
    ...(castlingRights[movingPiece.owner] ?? { kingSide: false, queenSide: false }),
    [side]: false,
  };
}

function clearCapturedRookRights(
  castlingRights: Record<string, CastlingRights>,
  capturedPiece: PieceInstance,
): void {
  if (capturedPiece.definitionId !== 'rook') {
    return;
  }

  const side = getRookStartingSide(capturedPiece);
  if (side === undefined) {
    return;
  }

  castlingRights[capturedPiece.owner] = {
    ...(castlingRights[capturedPiece.owner] ?? { kingSide: false, queenSide: false }),
    [side]: false,
  };
}

function getRookStartingSide(piece: PieceInstance): CastlingSide | undefined {
  const homeRank = getHomeRank(piece.owner);
  if (homeRank === undefined || piece.position.rank !== homeRank) {
    return undefined;
  }

  if (piece.position.file === 8) {
    return 'kingSide';
  }

  if (piece.position.file === 1) {
    return 'queenSide';
  }

  return undefined;
}

function getHomeRank(playerId: PlayerId): number | undefined {
  if (playerId === 'white') {
    return 1;
  }

  if (playerId === 'black') {
    return 8;
  }

  return undefined;
}

function getOpposingPlayer(state: GameState, playerId: PlayerId): PlayerId {
  if (playerId === 'white') {
    return 'black';
  }

  if (playerId === 'black') {
    return 'white';
  }

  return state.pieces.find((piece) => piece.owner !== playerId)?.owner ?? playerId;
}
