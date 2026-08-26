# AlbaSpace Game vNext Audit Plan

## Цель
Проверить и улучшить существующую ванильную JavaScript/Babylon.js игру без замены архитектуры, сохранив Worker, D1, Durable Objects, SSE, авторизацию и две локали.

## Risk slices

1. **Locale correctness:** Turkish Teacher must create rooms marked `tr`; the Worker must load Turkish questions for those rooms.
2. **Realtime stability:** Classroom should rerender only when visible scoreboard data changes; Player must keep existing selective rendering and avoid stale async UI state.
3. **Runtime resilience:** Missing transient question/result objects or temporarily unavailable auth API must not blank the page.
4. **Renderer lifecycle:** remove stale cleanup hook and preserve Babylon renderer lifecycle without leaking event handlers.
5. **Compatibility:** keep procedural Babylon geometry, low draw-cost materials, responsive CSS and existing API contracts backward-compatible.

## Verification criteria

- `node --check` passes for all RU/TR JS and Worker files.
- Existing `GAME_V02_SMOKE_OK` backend test passes.
- A locale integration test proves RU/TR room question URLs are selected correctly.
- A browser/local mock test proves Classroom selective rendering and Player guards do not throw on transient state.
- `git diff --check` is clean and both live localized entry points remain reachable.
