import type {
  AbilityDefinition,
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import {
  definePiece,
  teleportSourceToTarget,
  updateTargetPieceState,
  useAbility,
  validateAbility,
} from '../../src/index.js';

describe('useAbility', () => {
  it('returns structured validation failures before resolving effects', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 2, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const passive = {
      id: 'aura',
      kind: 'passive',
      displayName: 'Aura',
      effects: [],
    } as AbilityDefinition;
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink, passive],
    });
    const state = gameState(
      [
        piece('white-wizard', 'wizard', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wizard],
    );

    expect(
      validateAbility(
        { ...state, status: { kind: 'draw', reason: 'test' } },
        {
          pieceId: 'white-wizard',
          abilityId: 'blink',
        },
      ),
    ).toEqual({
      valid: false,
      reason: 'Cannot use an ability after the game has ended.',
    });
    expect(validateAbility(state, { pieceId: 'missing', abilityId: 'blink' })).toEqual({
      valid: false,
      reason: 'Unknown piece: missing',
    });
    expect(validateAbility(state, { pieceId: 'black-king', abilityId: 'blink' })).toEqual({
      valid: false,
      reason: 'Piece black-king does not belong to the active player.',
    });
    expect(
      validateAbility(
        gameState([
          piece('white-mystery', 'mystery', 'white', { file: 4, rank: 4 }),
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        { pieceId: 'white-mystery', abilityId: 'blink' },
      ),
    ).toEqual({
      valid: false,
      reason: 'Unknown piece definition: mystery',
    });
    expect(validateAbility(state, { pieceId: 'white-wizard', abilityId: 'missing' })).toEqual({
      valid: false,
      reason: 'Piece white-wizard does not have ability: missing',
    });
    expect(validateAbility(state, { pieceId: 'white-wizard', abilityId: 'aura' })).toEqual({
      valid: false,
      reason: 'Ability aura is not active.',
    });
  });

  it('uses active abilities and advances the turn by default', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 2, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = gameState(
      [
        piece('white-wizard', 'wizard', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wizard],
    );

    const nextState = useAbility(state, {
      pieceId: 'white-wizard',
      abilityId: 'blink',
      target: { file: 6, rank: 5 },
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-wizard')?.position).toEqual(
      { file: 6, rank: 5 },
    );
    expect(nextState.turn.activePlayer).toBe('black');
    expect(nextState.history).toEqual([
      {
        kind: 'ability',
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 6, rank: 5 },
      },
    ]);
  });

  it('rejects ability targets that fail target rules', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 2, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = gameState(
      [
        piece('white-wizard', 'wizard', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wizard],
    );

    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 7, rank: 5 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Target is out of range for ability blink.',
    });
  });

  it('rejects ability targets for missing, board, occupancy, and custom validation failures', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: {
        required: true,
        range: 3,
        occupancy: 'friendly',
        validate: ({ target }) => target?.file !== 2,
      },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = gameState(
      [
        piece('white-wizard', 'wizard', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('white-pawn', 'pawn', 'white', { file: 2, rank: 4 }),
        piece('black-pawn', 'pawn', 'black', { file: 5, rank: 4 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wizard],
    );

    expect(validateAbility(state, { pieceId: 'white-wizard', abilityId: 'blink' })).toEqual({
      valid: false,
      reason: 'Ability blink requires a target.',
    });
    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 9, rank: 4 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Target is outside the board: 9,4',
    });
    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 4, rank: 4 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Ability blink cannot target its source square.',
    });
    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 5, rank: 4 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Target does not satisfy friendly occupancy for ability blink.',
    });
    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 2, rank: 4 },
      }),
    ).toEqual({
      valid: false,
      reason: 'Target is invalid for ability blink.',
    });
  });

  it('rejects abilities when canActivate returns false', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      effects: [teleportSourceToTarget()],
      canActivate: () => false,
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = gameState(
      [
        piece('white-wizard', 'wizard', 'white', { file: 4, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [wizard],
    );

    expect(validateAbility(state, { pieceId: 'white-wizard', abilityId: 'blink' })).toEqual({
      valid: false,
      reason: 'Ability blink cannot be activated.',
    });
  });

  it('applies target piece state effects', () => {
    const freeze: AbilityDefinition = {
      id: 'freeze',
      kind: 'active',
      displayName: 'Freeze',
      target: { range: 3, occupancy: 'enemy' },
      effects: [updateTargetPieceState({ frozen: true })],
    };
    const mage = definePiece({
      id: 'mage',
      displayName: 'Mage',
      abilities: [freeze],
    });
    const state = gameState(
      [
        piece('white-mage', 'mage', 'white', { file: 4, rank: 4 }),
        piece('black-pawn', 'pawn', 'black', { file: 6, rank: 4 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [mage],
    );

    const nextState = useAbility(state, {
      pieceId: 'white-mage',
      abilityId: 'freeze',
      target: { file: 6, rank: 4 },
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'black-pawn')?.state).toEqual({
      frozen: true,
    });
  });

  it('rejects active abilities that leave the acting king in check', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 2, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = selfCheckState([wizard]);

    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 6, rank: 2 },
      }),
    ).toEqual({
      valid: false,
      reason: "Ability blink would leave white's king in check.",
    });

    expect(() => {
      useAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'blink',
        target: { file: 6, rank: 2 },
      });
    }).toThrow("Ability blink would leave white's king in check.");
  });

  it('allows active abilities to leave self-check when explicitly opted out', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      allowsSelfCheck: true,
      target: { range: 2, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = selfCheckState([wizard]);

    const nextState = useAbility(state, {
      pieceId: 'white-wizard',
      abilityId: 'blink',
      target: { file: 6, rank: 2 },
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-wizard')?.position).toEqual(
      { file: 6, rank: 2 },
    );
    expect(nextState.turn.activePlayer).toBe('black');
  });

  it('applies self-check legality to non-turn-consuming abilities', () => {
    const sidestep: AbilityDefinition = {
      id: 'sidestep',
      kind: 'active',
      displayName: 'Sidestep',
      consumesTurn: false,
      target: { range: 2, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [sidestep],
    });
    const state = selfCheckState([wizard]);

    expect(
      validateAbility(state, {
        pieceId: 'white-wizard',
        abilityId: 'sidestep',
        target: { file: 6, rank: 2 },
      }),
    ).toEqual({
      valid: false,
      reason: "Ability sidestep would leave white's king in check.",
    });
  });

  it('advances turns between custom player ids', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [blink],
    });
    const state = {
      ...gameState(
        [
          piece('alpha-wizard', 'wizard', 'alpha', { file: 4, rank: 4 }),
          piece('alpha-king', 'king', 'alpha', { file: 1, rank: 1 }),
          piece('beta-king', 'king', 'beta', { file: 8, rank: 8 }),
        ],
        [wizard],
        'alpha',
      ),
      standard: {
        castlingRights: {
          alpha: { kingSide: false, queenSide: false },
          beta: { kingSide: false, queenSide: false },
        },
      },
    };

    const nextState = useAbility(state, {
      pieceId: 'alpha-wizard',
      abilityId: 'blink',
      target: { file: 5, rank: 4 },
    });

    expect(nextState.turn.activePlayer).toBe('beta');
    expect(nextState.turn.fullMove).toBe(1);
  });
});

function selfCheckState(pieceDefinitions: GameState['pieceDefinitions']): GameState {
  return gameState(
    [
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-wizard', 'wizard', 'white', { file: 5, rank: 2 }),
      piece('black-rook', 'rook', 'black', { file: 5, rank: 8 }),
      piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
    ],
    pieceDefinitions,
  );
}

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
      id: 'ability-test',
      version: '0.2.0',
      displayName: 'Ability Test',
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
