import type { PieceInstance } from '../core/types.js';

export interface PieceStatus {
  readonly id: string;
  readonly duration?: number;
  readonly data?: Readonly<Record<string, unknown>>;
}

interface PieceStateWithStatuses {
  readonly statuses?: readonly PieceStatus[];
}

export function getPieceStatuses(piece: PieceInstance): readonly PieceStatus[] {
  if (isStatusImmunePiece(piece)) {
    return [];
  }

  const statuses = (piece.state as PieceStateWithStatuses | undefined)?.statuses;
  if (!Array.isArray(statuses)) {
    return [];
  }

  return statuses.filter(isPieceStatus);
}

export function getPieceStatus(piece: PieceInstance, statusId: string): PieceStatus | undefined {
  return getPieceStatuses(piece).find((status) => status.id === statusId);
}

export function hasPieceStatus(piece: PieceInstance, statusId: string): boolean {
  return getPieceStatus(piece, statusId) !== undefined;
}

export function withAddedPieceStatus(piece: PieceInstance, status: PieceStatus): PieceInstance {
  if (isStatusImmunePiece(piece)) {
    return piece;
  }

  const statuses = getPieceStatuses(piece).filter((candidate) => candidate.id !== status.id);
  return withPieceStatuses(piece, [...statuses, status]);
}

export function withRemovedPieceStatus(piece: PieceInstance, statusId: string): PieceInstance {
  return withPieceStatuses(
    piece,
    getPieceStatuses(piece).filter((status) => status.id !== statusId),
  );
}

export function tickPieceStatuses(piece: PieceInstance): PieceInstance {
  const statuses = getPieceStatuses(piece);
  if (statuses.length === 0) {
    return piece;
  }

  const nextStatuses = statuses.flatMap((status) => {
    if (status.duration === undefined) {
      return [status];
    }

    const nextDuration = status.duration - 1;
    return nextDuration > 0 ? [{ ...status, duration: nextDuration }] : [];
  });

  return withPieceStatuses(piece, nextStatuses);
}

export function getAbilityCooldownStatusId(abilityId: string): string {
  return `cooldown:${abilityId}`;
}

export function hasAbilityCooldown(piece: PieceInstance, abilityId: string): boolean {
  return hasPieceStatus(piece, getAbilityCooldownStatusId(abilityId));
}

function isStatusImmunePiece(piece: PieceInstance): boolean {
  return piece.definitionId === 'king';
}

function withPieceStatuses(piece: PieceInstance, statuses: readonly PieceStatus[]): PieceInstance {
  const stateWithoutStatuses = Object.fromEntries(
    Object.entries(piece.state ?? {}).filter(([key]) => key !== 'statuses'),
  );

  const nextState =
    statuses.length === 0 ? stateWithoutStatuses : { ...stateWithoutStatuses, statuses };

  if (Object.keys(nextState).length === 0) {
    const { state: _state, ...pieceWithoutState } = piece;
    void _state;
    return pieceWithoutState;
  }

  return { ...piece, state: nextState };
}

function isPieceStatus(value: unknown): value is PieceStatus {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { readonly id?: unknown; readonly duration?: unknown };
  return (
    typeof candidate.id === 'string' &&
    (candidate.duration === undefined ||
      (typeof candidate.duration === 'number' &&
        Number.isInteger(candidate.duration) &&
        candidate.duration > 0))
  );
}
