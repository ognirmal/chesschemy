import { sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import { formatSquare } from '../core/squares.js';
import type { GameState, PieceInstance, PseudoLegalMove } from '../core/types.js';
import { applyMove } from './applyMove.js';
import { getGameOutcome } from './gameOutcome.js';
import { isKingInCheck } from './attackDetection.js';
import { generateLegalMoves } from './legalMoveGeneration.js';

const sanPieceLetters: Readonly<Record<string, string>> = {
  bishop: 'B',
  king: 'K',
  knight: 'N',
  queen: 'Q',
  rook: 'R',
};

const promotionByLetter: Readonly<Record<string, string>> = {
  B: 'bishop',
  N: 'knight',
  Q: 'queen',
  R: 'rook',
};

export function moveSan(state: GameState, san: string): PseudoLegalMove {
  const normalizedSan = normalizeSan(san);
  const matches = generateLegalMoves(state).filter(
    (move) => normalizeSan(formatSanBody(state, move)) === normalizedSan,
  );

  if (matches.length === 1 && matches[0] !== undefined) {
    return matches[0];
  }

  if (matches.length > 1) {
    throw new ValidationError(`SAN move is ambiguous: ${san}`);
  }

  throw new ValidationError(`SAN move is not legal: ${san}`);
}

export function formatSan(state: GameState, move: PseudoLegalMove): string {
  return withCheckSuffix(state, move, formatSanBody(state, move));
}

function formatSanBody(state: GameState, move: PseudoLegalMove): string {
  const piece = findMovingPiece(state, move);

  if (move.castleSide === 'kingSide') {
    return 'O-O';
  }

  if (move.castleSide === 'queenSide') {
    return 'O-O-O';
  }

  const pieceLetter = sanPieceLetters[piece.definitionId] ?? '';
  const capture = isCapture(state, move);
  const disambiguation =
    piece.definitionId === 'pawn'
      ? capture
        ? formatSquare(move.from)[0]
        : ''
      : getDisambiguation(state, move, piece, pieceLetter);
  const promotion =
    move.promotionDefinitionId === undefined
      ? ''
      : `=${sanPieceLetters[move.promotionDefinitionId] ?? ''}`;
  const destination = formatSquare(move.to);
  const captureMarker = capture ? 'x' : '';
  return [pieceLetter, disambiguation, captureMarker, destination, promotion].join('');
}

export function parseSanMoveInput(state: GameState, san: string): PseudoLegalMove {
  const normalizedSan = normalizeSan(san);

  if (isCoordinateMove(normalizedSan)) {
    return parseCoordinateMoveInput(state, normalizedSan);
  }

  return moveSan(state, normalizedSan);
}

function parseCoordinateMoveInput(state: GameState, input: string): PseudoLegalMove {
  const from = input.slice(0, 2);
  const to = input.slice(2, 4);
  const promotionLetter = input.slice(4).toUpperCase();
  const promotionDefinitionId =
    promotionLetter.length === 0 ? undefined : promotionByLetter[promotionLetter];

  if (promotionLetter.length > 0 && promotionDefinitionId === undefined) {
    throw new ValidationError(`Invalid promotion piece: ${promotionLetter}`);
  }

  const matches = generateLegalMoves(state).filter(
    (move) =>
      formatSquare(move.from) === from &&
      formatSquare(move.to) === to &&
      optionalValueMatches(move.promotionDefinitionId, promotionDefinitionId),
  );

  if (matches.length === 1 && matches[0] !== undefined) {
    return matches[0];
  }

  throw new ValidationError(`Coordinate move is not legal: ${input}`);
}

function findMovingPiece(state: GameState, move: PseudoLegalMove): PieceInstance {
  const piece = state.pieces.find((candidate) => candidate.id === move.pieceId);

  if (piece === undefined) {
    throw new ValidationError(`Cannot format SAN for unknown piece: ${move.pieceId}`);
  }

  return piece;
}

function isCapture(state: GameState, move: PseudoLegalMove): boolean {
  return (
    move.enPassantCaptureSquare !== undefined ||
    state.pieces.some((piece) => sameCoordinate(piece.position, move.to))
  );
}

function getDisambiguation(
  state: GameState,
  move: PseudoLegalMove,
  piece: PieceInstance,
  pieceLetter: string,
): string {
  const competingMoves = generateLegalMoves(state).filter((candidate) => {
    if (candidate.pieceId === move.pieceId || !sameCoordinate(candidate.to, move.to)) {
      return false;
    }

    const candidatePiece = state.pieces.find((other) => other.id === candidate.pieceId);
    return (
      candidatePiece?.owner === piece.owner &&
      sanPieceLetters[candidatePiece.definitionId] === pieceLetter
    );
  });

  if (competingMoves.length === 0) {
    return '';
  }

  const needsFile = competingMoves.some((candidate) => candidate.from.file !== move.from.file);
  const needsRank = competingMoves.some((candidate) => candidate.from.rank !== move.from.rank);

  if (needsFile) {
    return formatSquare(move.from)[0] ?? '';
  }

  if (needsRank) {
    return String(move.from.rank);
  }

  return formatSquare(move.from);
}

function withCheckSuffix(state: GameState, move: PseudoLegalMove, san: string): string {
  const nextState = applyMove(state, move);
  const outcome = getGameOutcome(nextState);

  if (outcome.kind === 'checkmate') {
    return `${san}#`;
  }

  return outcome.kind === 'active' && isKingInCheck(nextState, nextState.turn.activePlayer)
    ? `${san}+`
    : san;
}

function normalizeSan(san: string): string {
  return san
    .trim()
    .replace(/^0-0-0/u, 'O-O-O')
    .replace(/^0-0/u, 'O-O')
    .replace(/[+#]$/u, '');
}

function isCoordinateMove(input: string): boolean {
  return /^[a-h][1-8][a-h][1-8][bnqrBNQR]?$/u.test(input);
}

function optionalValueMatches<TValue>(
  moveValue: TValue | undefined,
  inputValue: TValue | undefined,
): boolean {
  return inputValue === undefined ? moveValue === undefined : moveValue === inputValue;
}
