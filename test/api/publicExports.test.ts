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
    expect(chesschemy).toHaveProperty('createGame');
    expect(chesschemy).toHaveProperty('createVariantGame');
    expect(chesschemy).toHaveProperty('definePiece');
    expect(chesschemy).toHaveProperty('stepper');
    expect(chesschemy).toHaveProperty('teleportSourceToTarget');
    expect(chesschemy).toHaveProperty('addTargetStatus');
    expect(chesschemy).toHaveProperty('useAbility');
    expect(chesschemy).toHaveProperty('validateAbility');
    expect(chesschemy).toHaveProperty('getPieceAt');
    expect(chesschemy).toHaveProperty('makeMove');
    expect(chesschemy).toHaveProperty('validateMove');
    expect(chesschemy).toHaveProperty('serializeGameState');
    expect(chesschemy).toHaveProperty('validateGameState');
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

  it('declares package subpath exports for every public domain barrel', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      exports: Record<string, Record<string, string>>;
    };

    expect(packageJson.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
      require: './dist/index.cjs',
    });

    for (const domain of domainExports) {
      expect(packageJson.exports[`./${domain}`]).toEqual({
        types: `./dist/${domain}/index.d.ts`,
        import: `./dist/${domain}/index.js`,
        require: `./dist/${domain}/index.cjs`,
      });
    }
  });
});
