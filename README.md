# Chesschemy Engine

TypeScript-first chess and chess-variant engine package.

The repository is scaffolded for deterministic engine development:

- Strict TypeScript source in `src/`
- Public API exported from `src/index.ts`
- Unit tests with Vitest
- Dual ESM and CommonJS package output
- Generated type declarations
- ESLint and Prettier checks

## Development

```sh
npm install
npm run build
npm test
npm run lint
npm run format
```

## Current Status

This is an initial production scaffold. The public contracts, module boundaries,
and deterministic standard-board setup are present so feature work can grow
without reorganizing the package later.
