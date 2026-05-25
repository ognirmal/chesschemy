import type {
  Coordinate,
  GameState,
  MoveCandidate,
  PieceBehaviorContext,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import {
  BasePiece,
  createGame,
  definePiece,
  generateLegalMoves,
  isKingInCheck,
  leaper,
  slider,
  stationary,
  stepper,
} from '../../src/index.js';

describe('custom pieces', () => {
  it('supports declarative stepper pieces through definePiece', () => {
    const wazir = definePiece({
      id: 'wazir',
      displayName: 'Wazir',
      movements: [stepper({ directions: 'orthogonal' })],
    });
    const state = gameState(
      [
        piece('white-wazir', 'wazir', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wazir],
    );

    expect(
      moveTargets(generateLegalMoves(state).filter((move) => move.pieceId === 'white-wazir')),
    ).toEqual(['3,4', '4,3', '4,5', '5,4']);
  });

  it('supports stationary custom pieces', () => {
    const tower = definePiece({
      id: 'tower',
      displayName: 'Tower',
      canMove: false,
      movements: [stationary()],
    });
    const state = gameState(
      [
        piece('white-tower', 'tower', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [tower],
    );

    expect(generateLegalMoves(state).filter((move) => move.pieceId === 'white-tower')).toEqual([]);
  });

  it('combines movement primitives for richer declarative pieces', () => {
    const dragon = definePiece({
      id: 'dragon',
      displayName: 'Dragon',
      movements: [slider({ directions: 'orthogonal' }), leaper({ pattern: 'knight' })],
    });
    const state = gameState(
      [
        piece('white-dragon', 'dragon', 'white', { file: 4, rank: 4 }),
        piece('white-blocker', 'pawn', 'white', { file: 4, rank: 6 }),
        piece('black-target', 'pawn', 'black', { file: 6, rank: 5 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [dragon],
    );
    const moves = generateLegalMoves(state).filter((move) => move.pieceId === 'white-dragon');

    expect(moveTargets(moves)).toContain('6,5');
    expect(moves.find((move) => coordinateKey(move.to) === '6,5')?.capturePieceId).toBe(
      'black-target',
    );
    expect(moveTargets(moves)).not.toContain('4,6');
    expect(moveTargets(moves)).not.toContain('4,7');
  });

  it('supports class-based custom pieces with custom movement logic', () => {
    class Archer extends BasePiece {
      public readonly id = 'archer';
      public readonly displayName = 'Archer';

      public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
        return this.leap(context, 'knight');
      }
    }

    const state = createGame({
      initialState: gameState([
        piece('white-archer', 'archer', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ]),
      pieceDefinitions: [new Archer()],
    });

    expect(
      moveTargets(generateLegalMoves(state).filter((move) => move.pieceId === 'white-archer')),
    ).toEqual(['2,3', '2,5', '3,2', '3,6', '5,2', '5,6', '6,3', '6,5']);
  });

  it('supports class-based custom movement guards', () => {
    class FrozenArcher extends BasePiece {
      public readonly id = 'frozen-archer';
      public readonly displayName = 'Frozen Archer';

      public override canMovePiece(context: PieceBehaviorContext): boolean {
        return context.piece.state?.frozen !== true;
      }

      public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
        return this.leap(context, 'knight');
      }
    }

    const state = createGame({
      initialState: gameState([
        piece('white-archer', 'frozen-archer', 'white', { file: 4, rank: 4 }, { frozen: true }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ]),
      pieceDefinitions: [new FrozenArcher()],
    });

    expect(generateLegalMoves(state).filter((move) => move.pieceId === 'white-archer')).toEqual([]);
  });

  it('uses custom pieces when detecting check', () => {
    const laser = definePiece({
      id: 'laser',
      displayName: 'Laser',
      movements: [slider({ directions: 'orthogonal' })],
    });
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
        piece('black-laser', 'laser', 'black', { file: 5, rank: 8 }),
        piece('black-king', 'king', 'black', { file: 1, rank: 8 }),
      ],
      [laser],
    );

    expect(isKingInCheck(state, 'white')).toBe(true);
  });
});

function gameState(
  pieces: readonly PieceInstance[],
  pieceDefinitions: GameState['pieceDefinitions'] = [],
  activePlayer: PlayerId = 'white',
): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    pieceDefinitions,
    turn: {
      activePlayer,
      fullMove: 1,
      halfMoveClock: 0,
    },
    ruleset: {
      id: 'custom-test',
      version: '0.1.0',
      displayName: 'Custom Test',
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
  state?: Record<string, unknown>,
): PieceInstance {
  return {
    id,
    definitionId,
    owner,
    position,
    ...(state === undefined ? {} : { state }),
  };
}

function moveTargets(moves: readonly { readonly to: Coordinate }[]): string[] {
  return moves.map((move) => coordinateKey(move.to)).sort();
}

function coordinateKey(coordinate: Coordinate): string {
  return `${String(coordinate.file)},${String(coordinate.rank)}`;
}
