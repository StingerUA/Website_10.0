# Atlas People — Neil Armstrong (2026-10-15)

## New pages

- Turkish: `/atlas/atlas-neil-armstrong/`
- English: `/eng/atlas/atlas-neil-armstrong/`
- Russian: `/rus/atlas/atlas-neil-armstrong/`

Atlas cards are in `atlas.html`, `eng/atlas.html` and `rus/atlas.html` with `data-category="peoples"`. Language switching maps between these three nested pages. Stories were composed for Albamen using NASA's Apollo 11 and crew materials.

## Assets to be supplied (not committed)

1. **3D model**: `assets/models/neil-armstrong.glb` (case-sensitive path; exactly this filename). Ideally a lifelike human-scale model with feet close to the origin and face in a consistent forward direction. After upload, the page HEAD-checks the file and automatically enables 3D and the portrait camera on page refresh.
2. **Turkish narration**: `assets/audio/models/neil-armstrong.mp3`.
3. **English narration** (optional): `eng/assets/audio/models/neil-armstrong.mp3`.
4. **Russian narration** (optional): `rus/assets/audio/models/neil-armstrong.mp3`.

The site's shared `assets/js/alba-model-player.js` player uses the existing model name slug. While MP3 files are missing, the player can read the localized Albamen story with its normal TTS fallback. A missing GLB never triggers a camera capture and is shown with a localized instruction rather than a broken 3D model.

## AR / photography functionality

- Existing `model-viewer` stays installed. Standard orbit, pinch-zoom, drag, and native AR buttons are retained.
- **Android**: `assets/js/ar-depth-launch.js` adds a separately labeled **AR depth** button to every existing model viewer page loading `assets/js/include.js`, except any ISS/atlas-ISS/orbital-ISS viewer. The button launches Google's native Scene Viewer with `disable_occlusion=false` (opt-in to ARCore depth on compatible devices). Standard 3D interaction stays unchanged. The built-in model-viewer AR button still retains its old behavior. Scene Viewer may fall back to non-occluded rendering on unsupported devices, and Google Play Services for AR is required. The script does not implement/deploy the ARCore Android API itself.
- **iOS**: model-viewer's current Quick Look entry remains available. People occlusion in Apple's native AR systems depends on OS/device and viewer features; it is **not** guaranteed by the web page.
- **Neil camera**: `assets/js/neil-portrait.js` uses browser getUserMedia plus Three.js GLTFLoader and optional MediaPipe person segmentation. It composites camera + 3D + the **entire real-person silhouette in front**; this is a 2D mask, NOT a metric depth map. It does not yet support a person's hand alternating in front of a virtual shoulder and behind a virtual head simultaneously. That exact interaction requires a depth-aware renderer (native ARKit/ARCore/WebXR depth pipeline) and device testing.
- Photo saves PNG locally, and record creates an eight-second MP4/WebM file when browser CanvasCaptureStream + MediaRecorder support the format; otherwise the video button reports its limitation. No camera feed is uploaded to the server.
- The ring try-on game's camera and one-click photo workflow motivated the new photo and video controls, but remains unchanged.

## Validation before marking as fully tested

- After uploading GLB/MP3, verify 3D canvas loads without fallback, audio plays in TR/EN/RU, and AR buttons respond.
- On ARCore Depth compatible Android, check Scene Viewer occlusion from the **AR depth** button, and confirm rotate, move, and scale still work.
- On iPhone, test Quick Look, video recording feature detection and Safari download behavior. Photos can work where `canvas.captureStream` is unavailable.
- On an actual mobile phone, test person segmentation, camera permission, photo, 8-second video, and rotation/resize.
- Verify no new depth launcher appears on `iss`, `atlas-iss` and `orbital-iss` pages.

This is browser implementation with static checks, **not** physical phone hardware testing.
