# ISS interior detailing, Stage 2

Native Blender 4.5 LTS geometry; PBR fabrics, painted panels, metal and rubber; routed cables, restrained stowage, fasteners, labelled rack equipment and baked ambient occlusion on a second UV set.

Stage 1 remains the light option. Stage 2 is a visual reconstruction informed by public references, not a dimensionally certified replica of a particular ISS expedition. The detailed geometry and material work is a first pass toward photorealism; module-specific equipment accuracy still requires further reference review.

## Sources

- NASA Destiny module and its 24 rack locations: https://www.nasa.gov/international-space-station/destiny-laboratory-module/
- NASA Destiny interior view: https://www.nasa.gov/image-article/inside-international-space-stations-destiny-laboratory/
- NASA MSG photo ISS051E034105: https://www.nasa.gov/wp-content/uploads/2023/06/iss051e034105.jpg
- NASA Destiny observation window ISS004E10047: https://www.nasa.gov/wp-content/uploads/2023/06/iss004e10047.jpg
- Blender glTF PBR/normal/AO support: https://github.com/KhronosGroup/glTF-Blender-IO/blob/main/docs/blender_docs/scene_gltf2.rst

Photos are visual references, not projected onto the meshes. Geometry and procedural texture assets are original. Scientific instrument arrangements and identifiers are representative and must not be used as operational guidance.

## Rebuild

`blender -b --factory-startup -t 8 --python tools/iss-interiors/build_blender_stage2.py -- --out /absolute/output --modules destiny --samples 64 --width 1200`

Replace `destiny` with `all` or a comma-separated list. Each module produces an editable source scene, a separate web mesh scene with packed AO, a self-contained GLB, JSON metadata and an internal Cycles review image. The web model retains PBR materials; Cycles lighting is not exported, so browser lighting differs. No photogrammetry or downloaded third-party meshes are used.
