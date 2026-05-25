import { isCoordinateInsideBoard, sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type { AbilityAction, Coordinate, GameState, PieceInstance } from '../core/types.js';
import { findPieceAt } from '../movement/boardQueries.js';
import type { AbilityDefinition, AbilityTargetRules } from '../abilities/abilityDefinition.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import { tickPieceStatuses } from '../statuses/statusDefinition.js';
import type { GameEvent } from './gameEvent.js';

export function resolveTriggeredAbilities(
  state: GameState,
  events: readonly GameEvent[],
): GameState {
  return events.reduce(resolveTriggeredAbilitiesForEvent, state);
}

function resolveTriggeredAbilitiesForEvent(state: GameState, event: GameEvent): GameState {
  const stateAfterTriggers = getTriggerSources(state, event).reduce((nextState, source) => {
    const definition = getPieceDefinition(nextState, source.definitionId);
    if (definition === undefined) {
      return nextState;
    }

    return getTriggeredAbilities(definition, nextState, source).reduce(
      (stateAfterAbility, ability) =>
        shouldResolveAbility(stateAfterAbility, source, ability, event)
          ? applyTriggeredAbility(stateAfterAbility, source, ability, event)
          : stateAfterAbility,
      nextState,
    );
  }, state);

  return event.kind === 'turn:ended'
    ? tickStatusesForPlayer(stateAfterTriggers, event.previousPlayer)
    : stateAfterTriggers;
}

function getTriggerSources(state: GameState, event: GameEvent): readonly PieceInstance[] {
  const candidates =
    event.kind === 'piece:captured' && !state.pieces.some((piece) => piece.id === event.piece.id)
      ? [...state.pieces, event.piece]
      : [...state.pieces];

  return candidates.sort(comparePiecesByBoardOrder);
}

function getTriggeredAbilities(
  definition: PieceDefinition,
  state: GameState,
  source: PieceInstance,
): readonly AbilityDefinition[] {
  const behaviorContext = { state, piece: source };
  return (definition.getAbilities?.(behaviorContext) ?? definition.abilities ?? []).filter(
    (ability) => ability.kind === 'triggered',
  );
}

function shouldResolveAbility(
  state: GameState,
  source: PieceInstance,
  ability: AbilityDefinition,
  event: GameEvent,
): boolean {
  const context = {
    state,
    source,
    ability,
    event,
  };

  if (ability.shouldTrigger !== undefined) {
    return ability.shouldTrigger(context);
  }

  return ability.canActivate?.(context) === true;
}

function applyTriggeredAbility(
  state: GameState,
  source: PieceInstance,
  ability: AbilityDefinition,
  event: GameEvent,
): GameState {
  const target = ability.resolveTarget?.({ state, source, ability, event });
  validateTriggeredTarget(state, source, ability, target);

  const action = toAbilityAction(source, ability, target);
  const baseContext = {
    state,
    source,
    ability,
    action,
    event,
    ...(target === undefined ? {} : { target }),
  };

  return ability.effects.reduce(
    (nextState, effect) => effect.apply({ ...baseContext, state: nextState }),
    state,
  );
}

function validateTriggeredTarget(
  state: GameState,
  source: PieceInstance,
  ability: AbilityDefinition,
  target: Coordinate | undefined,
): void {
  const rules = ability.target;

  if (target === undefined) {
    if (rules !== undefined && rules.required !== false) {
      throw new ValidationError(`Triggered ability ${ability.id} requires a target.`);
    }

    return;
  }

  if (!isCoordinateInsideBoard(target, state.board)) {
    throw new ValidationError(`Target is outside the board: ${targetKey(target)}`);
  }

  if (rules === undefined) {
    return;
  }

  if (rules.includeSelf !== true && sameCoordinate(source.position, target)) {
    throw new ValidationError(`Triggered ability ${ability.id} cannot target its source square.`);
  }

  if (rules.range !== undefined && getDistance(source.position, target, rules) > rules.range) {
    throw new ValidationError(`Target is out of range for triggered ability ${ability.id}.`);
  }

  const targetPiece = findPieceAt(state.pieces, target);
  const occupancy = rules.occupancy ?? 'any';
  if (!doesOccupancyMatch(occupancy, source, targetPiece)) {
    throw new ValidationError(
      `Target does not satisfy ${occupancy} occupancy for triggered ability ${ability.id}.`,
    );
  }

  const action = toAbilityAction(source, ability, target);
  const context = { state, source, ability, action, target };
  if (rules.validate?.(context) === false) {
    throw new ValidationError(`Target is invalid for triggered ability ${ability.id}.`);
  }
}

function doesOccupancyMatch(
  occupancy: NonNullable<AbilityTargetRules['occupancy']>,
  source: PieceInstance,
  targetPiece: PieceInstance | undefined,
): boolean {
  switch (occupancy) {
    case 'any':
      return true;
    case 'empty':
      return targetPiece === undefined;
    case 'occupied':
      return targetPiece !== undefined;
    case 'enemy':
      return targetPiece !== undefined && targetPiece.owner !== source.owner;
    case 'friendly':
      return targetPiece?.owner === source.owner;
  }
}

function getDistance(source: Coordinate, target: Coordinate, rules: AbilityTargetRules): number {
  const fileDistance = Math.abs(target.file - source.file);
  const rankDistance = Math.abs(target.rank - source.rank);

  if (rules.distance === 'manhattan') {
    return fileDistance + rankDistance;
  }

  return Math.max(fileDistance, rankDistance);
}

function toAbilityAction(
  source: PieceInstance,
  ability: AbilityDefinition,
  target: Coordinate | undefined,
): AbilityAction {
  return {
    kind: 'ability',
    pieceId: source.id,
    abilityId: ability.id,
    ...(target === undefined ? {} : { target }),
  };
}

function comparePiecesByBoardOrder(left: PieceInstance, right: PieceInstance): number {
  return (
    left.position.rank - right.position.rank ||
    left.position.file - right.position.file ||
    left.id.localeCompare(right.id)
  );
}

function getPieceDefinition(state: GameState, definitionId: string): PieceDefinition | undefined {
  return state.pieceDefinitions?.find((definition) => definition.id === definitionId);
}

function targetKey(target: Coordinate): string {
  return `${String(target.file)},${String(target.rank)}`;
}

function tickStatusesForPlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    pieces: state.pieces.map((piece) =>
      piece.owner === playerId ? tickPieceStatuses(piece) : piece,
    ),
  };
}
