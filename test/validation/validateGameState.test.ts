import type {
  AbilityDefinition,
  Coordinate,
  GameState,
  PieceDefinition,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import { definePiece, teleportSourceToTarget, validateGameState } from '../../src/index.js';

describe('validateGameState', () => {
  it('accepts standard piece definitions without explicit custom definitions', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).not.toThrow();
  });

  it('rejects duplicate piece ids', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('white-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Duplicate piece id: white-king.');
  });

  it('rejects pieces that reference unknown definitions', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-mystery', 'mystery', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece white-mystery references unknown definition: mystery.');
  });

  it('rejects duplicate custom piece definition ids', () => {
    const firstWazir = definePiece({ id: 'wazir', displayName: 'Wazir' });
    const secondWazir = definePiece({ id: 'wazir', displayName: 'Wazir Copy' });

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wazir', 'wazir', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [firstWazir, secondWazir],
        ),
      );
    }).toThrow('Duplicate piece definition id: wazir.');
  });

  it('rejects invalid turn metadata', () => {
    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        turn: {
          activePlayer: 'white',
          fullMove: 0,
          halfMoveClock: 0,
        },
      });
    }).toThrow('Turn fullMove must be a positive integer.');

    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        turn: {
          activePlayer: 'white',
          fullMove: 1,
          halfMoveClock: -1,
        },
      });
    }).toThrow('Turn halfMoveClock must be a non-negative integer.');
  });

  it('rejects active players that have no pieces', () => {
    expect(() => {
      validateGameState({
        ...gameState([piece('black-king', 'king', 'black', { file: 8, rank: 8 })]),
        turn: {
          activePlayer: 'white',
          fullMove: 1,
          halfMoveClock: 0,
        },
      });
    }).toThrow('Active player has no pieces: white.');
  });

  it('rejects malformed ability definitions', () => {
    const malformedAbility = {
      id: '',
      kind: 'active',
      displayName: 'Blink',
      effects: [teleportSourceToTarget()],
    } as AbilityDefinition;

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [pieceDefinition({ id: 'wizard', displayName: 'Wizard', abilities: [malformedAbility] })],
        ),
      );
    }).toThrow('Ability on piece definition wizard must have a non-empty id.');
  });

  it('rejects invalid ability target ranges', () => {
    const blink = {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: -1 },
      effects: [teleportSourceToTarget()],
    } as AbilityDefinition;

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [pieceDefinition({ id: 'wizard', displayName: 'Wizard', abilities: [blink] })],
        ),
      );
    }).toThrow(
      'Ability blink on piece definition wizard target range must be a non-negative number.',
    );
  });
});

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
      id: 'validation-test',
      version: '0.3.0',
      displayName: 'Validation Test',
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

function pieceDefinition(definition: PieceDefinition): PieceDefinition {
  return definition;
}
