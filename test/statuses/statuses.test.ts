import type {
  AbilityDefinition,
  Coordinate,
  GameState,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import {
  addTargetStatus,
  definePiece,
  generateLegalMoves,
  getPieceStatus,
  hasAbilityCooldown,
  hasPieceStatus,
  makeMove,
  setSourceAbilityCooldown,
  useAbility,
  validateAbility,
  withAddedPieceStatus,
} from '../../src/index.js';

describe('statuses', () => {
  it('blocks movement while frozen and expires after the frozen player ends a turn', () => {
    const freeze: AbilityDefinition = {
      id: 'freeze',
      kind: 'active',
      displayName: 'Freeze',
      target: { range: 4, occupancy: 'enemy' },
      effects: [addTargetStatus({ id: 'frozen', duration: 1 })],
    };
    const mage = definePiece({
      id: 'mage',
      displayName: 'Mage',
      abilities: [freeze],
    });
    const state = gameState(
      [
        piece('white-mage', 'mage', 'white', { file: 2, rank: 2 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-rook', 'rook', 'black', { file: 4, rank: 4 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [mage],
    );

    const frozenState = useAbility(state, {
      pieceId: 'white-mage',
      abilityId: 'freeze',
      target: { file: 4, rank: 4 },
    });

    const frozenRook = frozenState.pieces.find((candidate) => candidate.id === 'black-rook');
    expect(frozenRook === undefined ? false : hasPieceStatus(frozenRook, 'frozen')).toBe(true);
    expect(
      generateLegalMoves(frozenState, { playerId: 'black' }).filter(
        (move) => move.pieceId === 'black-rook',
      ),
    ).toEqual([]);

    const thawedState = makeMove(frozenState, {
      pieceId: 'black-king',
      to: { file: 8, rank: 7 },
    });
    const thawedRook = thawedState.pieces.find((candidate) => candidate.id === 'black-rook');

    expect(thawedRook === undefined ? true : hasPieceStatus(thawedRook, 'frozen')).toBe(false);
    expect(
      generateLegalMoves(thawedState, { playerId: 'black' }).some(
        (move) => move.pieceId === 'black-rook',
      ),
    ).toBe(true);
  });

  it('supports cooldown statuses in ability predicates', () => {
    const blink: AbilityDefinition = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      consumesTurn: false,
      effects: [setSourceAbilityCooldown('blink', 1)],
      canActivate: ({ source }) => !hasAbilityCooldown(source, 'blink'),
    };
    const mage = definePiece({
      id: 'mage',
      displayName: 'Mage',
      abilities: [blink],
    });
    const state = gameState(
      [
        piece('white-mage', 'mage', 'white', { file: 2, rank: 2 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [mage],
    );

    const nextState = useAbility(state, {
      pieceId: 'white-mage',
      abilityId: 'blink',
    });
    const mageAfterBlink = nextState.pieces.find((candidate) => candidate.id === 'white-mage');

    expect(
      mageAfterBlink === undefined ? undefined : getPieceStatus(mageAfterBlink, 'cooldown:blink'),
    ).toEqual({ id: 'cooldown:blink', duration: 1 });
    expect(
      validateAbility(nextState, {
        pieceId: 'white-mage',
        abilityId: 'blink',
      }),
    ).toEqual({
      valid: false,
      reason: 'Ability blink cannot be activated.',
    });
  });

  it('does not add statuses to kings', () => {
    const king = piece('white-king', 'king', 'white', { file: 1, rank: 1 });
    const nextKing = withAddedPieceStatus(king, { id: 'frozen', duration: 1 });

    expect(nextKing).toBe(king);
    expect(hasPieceStatus(nextKing, 'frozen')).toBe(false);
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
      id: 'status-test',
      version: '0.2.0',
      displayName: 'Status Test',
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
