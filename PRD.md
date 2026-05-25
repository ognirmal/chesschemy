# Chesschemy Product Requirements Document

## Document Status

- Project: `chesschemy`
- Type: Startup-style PRD
- Product Form: TypeScript-first npm package
- Version: Draft v1
- Date: 2026-05-25

## 1. Executive Summary

Chesschemy is a TypeScript npm package that provides a serious, extensible chess-engine architecture built on standard chess rules and expanded for fantasy-style chess variants. Developers use Chesschemy to build web apps, games, experiments, and custom rule systems without having to reimplement board state management, move generation, legality checks, turn resolution, or match logic.

The package starts from normal chess as the default ruleset, then adds a programmable piece-and-ability system. Developers can define new pieces with custom movement and active or passive abilities, including non-moving structures such as towers, pieces with triggered effects, range-based actions, temporary status effects, cooldowns, and conditional behaviors. Chesschemy does not attempt to balance user-created content. It provides the engine primitives required to express and validate them correctly.

The product goal is not to ship a casual toy rules engine. The goal is to become the foundational engine package for developers who want both strict standard chess support and a robust framework for inventing new chess-like systems.

## 2. Product Vision

Give developers a reliable engine core for creating serious chess-based games where standard chess works out of the box, but the rules can evolve far beyond traditional movement patterns.

## 3. Problem Statement

Developers who want to create chess variants or fantasy chess games usually face one of two bad options:

- Use a standard chess library that supports only conventional pieces and rules.
- Build a custom engine from scratch, including legal move resolution, board validation, state transitions, turn control, and rule conflict handling.

Existing tools typically break down when a piece:

- Has abilities beyond movement.
- Applies effects over time.
- Interacts with other pieces through statuses or triggered events.
- Exists as a stationary unit or building.
- Modifies rules dynamically during a match.

This creates high implementation cost, fragile rules, and inconsistent behavior across projects.

## 4. Opportunity

There is a developer niche between standard chess engines and fully generic tactics-game frameworks:

- Developers who want normal chess compatibility.
- Developers who want faster creation of novel board games.
- Developers who want to prototype custom pieces and rules in a browser or app environment.
- Developers who want a package with strong typings, clear extension points, and deterministic game logic.

Chesschemy can occupy that niche by combining:

- Standard chess correctness.
- Variant authoring flexibility.
- TypeScript ergonomics.
- Deterministic simulation suitable for testing and AI integration later.

## 5. Target Users

### Primary User

Developers who enjoy building novel game systems and want to create their own web games, apps, or experiments using a chess-like engine.

### Secondary Users

- Indie game developers building fantasy chess experiences.
- Tool builders creating board-game editors or scenario simulators.
- Researchers or hobbyists exploring game mechanics on top of a chess foundation.

## 6. Product Positioning

Chesschemy is a TypeScript engine package for building chess and chess-derived games with programmable pieces and abilities.

It is not:

- A UI component library.
- A multiplayer server.
- A matchmaking platform.
- A game balancer.
- A full game editor in v1.

## 7. Core Product Principles

### 7.1 Standard Chess First

Normal chess must work as a first-class default mode, not as a degraded compatibility layer.

### 7.2 Extensibility Without Engine Forking

Developers should be able to create new pieces, abilities, triggers, and rule modifiers through public APIs rather than patching engine internals.

### 7.3 Deterministic Rule Resolution

Given the same starting state and input sequence, the engine must always produce the same outcome.

### 7.4 Strong Validation

Illegal states, impossible actions, and conflicting rule definitions should fail early with clear errors.

### 7.5 TypeScript-First Developer Experience

The engine should provide strong typings, documented interfaces, and composable APIs suitable for npm usage in modern frontend or backend TypeScript environments.

### 7.6 Balance Is User Land

Chesschemy enforces validity and consistency, not fairness. Users are responsible for not designing overpowered pieces.

## 8. Goals

### 8.1 Product Goals

- Become a reliable npm engine package for building chess-like games.
- Support standard chess out of the box.
- Support custom movement and programmable abilities.
- Let developers define new pieces without rewriting turn logic or rule validation.
- Provide a foundation that can later support AI, tooling, and ecosystem growth.

### 8.2 Developer Goals

