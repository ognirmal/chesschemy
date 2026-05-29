import type { Coordinate, GameState, PieceInstance, PlayerId } from '../../src/index.js';
import { formatSan, Game, move, pieceAt, validate } from '../../src/index.js';

describe('SAN and one-string move input', () => {
  it('applies pawn, coordinate, and piece moves from one string', () => {
    let game = Game();

    game = move(game, 'e4');
    expect(pieceAt(game, 'e4')?.id).toBe('white-pawn-5');

    game = move(game, 'e7e5');
    expect(pieceAt(game, 'e5')?.id).toBe('black-pawn-5');

    game = move(game, 'Nf3');
    expect(pieceAt(game, 'f3')?.id).toBe('white-knight-7');
  });

  it('applies captures and castling from SAN', () => {
    let game = Game();

    game = move(game, 'e4');
    game = move(game, 'd5');
    game = move(game, 'exd5');

    expect(pieceAt(game, 'd5')?.id).toBe('white-pawn-5');

    game = Game();
    game = move(game, 'e4');
    game = move(game, 'e5');
    game = move(game, 'Nf3');
    game = move(game, 'Nc6');
    game = move(game, 'Bc4');
    game = move(game, 'Nf6');
    game = move(game, 'O-O');

    expect(pieceAt(game, 'g1')?.definitionId).toBe('king');
    expect(pieceAt(game, 'f1')?.definitionId).toBe('rook');
  }, 10_000);

  it('applies promotion from SAN', () => {
    const game = gameState([
      piece('white-pawn', 'pawn', 'white', { file: 1, rank: 7 }),
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
    ]);

    const nextGame = move(game, 'a8=Q');

    expect(pieceAt(nextGame, 'a8')?.definitionId).toBe('queen');
  });

  it('accepts checkmate suffixes in SAN', () => {
    let game = Game();

    game = move(game, 'f3');
    game = move(game, 'e5');
    game = move(game, 'g4');

    expect(validate(game, 'Qh4#')).toMatchObject({ valid: true });

    game = move(game, 'Qh4#');
    expect(game.status).toEqual({
      kind: 'won',
      winner: 'black',
      reason: 'checkmate',
    });
  });

  it('formats legal moves as SAN', () => {
    const game = Game();
    const validation = validate(game, 'e4');

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    expect(formatSan(game, validation.move)).toBe('e4');
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
    standard: {
      castlingRights: {
        black: { kingSide: false, queenSide: false },
        white: { kingSide: false, queenSide: false },
      },
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
