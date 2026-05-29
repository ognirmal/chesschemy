import { readFileSync } from 'node:fs';

import * as chesschemy from '../../src/index.js';

const domainExports = [
  'abilities',
  'core',
  'effects',
  'events',
  'movement',
  'pieces',
  'presets',
  'queries',
  'rules',
  'serialization',
  'statuses',
  'validation',
] as const;

describe('public exports', () => {
  it('keeps root package imports compatible for public APIs', () => {
    expect(chesschemy).toHaveProperty('Game');
    expect(chesschemy).toHaveProperty('turn');
    expect(chesschemy).toHaveProperty('createVariantGame');
    expect(chesschemy).toHaveProperty('definePiece');
    expect(chesschemy).toHaveProperty('parseSquare');
    expect(chesschemy).toHaveProperty('formatSquare');
    expect(chesschemy).toHaveProperty('stepper');
    expect(chesschemy).toHaveProperty('teleportSourceToTarget');
    expect(chesschemy).toHaveProperty('addTargetStatus');
    expect(chesschemy).toHaveProperty('useAbility');
    expect(chesschemy).toHaveProperty('validateAbility');
    expect(chesschemy).toHaveProperty('pieceAt');
    expect(chesschemy).toHaveProperty('moves');
    expect(chesschemy).toHaveProperty('move');
    expect(chesschemy).toHaveProperty('validate');
    expect(chesschemy).toHaveProperty('formatSan');
    expect(chesschemy).toHaveProperty('moveSan');
    expect(chesschemy).toHaveProperty('isCheck');
    expect(chesschemy).toHaveProperty('result');
    expect(chesschemy).toHaveProperty('fen');
    expect(chesschemy).toHaveProperty('fromFen');
    expect(chesschemy).toHaveProperty('save');
    expect(chesschemy).toHaveProperty('load');
    expect(chesschemy).toHaveProperty('validateGameState');
  });

  it('does not expose verbose aliases from the package root', () => {
    expect(chesschemy).not.toHaveProperty('createGame');
    expect(chesschemy).not.toHaveProperty('getPieceAt');
    expect(chesschemy).not.toHaveProperty('getLegalMovesForSquare');
    expect(chesschemy).not.toHaveProperty('legalMoves');
    expect(chesschemy).not.toHaveProperty('makeMove');
    expect(chesschemy).not.toHaveProperty('validateMove');
    expect(chesschemy).not.toHaveProperty('makeMoveFromSquare');
    expect(chesschemy).not.toHaveProperty('validateMoveFromSquare');
    expect(chesschemy).not.toHaveProperty('isKingInCheck');
    expect(chesschemy).not.toHaveProperty('serializeFen');
    expect(chesschemy).not.toHaveProperty('deserializeFen');
    expect(chesschemy).not.toHaveProperty('serializeGameState');
    expect(chesschemy).not.toHaveProperty('deserializeGameState');
  });

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

  it('declares root and pattern package exports for public domain barrels', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      exports: Record<string, Record<string, string>>;
    };

    expect(packageJson.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
      require: './dist/index.cjs',
    });

    expect(packageJson.exports['./*']).toEqual({
      types: './dist/*/index.d.ts',
      import: './dist/*/index.js',
      require: './dist/*/index.cjs',
    });

    expect(Object.keys(packageJson.exports).sort()).toEqual(['.', './*']);
  });

  it('builds a domain entry for every documented subpath', () => {
    const tsupConfig = readFileSync('tsup.config.ts', 'utf8');

    for (const domain of domainExports) {
      expect(tsupConfig).toContain(`'${domain}'`);
    }
  });
});
