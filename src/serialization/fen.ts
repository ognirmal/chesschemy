import { ValidationError } from '../core/errors.js';
import type {
  CastlingRights,
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
} from '../core/types.js';
import { validateGameState } from '../validation/validateGameState.js';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const definitionIdToFenPiece = new Map([
  ['king', 'k'],
  ['queen', 'q'],
  ['rook', 'r'],
  ['bishop', 'b'],
  ['knight', 'n'],
  ['pawn', 'p'],
]);

const fenPieceToDefinitionId = new Map(
  [...definitionIdToFenPiece.entries()].map(([definitionId, fenPiece]) => [fenPiece, definitionId]),
);

export function serializeFen(state: GameState): string {
  validateGameState(state);
  validateFenSerializableState(state);

  return [
    serializePiecePlacement(state),
    serializeActiveColor(state.turn.activePlayer),
    serializeCastlingRights(state),
    serializeEnPassantTarget(state.standard?.enPassantTarget),
    String(state.turn.halfMoveClock),
    String(state.turn.fullMove),
  ].join(' ');
}

export function fen(state: GameState): string {
  return serializeFen(state);
}

export function deserializeFen(fen: string): GameState {
  const fields = fen.trim().split(/\s+/u);
  if (fields.length !== 6) {
    throw new ValidationError('FEN must contain exactly 6 fields.');
  }

  const [placement, activeColor, castling, enPassant, halfMoveClock, fullMove] = fields;

  if (
    placement === undefined ||
    activeColor === undefined ||
    castling === undefined ||
    enPassant === undefined ||
    halfMoveClock === undefined ||
    fullMove === undefined
  ) {
    throw new ValidationError('FEN must contain exactly 6 fields.');
  }

  const state: GameState = {
    board: { files: 8, ranks: 8 },
    pieces: deserializePiecePlacement(placement),
    turn: {
      activePlayer: deserializeActiveColor(activeColor),
      halfMoveClock: deserializeClock(halfMoveClock, 'halfmove clock', 0),
      fullMove: deserializeClock(fullMove, 'fullmove number', 1),
    },
    ruleset: {
      id: 'standard-chess',
      version: '0.1.0',
      displayName: 'Standard Chess',
    },
    standard: {
      castlingRights: deserializeCastlingRights(castling),
      ...(enPassant === '-' ? {} : { enPassantTarget: deserializeSquare(enPassant) }),
    },
    history: [],
    status: { kind: 'active' },
  };

  validateGameState(state);
  return state;
}

export function fromFen(value: string): GameState {
  return deserializeFen(value);
}

export { STARTING_FEN };

function validateFenSerializableState(state: GameState): void {
  if (state.board.files !== 8 || state.board.ranks !== 8) {
    throw new ValidationError('FEN serialization only supports 8x8 boards.');
  }

  if (state.status.kind !== 'active') {
    throw new ValidationError('FEN serialization only supports active games.');
  }

  if (state.turn.activePlayer !== 'white' && state.turn.activePlayer !== 'black') {
    throw new ValidationError(
      `FEN serialization does not support player: ${state.turn.activePlayer}.`,
    );
  }

  for (const piece of state.pieces) {
    if (piece.owner !== 'white' && piece.owner !== 'black') {
      throw new ValidationError(`FEN serialization does not support piece owner: ${piece.owner}.`);
    }

    if (!definitionIdToFenPiece.has(piece.definitionId)) {
      throw new ValidationError(
        `FEN serialization does not support piece definition: ${piece.definitionId}.`,
      );
    }
  }
}

function serializePiecePlacement(state: GameState): string {
  const ranks: string[] = [];

  for (let rank = 8; rank >= 1; rank -= 1) {
    let rankText = '';
    let emptyCount = 0;

    for (let file = 1; file <= 8; file += 1) {
      const piece = state.pieces.find(
        (candidate) => candidate.position.file === file && candidate.position.rank === rank,
      );

      if (piece === undefined) {
        emptyCount += 1;
        continue;
      }

      if (emptyCount > 0) {
        rankText += String(emptyCount);
        emptyCount = 0;
      }

      rankText += serializePiece(piece);
    }

    if (emptyCount > 0) {
      rankText += String(emptyCount);
    }

    ranks.push(rankText);
  }

  return ranks.join('/');
}

