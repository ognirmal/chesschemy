import type {
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
  PseudoLegalMove,
} from '../../src/index.js';
import {
  createGame,
  generatePseudoLegalMoves,
  generatePseudoLegalMovesForPiece,
} from '../../src/index.js';

describe('standard pseudo-legal move generation', () => {
  it('generates 20 active-player moves from the standard initial position', () => {
    const moves = generatePseudoLegalMoves(createGame());

    expect(moves).toHaveLength(20);
    expect(moves.every((move) => move.kind === 'move')).toBe(true);
  });

  it('generates pawn single moves, double moves, captures, and promotion candidates', () => {
    const pawn = piece('white-pawn', 'pawn', 'white', { file: 4, rank: 2 });
    const captureTarget = piece('black-target', 'knight', 'black', { file: 5, rank: 3 });
    const state = gameState([pawn, captureTarget]);

    const moves = generatePseudoLegalMovesForPiece(state, pawn);

    expect(moveTargets(moves)).toEqual(['4,3', '4,4', '5,3']);
    expect(moves.find((move) => coordinateKey(move.to) === '5,3')?.capturePieceId).toBe(
      'black-target',
    );

    const promotionPawn = piece('white-promotion-pawn', 'pawn', 'white', { file: 2, rank: 7 });
    const promotionMoves = generatePseudoLegalMovesForPiece(
      gameState([promotionPawn]),
      promotionPawn,
    );

    expect(promotionMoves).toHaveLength(4);
    expect(promotionMoves.map((move) => move.promotionDefinitionId).sort()).toEqual([
      'bishop',
      'knight',
      'queen',
      'rook',
    ]);
  });

  it('does not move pawns through blockers', () => {
    const pawn = piece('white-pawn', 'pawn', 'white', { file: 4, rank: 2 });
    const blocker = piece('white-blocker', 'knight', 'white', { file: 4, rank: 3 });

    expect(generatePseudoLegalMovesForPiece(gameState([pawn, blocker]), pawn)).toEqual([]);
  });

  it('generates knight jumps without including friendly occupied squares', () => {
    const knight = piece('white-knight', 'knight', 'white', { file: 4, rank: 4 });
    const friendly = piece('white-friendly', 'pawn', 'white', { file: 5, rank: 6 });
    const enemy = piece('black-enemy', 'pawn', 'black', { file: 6, rank: 5 });

    const moves = generatePseudoLegalMovesForPiece(gameState([knight, friendly, enemy]), knight);

    expect(moveTargets(moves)).toEqual(['2,3', '2,5', '3,2', '3,6', '5,2', '6,3', '6,5']);
    expect(moves.find((move) => coordinateKey(move.to) === '6,5')?.capturePieceId).toBe(
      'black-enemy',
    );
  });

  it('generates sliding bishop moves until blocked', () => {
    const bishop = piece('white-bishop', 'bishop', 'white', { file: 4, rank: 4 });
    const friendly = piece('white-friendly', 'pawn', 'white', { file: 6, rank: 6 });
    const enemy = piece('black-enemy', 'pawn', 'black', { file: 2, rank: 6 });

    const moves = generatePseudoLegalMovesForPiece(gameState([bishop, friendly, enemy]), bishop);

    expect(moveTargets(moves)).toEqual([
      '1,1',
      '2,2',
      '2,6',
      '3,3',
      '3,5',
      '5,3',
      '5,5',
      '6,2',
      '7,1',
    ]);
    expect(moves.find((move) => coordinateKey(move.to) === '2,6')?.capturePieceId).toBe(
      'black-enemy',
    );
  });

  it('generates rook moves along files and ranks', () => {
    const rook = piece('white-rook', 'rook', 'white', { file: 4, rank: 4 });

    expect(generatePseudoLegalMovesForPiece(gameState([rook]), rook)).toHaveLength(14);
  });

  it('generates queen moves as rook plus bishop movement', () => {
    const queen = piece('white-queen', 'queen', 'white', { file: 4, rank: 4 });

    expect(generatePseudoLegalMovesForPiece(gameState([queen]), queen)).toHaveLength(27);
  });

  it('generates one-square king moves', () => {
    const king = piece('white-king', 'king', 'white', { file: 4, rank: 4 });

    expect(moveTargets(generatePseudoLegalMovesForPiece(gameState([king]), king))).toEqual([
      '3,3',
      '3,4',
      '3,5',
      '4,3',
      '4,5',
      '5,3',
      '5,4',
      '5,5',
    ]);
  });
});

function gameState(pieces: readonly PieceInstance[], activePlayer: PlayerId = 'white'): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    turn: {
      activePlayer,
      fullMove: 1,
      halfMoveClock: 0,
    },
    ruleset: {
      id: 'standard-chess',
      version: '0.1.0',
      displayName: 'Standard Chess',
    },
    history: [],
    status: { kind: 'active' },
  };
}

function piece(
  id: string,
  definitionId: string,
  owner: PlayerId,
  position: Coordinate,
): PieceInstance {
  return {
    id,
    definitionId,
    owner,
    position,
  };
}

function moveTargets(moves: readonly PseudoLegalMove[]): string[] {
  return moves.map((move) => coordinateKey(move.to)).sort();
}

function coordinateKey(coordinate: Coordinate): string {
  return `${String(coordinate.file)},${String(coordinate.rank)}`;
}
