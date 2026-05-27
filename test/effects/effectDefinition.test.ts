import type {
  AbilityDefinition,
  Coordinate,
  EffectContext,
  GameState,
  PieceDefinition,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import {
  addSourceStatus,
  addTargetStatus,
  removeSourceStatus,
  removeSource,
  removeTargetPiece,
  removeTargetStatus,
  teleportSourceToTarget,
  updateSourceState,
  updateTargetPieceState,
} from '../../src/index.js';

describe('effect definitions', () => {
  it('supports custom effect metadata', () => {
    expect(
      teleportSourceToTarget({
        id: 'blink',
        description: 'Blink to a square.',
      }),
    ).toMatchObject({
      id: 'blink',
      description: 'Blink to a square.',
    });
  });

  it('does not apply source effects to kings', () => {
    const state = gameState([
      piece('white-king', 'king', 'white', { file: 4, rank: 4 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ]);
    const source = state.pieces[0];

    if (source === undefined) {
      throw new Error('Expected source piece.');
    }

    const context = effectContext(state, source, { file: 5, rank: 5 });
    const nextState = [
      teleportSourceToTarget(),
      updateSourceState({ charged: true }),
      addSourceStatus({ id: 'shielded', duration: 1 }),
      removeSource(),
    ].reduce((currentState, effect) => effect.apply({ ...context, state: currentState }), state);

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-king')).toEqual(source);
  });

  it('does not apply target effects to kings', () => {
    const state = gameState(
      [
        piece('white-mage', 'mage', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 6, rank: 4 }),
      ],
      [defineMage()],
    );
    const source = state.pieces.find((candidate) => candidate.id === 'white-mage');

    if (source === undefined) {
      throw new Error('Expected source piece.');
    }

    const context = effectContext(state, source, { file: 6, rank: 4 });
    const nextState = [
      updateTargetPieceState({ frozen: true }),
      addTargetStatus({ id: 'frozen', duration: 1 }),
      removeTargetStatus('royal-guard'),
      removeTargetPiece(),
    ].reduce((currentState, effect) => effect.apply({ ...context, state: currentState }), state);

    expect(nextState.pieces.find((candidate) => candidate.id === 'black-king')).toEqual(
      state.pieces.find((candidate) => candidate.id === 'black-king'),
    );
  });

  it('throws clear errors for missing or invalid targets', () => {
    const state = gameState(
      [
        piece('white-mage', 'mage', 'white', { file: 4, rank: 4 }),
        piece('white-blocker', 'pawn', 'white', { file: 5, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [defineMage()],
    );
    const source = state.pieces.find((candidate) => candidate.id === 'white-mage');

    if (source === undefined) {
      throw new Error('Expected source piece.');
    }

    expect(() => teleportSourceToTarget().apply(effectContext(state, source))).toThrow(
      'Ability test-effect requires a target.',
    );
    expect(() =>
      teleportSourceToTarget().apply(effectContext(state, source, { file: 9, rank: 4 })),
    ).toThrow('Target is outside the board: 9,4');
    expect(() =>
      teleportSourceToTarget().apply(effectContext(state, source, { file: 5, rank: 4 })),
    ).toThrow('Cannot teleport to occupied square: 5,4');
    expect(() =>
      removeTargetPiece().apply(effectContext(state, source, { file: 6, rank: 4 })),
    ).toThrow('No piece exists at target square: 6,4');
    expect(() =>
      updateTargetPieceState({ frozen: true }).apply(
        effectContext(state, source, { file: 6, rank: 4 }),
      ),
    ).toThrow('No piece exists at target square: 6,4');
    expect(() =>
      addTargetStatus({ id: 'frozen', duration: 1 }).apply(
        effectContext(state, source, { file: 6, rank: 4 }),
      ),
    ).toThrow('No piece exists at target square: 6,4');
  });

  it('removes source and target statuses', () => {
    const state = gameState(
      [
        piece(
          'white-mage',
          'mage',
          'white',
          { file: 4, rank: 4 },
          {
            statuses: [{ id: 'charged', duration: 2 }],
          },
        ),
        piece(
          'black-pawn',
          'pawn',
          'black',
          { file: 5, rank: 4 },
          {
            statuses: [{ id: 'frozen', duration: 1 }],
          },
        ),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [defineMage()],
    );
    const source = state.pieces.find((candidate) => candidate.id === 'white-mage');

    if (source === undefined) {
      throw new Error('Expected source piece.');
    }

    const nextState = [removeSourceStatus('charged'), removeTargetStatus('frozen')].reduce(
      (currentState, effect) =>
        effect.apply({ ...effectContext(currentState, source, { file: 5, rank: 4 }) }),
      state,
    );

    expect(
      nextState.pieces.find((candidate) => candidate.id === 'white-mage')?.state,
    ).toBeUndefined();
    expect(
      nextState.pieces.find((candidate) => candidate.id === 'black-pawn')?.state,
    ).toBeUndefined();
  });
});

function effectContext(
  state: GameState,
  source: PieceInstance,
  target?: Coordinate,
): EffectContext {
  const ability: AbilityDefinition = {
    id: 'test-effect',
    kind: 'active',
    displayName: 'Test Effect',
    effects: [],
  };

  return {
    state,
    source,
    ability,
    action: {
      kind: 'ability',
      pieceId: source.id,
      abilityId: ability.id,
      ...(target === undefined ? {} : { target }),
    },
    ...(target === undefined ? {} : { target }),
  };
}

function gameState(
  pieces: readonly PieceInstance[],
  pieceDefinitions: GameState['pieceDefinitions'] = [],
): GameState {
  return {
    board: { files: 8, ranks: 8 },
    pieces,
    pieceDefinitions,
    turn: {
      activePlayer: 'white',
      fullMove: 1,
      halfMoveClock: 0,
    },
    ruleset: {
      id: 'effect-test',
      version: '0.3.0',
      displayName: 'Effect Test',
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

function defineMage(): PieceDefinition {
  return {
    id: 'mage',
    displayName: 'Mage',
    movements: [],
    abilities: [],
  };
}
