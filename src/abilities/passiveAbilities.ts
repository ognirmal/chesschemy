import type { GameState, PieceInstance } from '../core/types.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import type { AbilityDefinition } from './abilityDefinition.js';

export function canCaptureTarget(
  state: GameState,
  attacker: PieceInstance,
  targetPiece: PieceInstance,
): boolean {
  return !getPassiveAbilitySources(state).some(({ source, ability }) => {
    const context = {
      state,
      source,
      ability,
      attacker,
      targetPiece,
    };

    return ability.canCapture?.(context) === false;
  });
}

function getPassiveAbilitySources(
  state: GameState,
): readonly { readonly source: PieceInstance; readonly ability: AbilityDefinition }[] {
  return [...state.pieces].sort(comparePiecesByBoardOrder).flatMap((source) =>
    getPassiveAbilities(state, source).map((ability) => ({
      source,
      ability,
    })),
  );
}

function getPassiveAbilities(
  state: GameState,
  source: PieceInstance,
): readonly AbilityDefinition[] {
  const definition = getPieceDefinition(state, source.definitionId);
  if (definition === undefined) {
    return [];
  }

  const behaviorContext = { state, piece: source };
  return (definition.getAbilities?.(behaviorContext) ?? definition.abilities ?? []).filter(
    (ability) => ability.kind === 'passive',
  );
}

function getPieceDefinition(state: GameState, definitionId: string): PieceDefinition | undefined {
  return state.pieceDefinitions?.find((definition) => definition.id === definitionId);
}

function comparePiecesByBoardOrder(left: PieceInstance, right: PieceInstance): number {
  return (
    left.position.rank - right.position.rank ||
    left.position.file - right.position.file ||
    left.id.localeCompare(right.id)
  );
}
