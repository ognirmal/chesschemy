import { isCoordinateInsideBoard, sameCoordinate } from '../core/coordinates.js';
import { ValidationError } from '../core/errors.js';
import type {
  AbilityAction,
  Coordinate,
  GameState,
  GameStatus,
  PieceInstance,
  PlayerId,
} from '../core/types.js';
import type { GameEvent } from '../events/gameEvent.js';
import { resolveTriggeredAbilities } from '../events/resolveTriggeredAbilities.js';
import { findPieceAt } from '../movement/boardQueries.js';
import type { PieceDefinition } from '../pieces/pieceDefinition.js';
import { getGameOutcome } from '../rules/gameOutcome.js';
import type { AbilityContext, AbilityDefinition, AbilityTargetRules } from './abilityDefinition.js';

export interface AbilityInput {
  readonly pieceId: string;
  readonly abilityId: string;
  readonly target?: Coordinate;
}

export type AbilityValidationResult =
  | { readonly valid: true; readonly action: AbilityAction; readonly ability: AbilityDefinition }
  | { readonly valid: false; readonly reason: string };

export function validateAbility(state: GameState, input: AbilityInput): AbilityValidationResult {
  if (state.status.kind !== 'active') {
    return {
      valid: false,
      reason: 'Cannot use an ability after the game has ended.',
    };
  }

  const source = state.pieces.find((piece) => piece.id === input.pieceId);
  if (source === undefined) {
    return {
      valid: false,
      reason: `Unknown piece: ${input.pieceId}`,
    };
  }

  if (source.owner !== state.turn.activePlayer) {
    return {
      valid: false,
      reason: `Piece ${input.pieceId} does not belong to the active player.`,
    };
  }

  const definition = getPieceDefinition(state, source.definitionId);
  if (definition === undefined) {
    return {
      valid: false,
      reason: `Unknown piece definition: ${source.definitionId}`,
    };
  }

  const ability = getPieceAbilities(definition, { state, source }).find(
    (candidate) => candidate.id === input.abilityId,
  );
  if (ability === undefined) {
    return {
      valid: false,
      reason: `Piece ${input.pieceId} does not have ability: ${input.abilityId}`,
    };
  }

  if (ability.kind !== 'active') {
    return {
      valid: false,
      reason: `Ability ${input.abilityId} is not active.`,
    };
  }

  const targetValidation = validateTarget(state, source, ability, input.target);
  if (!targetValidation.valid) {
    return targetValidation;
  }

  const action = toAbilityAction(input);
  const context = {
    state,
    source,
    ability,
    action,
    ...(input.target === undefined ? {} : { target: input.target }),
  };
  if (ability.canActivate?.(context) === false) {
    return {
      valid: false,
      reason: `Ability ${input.abilityId} cannot be activated.`,
    };
  }

  return { valid: true, action, ability };
}

export function useAbility(state: GameState, input: AbilityInput): GameState {
  const validation = validateAbility(state, input);

  if (!validation.valid) {
    throw new ValidationError(validation.reason);
  }

  const source = state.pieces.find((piece) => piece.id === validation.action.pieceId);
  if (source === undefined) {
    throw new ValidationError(
      `Cannot use ability from unknown piece: ${validation.action.pieceId}`,
    );
  }

  const baseContext = {
    state,
    source,
    ability: validation.ability,
    action: validation.action,
    ...(validation.action.target === undefined ? {} : { target: validation.action.target }),
  };

  const effectedState = validation.ability.effects.reduce(
    (nextState, effect) => effect.apply({ ...baseContext, state: nextState }),
    state,
  );

  const nextPlayer = getNextPlayer(effectedState, source.owner);
  const nextState = {
    ...effectedState,
    turn:
      validation.ability.consumesTurn === false
        ? effectedState.turn
        : {
            activePlayer: nextPlayer,
            fullMove:
              source.owner === 'black'
                ? effectedState.turn.fullMove + 1
                : effectedState.turn.fullMove,
            halfMoveClock: effectedState.turn.halfMoveClock + 1,
          },
    history: [...effectedState.history, validation.action],
  };

  return withUpdatedStatus(
    resolveTriggeredAbilities(
      nextState,
      getAbilityEvents(
        validation.action,
        source.owner,
        nextPlayer,
        validation.ability.consumesTurn !== false,
      ),
    ),
  );
}

