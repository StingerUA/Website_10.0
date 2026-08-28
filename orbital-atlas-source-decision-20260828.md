# Orbital Atlas: source decision record — 28 August 2026

## Launch visuals

The official Launch Library 2 image-license endpoint is https://ll.thespacedevs.com/2.3.0/config/image_licenses/?format=json&limit=100. It lists multiple rights categories, including CC BY, CC BY-SA, CC0, NASA and agency-specific policies, as well as `Unknown`. The Worker shows an external image only when the record supplies an HTTPS image URL and an explicit `CC BY` licence name that does not contain `NC`; it keeps the supplied credit and licence URL beside the image.

RocketLaunch.Live documents the free `next/5` endpoint and requests visible attribution in the form `Data by RocketLaunch.Live`: https://www.rocketlaunch.live/api. Its response documents vehicle data but does not make media available in the free endpoint. Therefore no RocketLaunch.Live external image is fetched, downloaded, cached or displayed. The fallback presentation uses only an original in-site vector vehicle profile labelled with the received vehicle name.

NextSpaceflight was opened only as a user-provided functional reference. No code, markup, imagery, widgets, tiles or media have been reused from it.

## Planet GLB assets

The supplied repository contains the following planet files: `assets/models/mercury.glb`, `venus.glb`, `earth.glb`, `mars.glb`, `jupiter.glb`, `saturn.glb`, `uranus.glb`, and `neptune.glb`. Git history shows they were added in commit `a90f0d6` on 26 July 2026 by the repository owner account. No third-party licence or author record accompanies these model files, so their provenance is not inferred from that fact. The 3D Solar System feature uses those project-supplied assets only; it does not claim a third-party licence or introduce any externally downloaded model.
