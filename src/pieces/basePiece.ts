import type { AbilityDefinition } from '../abilities/abilityDefinition.js';
import type {
  DirectionSet,
  MoveCandidate,
  PieceBehaviorContext,
  MovementPattern,
  Offset,
} from '../movement/movementPattern.js';
import { leaper, slider, stepper } from '../movement/movementPrimitives.js';
import type { PieceDefinition } from './pieceDefinition.js';

export abstract class BasePiece implements PieceDefinition {
  public abstract readonly id: string;
  public abstract readonly displayName: string;

  public readonly canMove = true;
  public readonly canCapture = true;
  public readonly movements: readonly MovementPattern[] = [];
  public readonly abilities: readonly AbilityDefinition[] = [];

  public generateMoves(context: PieceBehaviorContext): readonly MoveCandidate[] {
    return this.movements.flatMap((movement) =>
      movement.generateTargets(context).map((target) => ({ to: target })),
    );
  }

  public getAbilities(_context: PieceBehaviorContext): readonly AbilityDefinition[] {
    void _context;
    return this.abilities;
  }

  public canMovePiece(_context: PieceBehaviorContext): boolean {
    void _context;
    return this.canMove;
  }

  public canCapturePiece(_context: PieceBehaviorContext): boolean {
    void _context;
    return this.canCapture;
  }

  protected leap(
    context: PieceBehaviorContext,
    offsetsOrPattern: readonly Offset[] | 'knight',
  ): readonly MoveCandidate[] {
    return leaper(
      offsetsOrPattern === 'knight' ? { pattern: 'knight' } : { offsets: offsetsOrPattern },
    )
      .generateTargets(context)
      .map((to) => ({ to }));
  }

  protected slide(
    context: PieceBehaviorContext,
    directions: DirectionSet | readonly Offset[],
  ): readonly MoveCandidate[] {
    return slider({ directions })
      .generateTargets(context)
      .map((to) => ({ to }));
  }

  protected step(
    context: PieceBehaviorContext,
    directions: DirectionSet | readonly Offset[],
  ): readonly MoveCandidate[] {
    return stepper({ directions })
      .generateTargets(context)
      .map((to) => ({ to }));
  }
}
