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

  it('rejects invalid board and piece placement metadata', () => {
    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        board: { files: 0, ranks: 8 },
      });
    }).toThrow('Board dimensions must be positive.');

    expect(() => {
      validateGameState(
        gameState([
          piece('', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece id must be a non-empty string.');

    expect(() => {
      validateGameState(
        gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('white-rook', 'rook', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Multiple pieces occupy 1,1.');
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

  it('rejects malformed custom piece definitions', () => {
    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [pieceDefinition({ id: '', displayName: 'Nameless' })],
        ),
      );
    }).toThrow('Piece definition id must be a non-empty string.');

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [pieceDefinition({ id: 'nameless', displayName: '' })],
        ),
      );
    }).toThrow('Piece definition nameless must have a non-empty displayName.');
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

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 2, rank: 1 }),
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [
            pieceDefinition({
              id: 'wizard',
              displayName: 'Wizard',
              abilities: [
                {
                  id: 'blink',
                  kind: 'spell',
                  displayName: 'Blink',
                  effects: [],
                } as unknown as AbilityDefinition,
              ],
            }),
          ],
        ),
      );
    }).toThrow('Ability blink on piece definition wizard has invalid kind: spell.');

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 2, rank: 1 }),
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [
            pieceDefinition({
              id: 'wizard',
              displayName: 'Wizard',
              abilities: [
                {
                  id: 'blink',
                  kind: 'active',
                  displayName: '',
                  effects: [],
                },
              ],
            }),
          ],
        ),
      );
    }).toThrow('Ability blink on piece definition wizard must have a non-empty displayName.');

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 2, rank: 1 }),
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [
            pieceDefinition({
              id: 'wizard',
              displayName: 'Wizard',
              abilities: [
                {
                  id: 'blink',
                  kind: 'active',
                  displayName: 'Blink',
                  effects: undefined,
                } as unknown as AbilityDefinition,
              ],
            }),
          ],
        ),
      );
    }).toThrow('Ability blink on piece definition wizard must have an effects array.');
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

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-wizard', 'wizard', 'white', { file: 2, rank: 1 }),
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [
            pieceDefinition({
              id: 'wizard',
              displayName: 'Wizard',
              abilities: [
                {
                  id: 'blink',
                  kind: 'active',
                  displayName: 'Blink',
                  allowsSelfCheck: 'yes',
                  effects: [teleportSourceToTarget()],
                } as unknown as AbilityDefinition,
              ],
            }),
          ],
        ),
      );
    }).toThrow('Ability blink on piece definition wizard allowsSelfCheck must be a boolean.');
  });

  it('rejects statuses on kings', () => {
    expect(() => {
      validateGameState(
        gameState([
          {
            ...piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            state: {
              statuses: [{ id: 'frozen', duration: 1 }],
            },
          },
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('King white-king cannot have statuses.');
  });

  it('rejects malformed piece runtime state and statuses', () => {
    const circularState: Record<string, unknown> = {};
    circularState.self = circularState;

    expect(() => {
      validateGameState(
        gameState([
          {
            ...piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            state: [] as unknown as Record<string, unknown>,
          },
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece white-king state must be a JSON object.');

    expect(() => {
      validateGameState(
        gameState([
          { ...piece('white-king', 'king', 'white', { file: 1, rank: 1 }), state: circularState },
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece white-king state.self must not contain circular references.');

    expect(() => {
      validateGameState(
        gameState([
          {
            ...piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            state: { calculate: () => true },
          },
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece white-king state.calculate must be JSON-serializable.');

    expect(() => {
      validateGameState(
        gameState([
          {
            ...piece('white-pawn', 'pawn', 'white', { file: 2, rank: 2 }),
            state: { statuses: 'frozen' },
          },
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece white-pawn statuses must be an array.');

    expect(() => {
      validateGameState(
        gameState([
          {
            ...piece('white-pawn', 'pawn', 'white', { file: 2, rank: 2 }),
            state: { statuses: [{ id: 'frozen', data: [] }] },
          },
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Piece white-pawn status 0 data must be a JSON object.');
  });

  it('rejects missing and duplicate kings for each player', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-rook', 'rook', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Player white must have exactly one king; found 0.');

    expect(() => {
      validateGameState(
        gameState([
          piece('white-king-a', 'king', 'white', { file: 1, rank: 1 }),
          piece('white-king-b', 'king', 'white', { file: 2, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Player white must have exactly one king; found 2.');
  });

  it('rejects one-sided king ownership', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-king-a', 'king', 'white', { file: 1, rank: 1 }),
          piece('white-king-b', 'king', 'white', { file: 8, rank: 8 }),
        ]),
      );
    }).toThrow('Chesschemy requires exactly two players.');
  });

  it('rejects adjacent kings', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-king', 'king', 'white', { file: 4, rank: 4 }),
          piece('black-king', 'king', 'black', { file: 5, rank: 5 }),
        ]),
      );
    }).toThrow('Kings cannot occupy adjacent squares.');
  });

  it('rejects positions where both kings are in check', () => {
    expect(() => {
      validateGameState(
        gameState([
          piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
          piece('white-rook', 'rook', 'white', { file: 1, rank: 8 }),
          piece('black-king', 'king', 'black', { file: 5, rank: 8 }),
          piece('black-rook', 'rook', 'black', { file: 1, rank: 1 }),
        ]),
      );
    }).toThrow('Both kings cannot be in check.');
  });

  it('rejects standard castling rights that do not match the current players', () => {
    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        standard: {
          castlingRights: {
            white: { kingSide: false, queenSide: false },
          },
        },
      });
    }).toThrow('Standard castling rights must match the current players.');
  });

  it('rejects structurally invalid standard castling rights', () => {
    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        standard: {
          castlingRights: undefined,
        },
      } as unknown as GameState);
    }).toThrow('Standard castling rights must be a JSON object.');

    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        standard: {
          castlingRights: {
            black: { kingSide: false, queenSide: false },
            white: { kingSide: 'yes', queenSide: false },
          },
        },
      } as unknown as GameState);
    }).toThrow(
      'Standard castling rights for white must include boolean kingSide and queenSide values.',
    );
  });

  it('rejects standard en passant targets outside the board', () => {
    expect(() => {
      validateGameState({
        ...gameState([
          piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ]),
        standard: {
          castlingRights: {
            black: { kingSide: false, queenSide: false },
            white: { kingSide: false, queenSide: false },
          },
          enPassantTarget: { file: 9, rank: 3 },
        },
      });
    }).toThrow('Standard en passant target must be inside the board.');
  });

  it('accepts custom pieces alongside strict king requirements', () => {
    const wazir = definePiece({ id: 'wazir', displayName: 'Wazir' });

    expect(() => {
      validateGameState(
        gameState(
          [
            piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
            piece('white-wazir', 'wazir', 'white', { file: 4, rank: 4 }),
            piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
          ],
          [wazir],
        ),
      );
    }).not.toThrow();
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