function getPieceAbilities(
  definition: PieceDefinition,
  context: { readonly state: GameState; readonly source: PieceInstance },
): readonly AbilityDefinition[] {
  const behaviorContext = { state: context.state, piece: context.source };
  return definition.getAbilities?.(behaviorContext) ?? definition.abilities ?? [];
}

function validateTarget(
  state: GameState,
  source: PieceInstance,
  ability: AbilityDefinition,
  target: Coordinate | undefined,
): { readonly valid: true } | { readonly valid: false; readonly reason: string } {
  const rules = ability.target;

  if (target === undefined) {
    if (rules?.required === false || rules === undefined) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Ability ${ability.id} requires a target.`,
    };
  }

  if (!isCoordinateInsideBoard(target, state.board)) {
    return {
      valid: false,
      reason: `Target is outside the board: ${targetKey(target)}`,
    };
  }

  if (rules === undefined) {
    return { valid: true };
  }

  if (rules.includeSelf !== true && sameCoordinate(source.position, target)) {
    return {
      valid: false,
      reason: `Ability ${ability.id} cannot target its source square.`,
    };
  }

  if (rules.range !== undefined && getDistance(source.position, target, rules) > rules.range) {
    return {
      valid: false,
      reason: `Target is out of range for ability ${ability.id}.`,
    };
  }

  const targetPiece = findPieceAt(state.pieces, target);
  const occupancy = rules.occupancy ?? 'any';
  if (!doesOccupancyMatch(occupancy, source, targetPiece)) {
    return {
      valid: false,
      reason: `Target does not satisfy ${occupancy} occupancy for ability ${ability.id}.`,
    };
  }

  const action = toAbilityAction({
    pieceId: source.id,
    abilityId: ability.id,
    target,
  });
  const context: AbilityContext = { state, source, ability, action, target };
  if (rules.validate?.(context) === false) {
    return {
      valid: false,
      reason: `Target is invalid for ability ${ability.id}.`,
    };
  }

  return { valid: true };
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

function toAbilityAction(input: AbilityInput): AbilityAction {
  return {
    kind: 'ability',
    pieceId: input.pieceId,
    abilityId: input.abilityId,
    ...(input.target === undefined ? {} : { target: input.target }),
  };
}

function getAbilityEvents(
  action: AbilityAction,
  previousPlayer: PlayerId,
  nextPlayer: PlayerId,
  didEndTurn: boolean,
): readonly GameEvent[] {
  const events: GameEvent[] = [
    { kind: 'action:accepted', action },
    { kind: 'ability:used', action },
  ];

  if (didEndTurn) {
    events.push({ kind: 'turn:ended', previousPlayer, nextPlayer });
  }

  return events;
}

function withUpdatedStatus(state: GameState): GameState {
  return {
    ...state,
    status: getStatusFromOutcome(state),
  };
}

function getStatusFromOutcome(state: GameState): GameStatus {
  const outcome = getGameOutcome(state);

  switch (outcome.kind) {
    case 'active':
      return { kind: 'active' };
    case 'checkmate':
      return {
        kind: 'won',
        winner: outcome.winner,
        reason: 'checkmate',
      };
    case 'stalemate':
      return {
        kind: 'draw',
        reason: 'stalemate',
      };
  }
}

function getNextPlayer(state: GameState, currentPlayer: PlayerId): PlayerId {
  if (currentPlayer === 'white') {
    return 'black';
  }

  if (currentPlayer === 'black') {
    return 'white';
  }

  const players = [...new Set(state.pieces.map((piece) => piece.owner))].sort();
  return players.find((player) => player !== currentPlayer) ?? currentPlayer;
}

function getPieceDefinition(state: GameState, definitionId: string): PieceDefinition | undefined {
  return state.pieceDefinitions?.find((definition) => definition.id === definitionId);
}

function targetKey(target: Coordinate): string {
  return `${String(target.file)},${String(target.rank)}`;
}
