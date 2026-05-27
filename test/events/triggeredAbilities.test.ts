import type {
  AbilityDefinition,
  Coordinate,
  GameEvent,
  GameState,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import {
  definePiece,
  makeMove,
  teleportSourceToTarget,
  updateTargetPieceState,
} from '../../src/index.js';

describe('triggered abilities', () => {
  it('resolves triggered abilities from captured pieces', () => {
    const vengeance: AbilityDefinition = {
      id: 'vengeance',
      kind: 'triggered',
      displayName: 'Vengeance',
      target: { range: 0, includeSelf: true, occupancy: 'enemy' },
      shouldTrigger: ({ event, source }) =>
        event?.kind === 'piece:captured' && event.piece.id === source.id,
      resolveTarget: ({ event }) => (event?.kind === 'piece:captured' ? event.at : undefined),
      effects: [updateTargetPieceState({ frozen: true })],
    };
    const spirit = definePiece({
      id: 'spirit',
      displayName: 'Spirit',
      abilities: [vengeance],
    });
    const state = gameState(
      [
        piece('white-spirit', 'spirit', 'white', { file: 4, rank: 4 }),
        piece('black-rook', 'rook', 'black', { file: 4, rank: 5 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [spirit],
      'black',
    );

    const nextState = makeMove(state, {
      pieceId: 'black-rook',
      to: { file: 4, rank: 4 },
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-spirit')).toBeUndefined();
    expect(nextState.pieces.find((candidate) => candidate.id === 'black-rook')?.state).toEqual({
      frozen: true,
    });
  });

  it('passes event context to triggered abilities', () => {
    const seenEvents: GameEvent['kind'][] = [];
    const watcher = definePiece({
      id: 'watcher',
      displayName: 'Watcher',
      abilities: [
        {
          id: 'watch-turn',
          kind: 'triggered',
          displayName: 'Watch Turn',
          shouldTrigger: ({ event }) => {
            if (event !== undefined) {
              seenEvents.push(event.kind);
            }

            return false;
          },
          effects: [],
        },
      ],
    });
    const state = gameState(
      [
        piece('white-watcher', 'watcher', 'white', { file: 2, rank: 2 }),
        piece('white-king', 'king', 'white', { file: 1, rank: 1 }),
        piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
      ],
      [watcher],
    );

    makeMove(state, {
      pieceId: 'white-king',
      to: { file: 1, rank: 2 },
    });

    expect(seenEvents).toEqual(['action:accepted', 'piece:moved', 'turn:ended']);
  });

  it('rejects triggered abilities that leave their own king in check', () => {
    const sidestep: AbilityDefinition = {
      id: 'sidestep',
      kind: 'triggered',
      displayName: 'Sidestep',
      target: { range: 2, occupancy: 'empty' },
      shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
      resolveTarget: () => ({ file: 6, rank: 2 }),
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [sidestep],
    });
    const state = selfCheckTriggerState([wizard]);

    expect(() => {
      makeMove(state, {
        pieceId: 'white-knight',
        to: { file: 2, rank: 3 },
      });
    }).toThrow("Triggered ability sidestep would leave white's king in check.");
  });

  it('validates triggered ability targets before applying effects', () => {
    const cases: readonly {
      readonly ability: AbilityDefinition;
      readonly reason: string;
    }[] = [
      {
        ability: {
          id: 'missing-target',
          kind: 'triggered',
          displayName: 'Missing Target',
          target: { required: true },
          shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
          effects: [],
        },
        reason: 'Triggered ability missing-target requires a target.',
      },
      {
        ability: {
          id: 'outside-board',
          kind: 'triggered',
          displayName: 'Outside Board',
          shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
          resolveTarget: () => ({ file: 9, rank: 4 }),
          effects: [],
        },
        reason: 'Target is outside the board: 9,4',
      },
      {
        ability: {
          id: 'source-square',
          kind: 'triggered',
          displayName: 'Source Square',
          target: {},
          shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
          resolveTarget: ({ source }) => source.position,
          effects: [],
        },
        reason: 'Triggered ability source-square cannot target its source square.',
      },
      {
        ability: {
          id: 'range-fail',
          kind: 'triggered',
          displayName: 'Range Fail',
          target: { range: 1 },
          shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
          resolveTarget: () => ({ file: 8, rank: 4 }),
          effects: [],
        },
        reason: 'Target is out of range for triggered ability range-fail.',
      },
      {
        ability: {
          id: 'occupancy-fail',
          kind: 'triggered',
          displayName: 'Occupancy Fail',
          target: { occupancy: 'enemy' },
          shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
          resolveTarget: () => ({ file: 3, rank: 4 }),
          effects: [],
        },
        reason: 'Target does not satisfy enemy occupancy for triggered ability occupancy-fail.',
      },
      {
        ability: {
          id: 'validator-fail',
          kind: 'triggered',
          displayName: 'Validator Fail',
          target: { validate: () => false },
          shouldTrigger: ({ event }) => event?.kind === 'action:accepted',
          resolveTarget: () => ({ file: 3, rank: 4 }),
          effects: [],
        },
        reason: 'Target is invalid for triggered ability validator-fail.',
      },
    ];

    for (const { ability, reason } of cases) {
      const watcher = definePiece({
        id: 'watcher',
        displayName: 'Watcher',
        abilities: [ability],
      });
      const state = gameState(
        [
          piece('white-watcher', 'watcher', 'white', { file: 4, rank: 4 }),
          piece('white-knight', 'knight', 'white', { file: 1, rank: 1 }),
          piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
          piece('black-king', 'king', 'black', { file: 8, rank: 8 }),
        ],
        [watcher],
      );

      expect(() => {
        makeMove(state, {
          pieceId: 'white-knight',
          to: { file: 2, rank: 3 },
        });
      }).toThrow(reason);
    }
  });

  it('supports canActivate triggers and explicit self-check opt out', () => {
    const sidestep: AbilityDefinition = {
      id: 'sidestep',
      kind: 'triggered',
      displayName: 'Sidestep',
      allowsSelfCheck: true,
      target: { range: 2, occupancy: 'empty' },
      canActivate: ({ event }) => event?.kind === 'action:accepted',
      resolveTarget: () => ({ file: 6, rank: 2 }),
      effects: [teleportSourceToTarget()],
    };
    const wizard = definePiece({
      id: 'wizard',
      displayName: 'Wizard',
      abilities: [sidestep],
    });
    const state = selfCheckTriggerState([wizard]);

    const nextState = makeMove(state, {
      pieceId: 'white-knight',
      to: { file: 2, rank: 3 },
    });

    expect(nextState.pieces.find((candidate) => candidate.id === 'white-wizard')?.position).toEqual(
      { file: 6, rank: 2 },
    );
  });
});

function selfCheckTriggerState(pieceDefinitions: GameState['pieceDefinitions']): GameState {
  return gameState(
    [
      piece('white-king', 'king', 'white', { file: 5, rank: 1 }),
      piece('white-wizard', 'wizard', 'white', { file: 5, rank: 2 }),
      piece('white-knight', 'knight', 'white', { file: 1, rank: 1 }),
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
      id: 'trigger-test',
      version: '0.2.0',
      displayName: 'Trigger Test',
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
