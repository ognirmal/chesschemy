export class ChesschemyError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ChesschemyError';
  }
}

export class ValidationError extends ChesschemyError {
  public constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
