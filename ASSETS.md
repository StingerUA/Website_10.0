# Assets

## Existing project art direction

The current game uses procedural Babylon.js geometry for the station, modules, solar arrays, cadets, labels, Earth and stars. The production visual direction remains a dark orbital scene with cyan accents, open cutaway modules, category-colored helmets, gray suits and black volumetric-style labels on cyan plates.

## Restaurant AR art direction

The restaurant route uses a dark camera-first interface with restrained glass panels, cyan interaction highlights and warm amber food accents. The page now uses **one physical image anchor**: the model is rendered as a child of the same MindAR image target and therefore cannot be dragged across the screen. The menu is hidden at first; a Turkish `Menü` button reveals category and dish-name buttons, while the capture button remains centered at the bottom.

| Resource | Runtime source | Current status |
|---|---|---|
| User table anchor photo | `/assets/ar/alba-table-anchor.jpeg` | User-provided JPEG; used as the only visual target and shown in the menu as a placement reference |
| Compiled image target | `/assets/ar/alba-table-anchor.mind` | Generated locally with MindAR offline compiler 1.2.5 from the user-provided JPEG |
| Image tracking runtime | A-Frame 1.5.0 + MindAR 1.2.5 CDN bundles | Browser-only image tracking; no native app or server tracking service |
| Initial dish | `/assets/models/restaurant/realistic-steak-board.glb` | Loaded automatically as the first child of `#dish-anchor` |
| Meat dishes | Three local `realistic-*.glb` files | Switched by dish-name buttons and rendered on the same target |
| Dessert dishes | Three local `realistic-*.glb` files | Switched by dish-name buttons and rendered on the same target |
| Soup dish | `/assets/models/restaurant/realistic-soup.glb` | Switched by the `ÇORBALAR` category |
| Drink dishes | Three local `realistic-*.glb` files | Switched by dish-name buttons and rendered on the same target |
| Capture | Canvas composite of MindAR video + A-Frame renderer | Short press saves PNG; long press records WebM for up to 30 seconds |
| Zoom | Pinch or wheel applied to the child glTF scale | Scale changes without changing the target entity position |

### Anchor generation and placement

The JPEG is the exact image supplied by the user in this task. Its local MindAR target file is derived from that image and is hosted with the site, so the browser does not need to call a target-generation service. The same photograph is included in the menu as a visual reference: the user should place that image flat on the table and point the rear camera at it. Physical image tracking and camera permissions remain device/browser dependent; the sandbox cannot emulate a mobile camera or confirm a real target-found event.

### Model rights note

The current realistic GLBs were downloaded from public Tripo gallery cards and remain documented in `assets/models/restaurant/THIRD_PARTY_NOTICES.md`. Public availability and a free download do not by themselves prove redistribution or commercial-use rights. The individual Tripo cards inspected did not show a standard CC0/CC-BY licence, and the Tripo pricing page distinguishes free public models from commercial-use plans. These models must not be presented as CC0/CC-BY without additional permission or replacement by assets with explicit redistribution rights.

Older low-poly, Poly Pizza, and procedural files remain in the repository as legacy backups and are not referenced by the new controller unless explicitly selected in a future change.
