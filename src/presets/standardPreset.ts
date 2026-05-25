import type { GameState, PieceInstance, PlayerId } from '../core/types.js';
import { standardRuleset } from '../rules/standardRuleset.js';

export interface GamePreset {
  readonly id: string;
  readonly displayName: string;
  createInitialState(): GameState;
}

const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as const;

function createStandardPieces(
  owner: PlayerId,
  homeRank: number,
  pawnRank: number,
): PieceInstance[] {
  const majorPieces = backRank.map((definitionId, index) => ({
    id: `${owner}-${definitionId}-${String(index + 1)}`,
    definitionId,
    owner,
    position: { file: index + 1, rank: homeRank },
  }));

  const pawns = Array.from({ length: 8 }, (_, index) => ({
    id: `${owner}-pawn-${String(index + 1)}`,
    definitionId: 'pawn',
    owner,
    position: { file: index + 1, rank: pawnRank },
  }));

  return [...majorPieces, ...pawns];
}

export const standardPreset: GamePreset = {
  id: standardRuleset.id,
  displayName: standardRuleset.displayName,
  createInitialState(): GameState {
    return {
      board: { files: 8, ranks: 8 },
      pieces: [...createStandardPieces('white', 1, 2), ...createStandardPieces('black', 8, 7)],
      turn: {
        activePlayer: 'white',
        fullMove: 1,
        halfMoveClock: 0,
      },
      ruleset: {
        id: standardRuleset.id,
        version: standardRuleset.version,
        displayName: standardRuleset.displayName,
      },
      standard: {
        castlingRights: {
          black: { kingSide: true, queenSide: true },
          white: { kingSide: true, queenSide: true },
        },
      },
      history: [],
      status: { kind: 'active' },
    };
  },
};