- Create a custom game variant with minimal boilerplate.
- Reuse engine services such as board state, legality checks, status handling, and turn resolution.
- Integrate the engine with a custom UI of their choice.
- Serialize and restore game states predictably.

### 8.3 Non-Goals for v1

- Multiplayer or networking.
- Built-in visual board UI.
- Ranking systems or player accounts.
- Automatic balance analysis.
- Full AI support for arbitrary custom variants.
- Mobile SDK packaging beyond npm consumption.

## 9. Scope

### 9.1 In Scope

- TypeScript npm package.
- Standard chess ruleset.
- Board representation and coordinates.
- Piece registry and piece definitions.
- Move generation and legal move filtering.
- Turn sequencing and action resolution.
- Custom movement patterns.
- Active abilities.
- Passive abilities.
- Triggered effects and event hooks.
- Status effects such as freeze, vanish, cooldown, and similar rule-driven states.
- Stationary or building-type pieces.
- Match state serialization and restoration.
- Validation and error reporting.
- Testable deterministic engine APIs.

### 9.2 Out of Scope

- UI rendering components.
- Online multiplayer synchronization.
- Lobby/server infrastructure.
- Built-in content balancing tools.
- Procedural asset generation.
- Economy, progression, or monetization systems.

## 10. User Stories

- As a developer, I want to start a normal chess game with no custom setup so I can use Chesschemy as a standard engine.
- As a developer, I want to define a custom piece with movement rules so I can create new chess variants.
- As a developer, I want to define an active ability with range and target rules so a piece can do more than move.
- As a developer, I want to define passive or triggered abilities so pieces can react to events.
- As a developer, I want to create a stationary building piece so movement is optional in the piece model.
- As a developer, I want the engine to reject illegal actions and invalid board states.
- As a developer, I want to serialize game state and replay actions deterministically.
- As a developer, I want to plug the engine into my own UI and game flow without using a bundled frontend.

## 11. Functional Requirements

### 11.1 Standard Chess Engine

The package must support:

- Standard 8x8 board setup.
- Standard pieces and movement.
- Turn order.
- Captures.
- Check detection.
- Checkmate and stalemate detection.
- Castling.
- En passant.
- Promotion.
- Draw conditions considered appropriate for initial scope.

Initial recommendation for v1 draw handling:

- Stalemate.
- Insufficient material where detectable.
- Threefold repetition as a stretch goal.
- Fifty-move rule as a stretch goal.

### 11.2 Board and State Model

The engine must expose a structured game state that includes:

- Board dimensions and coordinates.
- Piece instances and ownership.
- Piece definitions and runtime state.
- Active statuses and durations.
- Turn metadata.
- Action history.
- Ruleset metadata.
- Win/loss/draw state when terminal.

### 11.3 Piece Definition System

Developers must be able to define custom pieces using declarative or programmable configuration, including:

- Identifier and display metadata.
- Team ownership.
- Movement capabilities.
- Capture behavior.
- Mobility restrictions.
- Ability hooks.
- Piece-specific internal state.
- Promotion or transformation rules if applicable.
- Whether the piece can move, attack, act, or remain stationary.

### 11.4 Ability System

The engine must support:

- Active abilities invoked explicitly on a turn or phase.
- Passive abilities always in effect.
- Triggered abilities that respond to events.
- Range-based targeting.
- Area-of-effect targeting where relevant.
- Conditional activation requirements.
- Cooldowns and usage limits.
- Delayed or duration-based effects.
- Self-destruct or vanish effects.
- Swap, teleport, freeze, shield, and similar mechanics via generic primitives.

The engine should avoid hardcoding one-off fantasy mechanics where a generic effect model is sufficient.

### 11.5 Event and Trigger Model

The engine must publish internal events that abilities can subscribe to, such as:

- Turn start.
- Turn end.
- Before move.
- After move.
- Before capture.
- After capture.
- Before ability use.
- After ability use.
- Piece added.
- Piece removed.
- Status applied.
- Status expired.
- Check state entered.

### 11.6 Status Effect System

The engine must support temporary or persistent statuses, including examples such as:

- Frozen for N turns.
- Silenced or ability-disabled.
- Shielded from a class of effects.
- Marked for transformation or delayed removal.
- Immobilized but still targetable.

