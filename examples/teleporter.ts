import { useAbility, validateAbility } from 'chesschemy/abilities';
import { createVariantGame } from 'chesschemy/core';
import { teleportSourceToTarget } from 'chesschemy/effects';
import { stepper } from 'chesschemy/movement';
import { definePiece } from 'chesschemy/pieces';
import { getPieceAt } from 'chesschemy/queries';

const teleporter = definePiece({
  id: 'teleporter',
  displayName: 'Teleporter',
  movements: [stepper({ directions: 'orthogonal' })],
  abilities: [
    {
      id: 'blink',
      kind: 'active',
      displayName: 'Blink',
      target: { range: 3, occupancy: 'empty' },
      effects: [teleportSourceToTarget()],
    },
  ],
});

const game = createVariantGame({
  board: { files: 8, ranks: 8 },
  pieces: [
    {
      id: 'white-teleporter',
      definitionId: 'teleporter',
      owner: 'white',
      position: { file: 4, rank: 4 },
    },
    { id: 'white-king', definitionId: 'king', owner: 'white', position: { file: 1, rank: 1 } },
    { id: 'black-king', definitionId: 'king', owner: 'black', position: { file: 8, rank: 8 } },
  ],
  pieceDefinitions: [teleporter],
  ruleset: {
    id: 'teleporter-demo',
    version: '1.0.0',
    displayName: 'Teleporter Demo',
  },
});

const input = {
  pieceId: 'white-teleporter',
  abilityId: 'blink',
  target: { file: 6, rank: 5 },
};

const validation = validateAbility(game, input);
if (!validation.valid) {
  throw new Error(validation.reason);
}

const nextGame = useAbility(game, input);

console.log({
  teleporter: getPieceAt(nextGame, { file: 6, rank: 5 }),
  activePlayer: nextGame.turn.activePlayer,
  history: nextGame.history,
});
