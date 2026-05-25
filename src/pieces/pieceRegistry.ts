import { ValidationError } from '../core/errors.js';
import type { PieceDefinition } from './pieceDefinition.js';

export class PieceRegistry {
  readonly #definitions = new Map<string, PieceDefinition>();

  public register(definition: PieceDefinition): void {
    if (this.#definitions.has(definition.id)) {
      throw new ValidationError(`Piece definition already registered: ${definition.id}`);
    }

    this.#definitions.set(definition.id, definition);
  }

  public get(definitionId: string): PieceDefinition | undefined {
    return this.#definitions.get(definitionId);
  }

  public list(): readonly PieceDefinition[] {
    return [...this.#definitions.values()];
  }
}
