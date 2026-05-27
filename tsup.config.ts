import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    'src/index.ts',
    'src/abilities/index.ts',
    'src/core/index.ts',
    'src/effects/index.ts',
    'src/events/index.ts',
    'src/movement/index.ts',
    'src/pieces/index.ts',
    'src/presets/index.ts',
    'src/queries/index.ts',
    'src/rules/index.ts',
    'src/serialization/index.ts',
    'src/statuses/index.ts',
    'src/validation/index.ts',
  ],
  format: ['esm', 'cjs'],
  sourcemap: true,
  splitting: false,
  target: 'es2022',
});