Statuses must be:

- Queryable.
- Serializable.
- Time-bounded where needed.
- Resolved deterministically.

### 11.7 Action Resolution

The engine must model actions beyond simple piece movement, including:

- Move actions.
- Capture actions.
- Ability actions.
- Composite actions if an ability causes multiple state transitions.
- Validation before execution.
- Atomic resolution or clear rollback on invalid execution.

### 11.8 Validation

The engine must validate:

- Piece definitions.
- Ability definitions.
- Board setup.
- Turn legality.
- Target legality.
- Rule conflicts where statically detectable.
- Runtime state integrity.

Validation errors should be developer-readable and actionable.

### 11.9 Serialization

The engine must support:

- Exporting game state to JSON-friendly structures.
- Restoring a game from serialized state.
- Exporting move or action history.
- Versioned schemas where practical.

Support for FEN/PGN compatibility:

- FEN import/export for standard chess should be a desirable v1 or v1.x feature.
- PGN support can be later if custom actions complicate notation.

### 11.10 Public API

The package should expose APIs for:

- Creating a game.
- Registering custom pieces.
- Registering custom abilities and rules.
- Querying legal moves and legal actions.
- Executing an action.
- Inspecting board state.
- Subscribing to engine events or consuming logs.
- Serializing and deserializing state.

## 12. Suggested Product Architecture

### 12.1 High-Level Modules

- `core`
  - Board, coordinates, state containers, turn model.
- `rules`
  - Standard chess legality, win conditions, turn progression.
- `pieces`
  - Piece definitions, registries, factories.
- `movement`
  - Movement generators, pathing, occupancy, attack resolution.
- `abilities`
  - Active/passive ability contracts and execution.
- `effects`
  - Status effects, cooldowns, transformations, removals.
- `events`
  - Engine event bus and trigger processing.
- `validation`
  - Static and runtime validation helpers.
- `serialization`
  - JSON schema support and compatibility formats.
- `presets`
  - Built-in standard chess pieces and optional example fantasy pieces.

### 12.2 Design Direction

The architecture should favor a hybrid model:

- Declarative definitions where simple rules are enough.
- Programmable hooks where advanced custom logic is needed.

This prevents the engine from becoming either:

- Too rigid for creative variants.
- Too unstructured to validate safely.

## 13. API Direction

Illustrative TypeScript direction:

```ts
type Game = ReturnType<typeof createGame>;

const game = createGame({
  preset: "standard",
  extensions: [
    definePiece({
      id: "freeze_tower",
      name: "Freeze Tower",
      movement: { type: "none" },
      abilities: [
        defineAbility({
          id: "freeze_blast",
          kind: "active",
          range: { type: "line", max: 3 },
          target: { enemyOnly: true },
          effect: applyStatus("frozen", { turns: 2 }),
        }),
      ],
    }),
  ],
});

const legalActions = game.getLegalActions();
game.executeAction({
  type: "ability",
  pieceId: "w_freeze_tower_1",
  abilityId: "freeze_blast",
  target: { x: 4, y: 5 },
});
```

The actual API may differ, but the product requirement is clear:

- Standard usage must be simple.
- Custom definition must be expressive.
- Engine internals must remain disciplined.

## 14. MVP Definition

### 14.1 MVP Objective

Deliver a stable npm package that supports standard chess plus a constrained but powerful custom piece system with movement and abilities.

### 14.2 MVP Must-Haves

- TypeScript package setup with public typings.
- Standard chess preset.
- Game state model.
- Legal move generation for standard chess.
- Win/loss/draw terminal detection at minimum for common cases.
- Custom piece registration.
- Custom movement definitions.
- Active ability framework.
- Passive and triggered ability hooks.
- Basic status system with duration support.
- Deterministic action execution.
- Validation layer.
- Serialization to and from JSON-compatible state.
- Documentation with at least 3 custom piece examples.

### 14.3 MVP Nice-to-Haves

- FEN support for standard chess.
- Action replay utilities.
- Debug logs and developer tooling helpers.
- Example preset showcasing 5 to 10 fantasy pieces.

## 15. Example Custom Pieces to Validate the Engine

These are product examples, not mandatory bundled content:

