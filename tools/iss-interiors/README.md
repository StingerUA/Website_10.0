# ISS interiors — AlbaSpace
Interactive page: /iss/ (iss/index.html). Exterior: assets/models/iss.glb (unchanged).
Viewer, Turkish narration, existing 100–1000% zoom, AR support and analytics are preserved.

## Where to upload additional GLBs
Upload both versions of every module directly into `assets/models/interior/`:
- destiny_optimized.glb and destiny_detailed.glb
- cupola_optimized.glb and cupola_detailed.glb
- harmony_optimized.glb and harmony_detailed.glb
- columbus_optimized.glb and columbus_detailed.glb
- kibo_optimized.glb and kibo_detailed.glb
- tranquility_optimized.glb and tranquility_detailed.glb
- unity_optimized.glb and unity_detailed.glb
- zarya_optimized.glb and zarya_detailed.glb
- zvezda_optimized.glb and zvezda_detailed.glb

Use lowercase ASCII names exactly. The map checks files with HTTP HEAD; modules missing the selected quality are dimmed and clicking them shows a message. Upload GLBs and reload /iss/ — no changes to JavaScript needed.

## Generate the first four models
GitHub Actions workflow `.github/workflows/build-iss-interiors.yml` creates the first four GLBs from
`tools/iss-interiors/build_glb_without_blender.py`, if Actions and GITHUB_TOKEN contents write permissions are enabled.
After the workflow finishes, verify that all four GLBs appear under `assets/models/interior/`.
You can also generate locally with Python + numpy + trimesh and upload manually.
These are simple educational procedural reconstructions, not photorealistic NASA CAD assets.
Do not overwrite an artist-modified GLB by re-running the generator workflow.

## Integration
CSS: `assets/css/iss-interiors.css`
JS: `assets/js/iss-interiors.js`
Markup: `iss/index.html`; the existing model-viewer #mainViewer is reused.
The map is schematic, not an exact scale representation.
Hotspots are intentionally disabled until real model coordinates are calibrated:
configure `window.ISS_INTERIOR_HOTSPOTS = { destiny:'...', cupola:'...' }` before the JS loads.
Camera presets for future models are placeholders; calibrate each module's target/orbit after uploading.
AR support remains dependent on platform. A web AR button alone does not guarantee that users can physically enter a model at 1:1 scale.

## Explorer v2 fixes (October 2026)
Only existing files are shown as main clickable cards. Future modules on the map display a clear missing-file message rather than appearing clickable without feedback. Selection scrolls to the viewer, checks availability again, and falls back to the available quality automatically. The site's model preloader no longer overwrites a model that a visitor selected before lazy loading begins.
