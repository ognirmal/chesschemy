import * as chesschemy from '../../src/index.js';

describe('public exports', () => {
  it('does not expose internal engine helpers from the package root', () => {
    expect(chesschemy).not.toHaveProperty('applyMove');
    expect(chesschemy).not.toHaveProperty('getMoveEvents');
    expect(chesschemy).not.toHaveProperty('resolveTriggeredAbilities');
    expect(chesschemy).not.toHaveProperty('generatePseudoLegalMoves');
    expect(chesschemy).not.toHaveProperty('generatePseudoLegalMovesForPiece');
    expect(chesschemy).not.toHaveProperty('generateCastlingMoves');
    expect(chesschemy).not.toHaveProperty('updateCastlingRights');
    expect(chesschemy).not.toHaveProperty('getCastlingRookMove');
    expect(chesschemy).not.toHaveProperty('findPieceAt');
    expect(chesschemy).not.toHaveProperty('offsetCoordinate');
    expect(chesschemy).not.toHaveProperty('isTargetAvailable');
  });
});
