# AlbaSpace Game — 3D Asset Requirements

## Current implementation

Сейчас Player использует процедурные Babylon.js placeholder-модели. Gameplay state остаётся в Cloudflare Worker/D1; renderer только отображает полученный state. Для замены placeholder достаточно подключить GLB в `StationAssetRegistry` будущего asset-loader слоя, не меняя auth, multiplayer или экономику.

Все GLB должны быть в **метрах**, иметь origin в центре собственного `ModuleRoot`, ось **Y вверх**, направление стыковки по **+X**, и не содержать камер, света или gameplay scripts. Материалы желательно PBR с 1K текстурами; для школьных ноутбуков целиться в 15–35k triangles на large module и 8–18k triangles на small module.

## Station modules

| Filename | Purpose | Approx. dimensions | Required nodes | Animation |
|---|---|---:|---|---|
| `large-command.glb` | Центральный стартовый Command Module; на корпусе отображается company name | 3.2 × 2.5 × 2.5 m | `ModuleRoot`, `CutawayRoot`, `AxialPort_A`, `AxialPort_B`, `RadialPort_01`…`RadialPort_04`, `CrewSlot_01`…`CrewSlot_03`, `CameraFocus`, `Hatch` | None now; keep clean pivots for later idle animation |
| `large-science.glb` | Центральный Science Module; visual-only difference from other large modules | 3.2 × 2.5 × 2.5 m | Same node contract as `large-command.glb` | None now |
| `large-operations.glb` | Центральный Operations/communications Module | 3.2 × 2.5 × 2.5 m | Same node contract as `large-command.glb` | None now |
| `small-navigation.glb` | Small visual variant: navigation | 2.3 × 1.8 × 1.8 m | `ModuleRoot`, `CutawayRoot`, `PrimaryPort`, `ExtensionPort`, optional `SidePort`, `CrewSlot_01`, `CrewSlot_02`, `CameraFocus`, `Hatch` | None now |
| `small-observation.glb` | Small visual variant: observation | 2.3 × 1.8 × 1.8 m | Same small-module node contract | None now |
| `small-communications.glb` | Small visual variant: communications | 2.3 × 1.8 × 1.8 m | Same small-module node contract | None now |
| `small-general.glb` | Small visual variant: general | 2.3 × 1.8 × 1.8 m | Same small-module node contract | None now |

### Module modelling rules

Large modules must be physical cutaway assets, not transparent shells. The visible section should expose `outer shell`, insulation, structural ring and interior wall. The three large modules form the central axial spine: `LARGE — LARGE — LARGE`. Small modules attach radially or extend one level from another small module; the renderer must never require a third small branch level.

Each large module needs four named radial ports even when a port is visually closed. Each small module needs `PrimaryPort` and `ExtensionPort`. Port origins should point along the docking direction and remain stable across all variants.

## Crew characters

| Filename pattern | Purpose | Approx. dimensions | Required nodes | Animation |
|---|---|---:|---|---|
| `cadet-01.glb` … `cadet-10.glb` | Stylized friendly cadets in pressurized modules | 0.45 × 0.35 × 0.95 m | `CharacterRoot`, `PatchRoot`, `CameraFocus`, `HatchTarget` | Optional later `Armature`; expose idle-ready rig |

Characters wear a white/light-gray AlbaSpace flight suit without EVA helmet. Topic identity is a small patch plus icon, not a full-body color. Provide at least six static pose variants: `Pose_01` hand on rail, `Pose_02` upright, `Pose_03` angled, `Pose_04` holding tablet, `Pose_05` horizontal floating, `Pose_06` side-facing. If using one GLB, name the pose empties `Pose_01`…`Pose_06`; if using animation clips, keep clip names identical.

## Environment and station props

| Filename | Purpose | Approx. dimensions | Required nodes |
|---|---|---:|---|
| `earth.glb` | Dark, subdued Earth background | 12–16 m diameter | `EarthRoot`, `AtmosphereRoot` |
| `solar-array.glb` | Visual solar arrays, never an economy module | 3.0 × 0.1 × 1.0 m per panel | `SolarArrayRoot`, `Panel_A`, `Panel_B`, `MountPoint` |
| `docking-ring.glb` | Shared docking ring visual | 0.5–2.5 m diameter by context | `DockingRingRoot`, `PortOrigin` |
| `station-handrail.glb` | Interior handrails | 0.8–2.0 m | `HandrailRoot` |
| `station-console.glb` | Command/science/operations interior prop | 0.4–1.2 m | `ConsoleRoot`, optional `ScreenRoot` |
| `station-window.glb` | Command module window prop | 0.6–1.0 m | `WindowRoot` |
| `empty-crew-slot.glb` | Holographic available slot | 0.45 × 0.35 × 0.95 m | `HologramRoot`, `CameraFocus` |

## Materials and texture limits

Use light-gray painted metal, white insulation, darker structural rings, restrained cyan emissive strips and topic patch colors. Keep albedo/normal/roughness textures at 1024 px or lower, use shared materials between repeated modules, and avoid baked lights that prevent tinting. Transparent materials should be limited to holograms and atmosphere.

## Replacement contract

The renderer expects a semantic registry, not filenames scattered through gameplay code. The intended mapping is:

```js
StationAssetRegistry = {
  large: { COMMAND: "large-command.glb", SCIENCE: "large-science.glb", OPERATIONS: "large-operations.glb" },
  small: { NAVIGATION: "small-navigation.glb", OBSERVATION: "small-observation.glb", COMMUNICATIONS: "small-communications.glb", GENERAL: "small-general.glb" },
  crew: "cadet-01.glb",
  environment: { earth: "earth.glb", solarArray: "solar-array.glb" }
};
```

`Station3DRenderer` must continue to work with procedural placeholders when a GLB is missing. A future loader should replace only the visual factory for a semantic asset; it must not change `player`, `cadets`, `modules`, `credits`, scoring, phases, or winner logic.
