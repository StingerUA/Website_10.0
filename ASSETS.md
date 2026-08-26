# Assets

## Existing project art direction

The current game uses procedural Babylon.js geometry for the station, modules, solar arrays, cadets, labels, Earth and stars. The production visual direction remains a dark orbital scene with cyan accents, open cutaway modules, category-colored helmets, gray suits and black volumetric-style labels on cyan plates.

## Restaurant AR art direction

A dark midnight-blue restaurant interface uses glassmorphism cards, cyan interaction highlights and warm amber food accents. The live camera stays visible behind a single clean 3D model, with a compact status pill at the top and a category rail at the bottom. The experience is intentionally lightweight and readable on a phone.

The planned reference visual was requested as a portrait in-browser AR screenshot with a dinner plate on a softly blurred tabletop, three category pills for drinks, desserts and meat dishes, a hand-tracking status pill, and a small pinch-and-drag hint. The image-generation quota was unavailable, so the implementation uses the written art direction and deterministic local geometry instead of a generated reference image.

| Resource | Runtime source | Change in this audit |
|---|---|---|
| Station modules | `station-3d.js` procedural meshes | Preserve and harden lifecycle only |
| Cadets and helmets | `station-3d.js` procedural meshes/materials | Preserve category-color contract |
| Earth and stars | `station-3d.js` procedural meshes | No new files |
| AR camera/anchors | `ar-mode.js` + `anchors.html` | Preserve existing fallback |
| Steak plate | `/assets/models/restaurant/steak.glb` | New local procedural GLB, loaded by `model-viewer` |
| Dessert plate | `/assets/models/restaurant/dessert.glb` | New local procedural GLB, loaded by `model-viewer` |
| Citrus drink | `/assets/models/restaurant/drink.glb` | New local procedural GLB, loaded by `model-viewer` |
| Hand landmark model | MediaPipe Tasks Vision CDN | Browser inference only; no server upload |
| Model-viewer runtime | Google model-viewer CDN with pinned version | Existing site pattern, used by the new standalone page |