- `Teleporter`
  - Moves conventionally or uses an ability to teleport within range.
- `Swap Mage`
  - Actively swaps positions of two valid pieces within a range.
- `Vanish Assassin`
  - Captures an enemy, then removes itself after the capture resolves.
- `Freeze Tower`
  - Cannot move, but applies frozen status to enemies for N turns.
- `Guardian`
  - Applies a passive shield aura to adjacent allies.

If the engine can represent these cleanly, the core extensibility model is on the right track.

## 16. Success Metrics

### 16.1 Product Metrics

- Developers can run standard chess with less than 15 minutes of setup.
- Developers can define and execute a custom piece with at least one ability in less than 1 hour using docs.
- Engine behavior remains deterministic across repeated replays of the same action history.
- Core APIs remain stable enough to support sample projects built on top.

### 16.2 Adoption Metrics

- npm installs.
- GitHub stars or forks if open source.
- Number of example variants built with the package.
- Number of custom piece definitions created in sample ecosystem projects.

### 16.3 Quality Metrics

- High unit test coverage on core rules.
- Zero unresolved determinism bugs in release candidates.
- Clear validation errors for common developer mistakes.

## 17. Risks

### 17.1 Complexity Explosion

Allowing arbitrary abilities can create engine complexity that becomes difficult to validate or reason about.

Mitigation:

- Use constrained primitives.
- Keep action resolution phased and deterministic.
- Limit unrestricted arbitrary mutation in public hooks.

### 17.2 Rule Conflicts

Custom pieces may introduce contradictory behaviors.

Mitigation:

- Provide validation contracts.
- Define clear event ordering and priority rules.
- Document unsupported conflict patterns early.

### 17.3 Performance Degradation

Complex abilities and triggers can make move generation expensive.

Mitigation:

- Separate move generation from action generation where possible.
- Use cached state derivations carefully.
- Define performance budgets for board queries and effect resolution.

### 17.4 API Overdesign

Trying to support every fantasy mechanic in v1 could make the API unusable.

Mitigation:

- Focus MVP on a strong core abstraction set.
- Use example pieces to pressure-test the design before expanding.

## 18. Technical Constraints

- Must be distributed as an npm package.
- Must be TypeScript-first.
- Must run in standard modern JavaScript environments used by web and app developers.
- Should avoid hard dependency on a rendering framework.
- Should support deterministic tests without browser-only infrastructure.

## 19. Developer Experience Requirements

- Clear getting-started docs.
- Typed APIs and exported interfaces.
- Example projects for standard chess and custom variants.
- Error messages that explain invalid piece or ability definitions.
- Low-friction installation and import path design.

## 20. Documentation Requirements

v1 documentation should include:

- Installation.
- Quick start for standard chess.
- Creating a custom piece.
- Adding an active ability.
- Adding a passive or triggered ability.
- Defining statuses and cooldowns.
- Serializing and restoring games.
- Guidance on engine limits and balancing responsibility.

## 21. Roadmap

### Phase 1: Foundation

- Package scaffolding.
- Standard chess preset.
- Core state, move generation, and validation.
- Serialization baseline.

### Phase 2: Extensibility

- Piece registry.
- Ability framework.
- Status and trigger systems.
- Example fantasy pieces.

### Phase 3: Hardening

- Determinism audits.
- Better validation diagnostics.
- Performance tuning.
- More test coverage and fixtures.

### Phase 4: Ecosystem

- Variant preset packs.
- Better debugging tools.
- AI extension interfaces for search/evaluation plugins.
- Import/export compatibility improvements.

## 22. Open Questions for Later

- How much of standard chess notation support should be preserved once custom abilities exist?
- Should the engine use a strict phase system for turns beyond classic move-only turns?
- Should custom games support asymmetric teams or more than two sides in future versions?
- What plugin model, if any, should exist for third-party variant packs?
- How should AI hooks be exposed without coupling v1 to a specific search implementation?

## 23. Final Recommendation

Ship Chesschemy as a disciplined engine platform, not a loose sandbox. Standard chess compatibility builds trust. The extensible piece-and-ability system creates differentiation. The winning product shape is a deterministic TypeScript engine that lets developers invent wild new pieces while depending on a stable core for legality, state management, and turn resolution.
