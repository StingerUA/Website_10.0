# AlbaSpace Audit Memory

## Baseline

The repository was clean at commit `3aa0bbd`. All existing JavaScript syntax checks and `cloudflare-worker/tests/game-backend.smoke.mjs` passed before this audit.

## Findings

The main concrete defects are: the Turkish static copy does not identify its locale to the shared Worker question loader, so a Turkish room can receive the Russian question URL; Classroom rebuilds its entire DOM on every accepted snapshot, unlike Player; `currentUser()` has no network failure fallback; the station file ends with a cleanup listener for the obsolete global `AlbaStationRenderer`; and several UI render functions assume `currentQuestion`, `results.items`, and player arrays are always present during transient reconnect states.

The existing Player selective key correctly avoids rerendering for changes belonging only to other players, while station camera state is preserved inside the Babylon renderer. These mechanisms must remain intact.

## Decisions

Implement small compatibility patches: add a locale query to room creation and carry locale through the room state; make Worker question loading choose the locale-specific URL with a Russian fallback; use a stable projected key for Classroom; harden auth and transient state guards; and replace the stale renderer cleanup hook with the exported `AlbaStation3D` reference. Do not introduce a new framework or dependency.

## Completed in this audit

The Worker now persists a sanitized `locale` (`ru`/`tr`) in room state and selects the localized question URL, with an explicit Russian fallback. `acceptedAnswers` is redacted from non-result snapshots, while a player receives their own `lastAnswer` after reconnect so the accepted response is not lost visually.

Both localized game clients send their locale on room creation and use an eight-second auth timeout fallback. Player question/result views tolerate transient incomplete snapshots. Classroom now computes a visible projection key and updates only the header for heartbeat/no-op snapshots, avoiding destructive DOM rebuilds. Teacher and Classroom received equivalent transient guards. The obsolete global station cleanup listener was removed because Player owns renderer disposal. CSS grid children have `min-width: 0` to preserve long-word wrapping.

## Verification

`cloudflare-worker/tests/albaspace.audit.mjs` passes with `ALBASPACE_AUDIT_TEST_OK`; the existing backend test passes with `GAME_V02_SMOKE_OK`; all localized JavaScript and auth files pass `node --check`; `git diff --check` passes. A local browser smoke confirmed the Classroom QUESTION path, long-word wrapping and the updated answer-reveal copy. A console assertion confirmed no-op Classroom snapshots preserve `app.innerHTML` and incomplete questions show a placeholder.


## Restaurant AR menu

Added a standalone `/ar-restaurant/` browser experience that intentionally does not load the site's global `include.js` stack, avoiding model preloader, audio player and fullscreen DOM rewrites. It uses `model-viewer` 3.0.0, local procedural GLB files under `assets/models/restaurant/`, `getUserMedia`, and MediaPipe Tasks Vision HandLandmarker loaded only after the user clicks the AR button.

The right-hand interaction uses the index fingertip for the pointer and a thumb/index distance threshold for pinch-to-grab. When the pinch starts over the visible dish, the model card follows the hand; releasing the pinch places the dish. Pointer drag is a no-camera fallback. The back-facing camera is not mirrored, so normalized x coordinates remain direct.

The homepage now links to the new route through a small AR promotion block. The sandbox browser verified initial model rendering, all three category switches, drag/reset behavior, the help dialog, clean console output during normal loading, and the expected no-device camera fallback. A physical HTTPS-device test is still required for camera permission and actual hand tracking.
