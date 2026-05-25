import type {
  AbilityDefinition,
  Coordinate,
  GameEvent,
  GameState,
  PieceInstance,
  PlayerId,
} from '../../src/index.js';
import { definePiece, makeMove, updateTargetPieceState } from '../../src/index.js';

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
