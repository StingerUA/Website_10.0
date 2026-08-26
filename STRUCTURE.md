# AlbaSpace Game Structure

## Runtime

- `game/AlbaSpace/ru/` — Russian static game entry points (`index.html`, `teacher.html`, `player.html`, `classroom.html`, `anchors.html`).
- `game/AlbaSpace/tr/` — Turkish static mirror with localized UI and question database.
- `assets/js/worker-auth.js` and account-menu templates — site-wide browser auth bridge and email/Google account UI.
- `game/AlbaSpace/*/assets/js/engine.js` — immutable game constants, topics, economy and ranking helpers.
- `game/AlbaSpace/*/assets/js/game-client.js` — API requests, OAuth token fragment consumption, SSE subscription and polling fallback.
- `player.js` — Player state projection, answer input and station controls.
- `teacher.js` — Teacher room lifecycle, question controls, station readiness and ranking.
- `classroom.js` — projected classroom scoreboard.
- `station-3d.js` — procedural Babylon.js station renderer and camera lifecycle.
- `ar-mode.js` — mobile camera/QR anchor fallback.
- `cloudflare-worker/worker-auth.index.js` — auth/session API and game route gateway.
- `cloudflare-worker/game-backend.js` — Durable Object game room state machine and D1 persistence.

## State contract

The Worker owns authoritative room state. Frontends receive role-filtered snapshots with `version`, `phase`, `round`, `currentQuestion`, `players`, and optional results. Frontends may keep local drafts and camera state, but commands go through the Worker and are idempotent by `requestId`.

## Compatibility constraints

Keep static hosting paths, the existing Worker endpoint, API request shapes, D1 schema, Durable Object binding, and RU/TR file parity. Procedural meshes are preferred over adding large binary assets.
