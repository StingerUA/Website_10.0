# ISS interiors — Blender base series, 24 October 2026

18 original interior studies: the 17 main pressurized modules plus Bishop.
This delivery is the base-detail stage requested before the detailed photorealism pass.
It is an educational reconstruction with approximate equipment placements, not a surveyed/as-flown replica.

## Files and viewing

- `assets/models/interior/*_optimized.glb`: new Stage 1 meshes, meters, glTF Y-up.
- `assets/models/interior/catalog-stage1.json`: complete module list, camera positions, sizes and triangle counts.
- `assets/images/iss-interiors/*.jpg`: Cycles renders of the exported geometry.
- Native editable `.blend` files are supplied separately as a source archive.
- Previous detailed GLBs are retained in Git; they are not presented as the new detailed series.

The website loads one module at a time. Cameras start inside the module near its entry, so dragging looks around the interior. The external ISS model is retained. Cupola and Tranquility are independently selectable; the route buttons switch between their separate GLBs.
The base studies use closed pressure doors at unconnected ports, continuous lining and seven glazed Cupola windows. The blue Cupola render backdrop is a neutral presentation aid, not a geographic Earth reconstruction, and is excluded from the model.

## Rebuild in Blender 4.5 LTS

```sh
blender -b --factory-startup -t 8 --python tools/iss-interiors/build_blender_stage1.py -- --out /absolute/output --modules all --samples 20 --width 1200
```

Choose a comma-separated module list with `--modules destiny,harmony` for bounded iterations. The script creates native Blender geometry and renders it in Cycles. Native files retain separate editable objects, UVs, packed fabric textures, cameras and lights; the web export merges geometry into a single mesh with material primitives to reduce draw calls.

Cycles area lights are not included in the GLBs. The website uses environment lighting, so shading will differ from the reference renders. The next detailed stage should add reference-specific equipment geometry, more accurate pressure-shell shapes and cone transitions, dimensional verification, physically based wear/fabric detail, and baked interior lighting for close visual matching in the browser.

## Reference basis

- NASA assembly elements: https://www.nasa.gov/international-space-station/international-space-station-assembly-elements/
- NASA Destiny: https://www.nasa.gov/international-space-station/destiny-laboratory-module/
- NASA interior image: https://www.nasa.gov/image-article/inside-international-space-stations-destiny-laboratory/
- NASA Zvezda: https://www.nasa.gov/international-space-station/zvezda-service-module/
- ESA Cupola: https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Node-3_Cupola/Cupola

These sources inform module identities/functions and broad visual conventions. This stage does not claim an exact reconstruction of a particular expedition. All mesh geometry and procedural materials are original; no downloaded third-party mesh assets are used.