function serializePiece(piece: PieceInstance): string {
  const fenPiece = definitionIdToFenPiece.get(piece.definitionId);
  if (fenPiece === undefined) {
    throw new ValidationError(
      `FEN serialization does not support piece definition: ${piece.definitionId}.`,
    );
  }

  return piece.owner === 'white' ? fenPiece.toUpperCase() : fenPiece;
}

function serializeActiveColor(activePlayer: PlayerId): string {
  return activePlayer === 'white' ? 'w' : 'b';
}

function serializeCastlingRights(state: GameState): string {
  const rights = state.standard?.castlingRights;
  if (rights === undefined) {
    return '-';
  }

  const text = [
    rights.white?.kingSide === true ? 'K' : '',
    rights.white?.queenSide === true ? 'Q' : '',
    rights.black?.kingSide === true ? 'k' : '',
    rights.black?.queenSide === true ? 'q' : '',
  ].join('');

  return text.length === 0 ? '-' : text;
}

function serializeEnPassantTarget(target: Coordinate | undefined): string {
  return target === undefined ? '-' : serializeSquare(target);
}

function serializeSquare(coordinate: Coordinate): string {
  return `${String.fromCharCode('a'.charCodeAt(0) + coordinate.file - 1)}${String(coordinate.rank)}`;
}

function deserializePiecePlacement(placement: string): readonly PieceInstance[] {
  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    throw new ValidationError('FEN piece placement must contain 8 ranks.');
  }

  const pieces: PieceInstance[] = [];

  ranks.forEach((rankText, rankIndex) => {
    const rank = 8 - rankIndex;
    let file = 1;

    for (const char of rankText) {
      if (/^[1-8]$/u.test(char)) {
        file += Number(char);
        continue;
      }

      const definitionId = fenPieceToDefinitionId.get(char.toLowerCase());
      if (definitionId === undefined) {
        throw new ValidationError(`Invalid FEN piece: ${char}.`);
      }

      if (file > 8) {
        throw new ValidationError(`FEN rank ${String(rank)} contains too many files.`);
      }

      const owner = char === char.toUpperCase() ? 'white' : 'black';
      pieces.push({
        id: `${owner}-${definitionId}-${String(file)}-${String(rank)}`,
        definitionId,
        owner,
        position: { file, rank },
      });
      file += 1;
    }

    if (file !== 9) {
      throw new ValidationError(`FEN rank ${String(rank)} must contain 8 files.`);
    }
  });

  return pieces;
}

function deserializeActiveColor(activeColor: string): PlayerId {
  if (activeColor === 'w') {
    return 'white';
  }

  if (activeColor === 'b') {
    return 'black';
  }

  throw new ValidationError(`Invalid FEN active color: ${activeColor}.`);
}

function deserializeCastlingRights(castling: string): Readonly<Record<PlayerId, CastlingRights>> {
  if (castling === '-') {
    return {
      black: { kingSide: false, queenSide: false },
      white: { kingSide: false, queenSide: false },
    };
  }

  if (!/^(?!.*(.).*\1)[KQkq]+$/u.test(castling)) {
    throw new ValidationError(`Invalid FEN castling rights: ${castling}.`);
  }

  return {
    black: {
      kingSide: castling.includes('k'),
      queenSide: castling.includes('q'),
    },
    white: {
      kingSide: castling.includes('K'),
      queenSide: castling.includes('Q'),
    },
  };
}

function deserializeSquare(square: string): Coordinate {
  if (!/^[a-h][1-8]$/u.test(square)) {
    throw new ValidationError(`Invalid FEN square: ${square}.`);
  }

  return {
    file: square.charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    rank: Number(square[1]),
  };
}

function deserializeClock(value: string, label: string, minimum: number): number {
  if (!/^\d+$/u.test(value)) {
    throw new ValidationError(`Invalid FEN ${label}: ${value}.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new ValidationError(`Invalid FEN ${label}: ${value}.`);
  }

  return parsed;
}
