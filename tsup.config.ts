import { defineConfig } from 'tsup';

const domainEntries = [
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
];

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', ...domainEntries.map((domain) => `src/${domain}/index.ts`)],
  format: ['esm', 'cjs'],
  sourcemap: false,
  splitting: false,
  target: 'es2022',
});
