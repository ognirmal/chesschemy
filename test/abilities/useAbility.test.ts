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
