# Security Notes

Chesschemy is a local rules engine. It does not perform authentication,
authorization, network transport, payment handling, database access, file system
access, or cryptographic operations. Application security remains the
responsibility of the host application.

## Trust Boundaries

Treat every client-provided move, ability input, serialized state, and custom
variant definition as untrusted until validated.

Recommended server-side flow:

```ts
import { Game, move, validateGameState } from 'chesschemy';

let game = Game();

validateGameState(game);
game = move(game, 'e2', 'e4');
```

Do not accept a client-updated `GameState` as authoritative in multiplayer
games. Store the authoritative state on the server, receive compact action
inputs from clients, validate them with Chesschemy, and broadcast the resulting
state or event summary.

## Custom Callback Safety

Custom abilities, movement definitions, target validators, and effects are
executable code. Only load callback definitions from code you trust.

Keep callbacks deterministic and side-effect-light:

- Avoid network calls, file system reads, timers, randomness, and process-level
  mutation.
- Avoid mutating `GameState`, pieces, or context objects in place.
- Return new state through effect helpers or explicit immutable copies.
- Keep callback runtime small enough for your server's request budget.

If your product lets users author variants, use a separate sandboxing strategy
outside Chesschemy before running user-authored code.

## Serialization

`save` returns JSON-friendly engine state and intentionally omits piece
definitions, ability callbacks, effect functions, and classes. Persist the
saved payload with a version and reattach trusted definitions during restore:

```ts
import { load, save } from 'chesschemy';

const saved = save(game);
const restored = load(saved, {
  pieceDefinitions: trustedDefinitions,
});
```

Validate restored state before using it in gameplay. `load` already validates
the state it returns.

FEN parsing is for standard chess positions. Do not use FEN as a custom-variant
persistence format.

## Availability

Move generation can become expensive for very large boards, many pieces, or
complex custom callbacks. If you expose user-created variants, enforce
application-level limits for board dimensions, piece count, ability count, and
callback complexity.

## Reporting Issues

Report security issues through the repository's issue tracker unless a private
disclosure channel is added by the project maintainer. Include the package
version, reproduction steps, expected behavior, actual behavior, and whether the
issue requires untrusted code execution or only untrusted data.
