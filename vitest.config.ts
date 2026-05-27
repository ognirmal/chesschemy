import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/core/types.ts',
        'src/abilities/abilityDefinition.ts',
        'src/events/gameEvent.ts',
        'src/movement/movementPattern.ts',
        'src/rules/ruleset.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 88,
        functions: 90,
        lines: 90,
      },
    },
    globals: true,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
