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

## Restaurant AR menu

The restaurant experience is isolated at `/ar-restaurant/` because the shared site loader automatically injects model preloaders, audio player controls and fullscreen wrappers around every `model-viewer`. The page deliberately owns its own HTML/CSS/ES module lifecycle.

| Layer | File | Responsibility |
|---|---|---|
| Entry UI | `ar-restaurant/index.html` | Camera surface, model-viewer element, dish details, category buttons and help dialog |
| Visual system | `assets/css/restaurant-ar.css` | Dark glassmorphism layout, responsive mobile/landscape composition and AR status states |
| Interaction controller | `assets/js/restaurant-ar.js` | Category switching, camera lifecycle, MediaPipe hand landmarks, right-hand pinch grab/release and pointer drag fallback |
| 3D content | `assets/models/restaurant/*.glb` | Six small local procedural GLB models, two per category |
| Menu data | `assets/js/restaurant-ar.js` (`MENU`) | Category objects with `items[]`; arrows cycle the current item and reset to item 1 on category change |
| Asset generator | `scripts/generate-restaurant-glb.py` | Reproducibly rebuilds the local restaurant GLBs without an external 3D app or paid service |
