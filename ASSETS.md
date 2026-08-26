# AlbaSpace Assets Manifest

The current game uses procedural Babylon.js geometry for the station, modules, solar arrays, cadets, labels, Earth and stars. This audit does not add binary assets or change the existing asset registry. The production visual direction remains a dark orbital scene with cyan accents, open cutaway modules, category-colored helmets, gray suits and black volumetric-style labels on cyan plates.

| Resource | Runtime source | Change in this audit |
|---|---|---|
| Station modules | `station-3d.js` procedural meshes | Preserve and harden lifecycle only |
| Cadets and helmets | `station-3d.js` procedural meshes/materials | Preserve category-color contract |
| Earth and stars | `station-3d.js` procedural meshes | No new files |
| AR camera/anchors | `ar-mode.js` + `anchors.html` | Preserve existing fallback |
