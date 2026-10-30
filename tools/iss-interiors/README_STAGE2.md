# ISS interior detailing, Stage 2

Native Blender 4.5 LTS geometry; PBR fabrics, painted panels, metal and rubber; routed cables, restrained stowage, fasteners, labelled rack equipment and baked ambient occlusion on a second UV set.

Stage 1 remains the light option. Stage 2 is a visual reconstruction informed by public references, not a dimensionally certified replica of a particular ISS expedition. The detailed geometry and material work is a first pass toward photorealism; module-specific equipment accuracy still requires further reference review.

## Sources

- NASA Destiny module and its 24 rack locations: https://www.nasa.gov/international-space-station/destiny-laboratory-module/
- NASA Destiny interior view: https://www.nasa.gov/image-article/inside-international-space-stations-destiny-laboratory/
- NASA MSG photo ISS051E034105: https://www.nasa.gov/wp-content/uploads/2023/06/iss051e034105.jpg
- NASA Destiny observation window ISS004E10047: https://www.nasa.gov/wp-content/uploads/2023/06/iss004e10047.jpg
- NASA Blue Marble Earth texture (Cupola presentation background): https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/
- Blender glTF PBR/normal/AO support: https://github.com/KhronosGroup/glTF-Blender-IO/blob/main/docs/blender_docs/scene_gltf2.rst

Photos are visual references, not projected onto the meshes. Geometry and procedural texture assets are original. Scientific instrument arrangements and identifiers are representative and must not be used as operational guidance.

## Rebuild

`blender -b --factory-startup -t 8 --python tools/iss-interiors/build_blender_stage2.py -- --out /absolute/output --modules destiny --samples 64 --width 1200`

Replace `destiny` with `all` or a comma-separated list. Each module produces an editable source scene, a separate web mesh scene with packed AO, a self-contained GLB, JSON metadata and an internal Cycles review image. The web model retains PBR materials; Cycles lighting is not exported, so browser lighting differs. No photogrammetry or downloaded third-party meshes are used.

The optional Cupola Earth backdrop uses NASA Blue Marble 2002 (NASA / Reto Stoeckli / Robert Simmon). Set `ISS_EARTH_TEXTURE` to the downloaded `land_ocean_ice_2048.png` to include it. The backdrop is a presentation aid, not scaled station geometry. Earth image source: https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png

Web delivery uses Draco geometry compression and WebP textures without geometry simplification. Ambient occlusion has its own 2048px UV atlas; material weave and microroughness use the original UV set. Tangent bases are embedded. Degenerate tangents on tiny end caps receive an orthonormal fallback from their vertex normal. Both raw and compressed GLB exports are validated.

## Web lighting calibration

An enclosed module makes an unrestricted AO bake very dark. Delivery GLBs limit occlusion strength to 0.25 so it adds contact shading without suppressing the viewer environment lighting. `calibrate_stage2.py` applies this delivery setting without modifying geometry or texture pixels, updates catalogue sizes and repackages the GLB download. Native Blender lighting and editable materials are retained.
