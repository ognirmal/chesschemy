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
  PieceRegistry,
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

  it('does not generate custom piece captures against kings', () => {
    const laser = definePiece({
      id: 'laser',
      displayName: 'Laser',
      movements: [slider({ directions: 'orthogonal' })],
    });
    const state = gameState(
      [
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-laser', 'laser', 'white', { file: 5, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
      ],
      [laser],
    );

    const moves = generateLegalMoves(state).filter((move) => move.pieceId === 'white-laser');

    expect(moves.some((move) => move.capturePieceId === 'black-king')).toBe(false);
    expect(moveTargets(moves)).not.toContain('5,8');
    expect(isKingInCheck(state, 'black')).toBe(true);
  });

  it('supports base piece movement helpers and default guards', () => {
    class PatternTester extends BasePiece {
      public readonly id = 'pattern-tester';
      public readonly displayName = 'Pattern Tester';

      public override generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
        return [
          ...this.step(context, 'orthogonal'),
          ...this.leap(context, [
            [2, 0],
            [-2, 0],
          ]),
          ...this.slide(context, [[1, 1]]),
        ];
      }
    }

    const tester = new PatternTester();
    const state = createGame({
      initialState: gameState([
        piece('white-tester', 'pattern-tester', 'white', { file: 4, rank: 4 }),
        piece('white-blocker', 'pawn', 'white', { file: 4, rank: 6 }),
        piece('black-target', 'pawn', 'black', { file: 6, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ]),
      pieceDefinitions: [tester],
    });
    const testerPiece = state.pieces.find((candidate) => candidate.id === 'white-tester');

    if (testerPiece === undefined) {
      throw new Error('Expected tester piece.');
    }

    expect(tester.canMovePiece({ state, piece: testerPiece })).toBe(true);
    expect(tester.canCapturePiece({ state, piece: testerPiece })).toBe(true);
    expect(
      moveTargets(generateLegalMoves(state).filter((move) => move.pieceId === 'white-tester')),
    ).toEqual(['2,4', '3,4', '4,3', '4,5', '5,4', '5,5', '6,4', '6,6', '7,7']);
  });

  it('supports definePiece behavior callbacks and base piece defaults', () => {
    const blink: GameState['pieceDefinitions'] = [];
    const scout = definePiece({
      id: 'scout',
      displayName: 'Scout',
      canMove: false,
      canCapture: false,
      getAbilities: () => blink.flatMap((definition) => definition.abilities ?? []),
      generateMoves: () => [{ to: { file: 5, rank: 4 } }],
      canMovePiece: () => false,
      canCapturePiece: () => false,
    });
    class Wazir extends BasePiece {
      public readonly id = 'wazir-class';
      public readonly displayName = 'Wazir Class';
      public override readonly movements = [stepper({ directions: 'orthogonal' })];
    }
    const wazir = new Wazir();
    const state = gameState([
      piece('white-scout', 'scout', 'white', { file: 4, rank: 4 }),
      piece('white-wazir', 'wazir-class', 'white', { file: 6, rank: 4 }),
      piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);
    const scoutPiece = state.pieces.find((candidate) => candidate.id === 'white-scout');
    const wazirPiece = state.pieces.find((candidate) => candidate.id === 'white-wazir');

    if (scoutPiece === undefined || wazirPiece === undefined) {
      throw new Error('Expected test pieces.');
    }

    expect(scout.canMove).toBe(false);
    expect(scout.canCapture).toBe(false);
    expect(scout.generateMoves?.({ state, piece: scoutPiece })).toEqual([
      { to: { file: 5, rank: 4 } },
    ]);
    expect(scout.getAbilities?.({ state, piece: scoutPiece })).toEqual([]);
    expect(scout.canMovePiece?.({ state, piece: scoutPiece })).toBe(false);
    expect(scout.canCapturePiece?.({ state, piece: scoutPiece })).toBe(false);
    expect(wazir.generateMoves({ state, piece: wazirPiece }).map((move) => move.to)).toEqual([
      { file: 7, rank: 4 },
      { file: 5, rank: 4 },
      { file: 6, rank: 5 },
      { file: 6, rank: 3 },
    ]);
    expect(wazir.getAbilities({ state, piece: wazirPiece })).toEqual([]);
  });

  it('registers and lists piece definitions', () => {
    const registry = new PieceRegistry();
    const wazir = definePiece({ id: 'wazir', displayName: 'Wazir' });

    registry.register(wazir);

    expect(registry.get('wazir')).toBe(wazir);
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.list()).toEqual([wazir]);
    expect(() => {
      registry.register(wazir);
    }).toThrow('Piece definition already registered: wazir');
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
