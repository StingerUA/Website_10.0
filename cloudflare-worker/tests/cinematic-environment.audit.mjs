import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const cinematicPath = join(root, "game/AlbaSpace/shared/station-cinematic-environment.js");

execFileSync(process.execPath, ["--check", cinematicPath]);
const source = readFileSync(cinematicPath, "utf8");

assert.match(source, /new BABYLON\.PBRMaterial/);
assert.match(source, /new BABYLON\.DirectionalLight\("OrbitalSun"/);
assert.match(source, /new BABYLON\.ShadowGenerator\(1024, sun\)/);
assert.match(source, /EarthSurfaceTexture/);
assert.match(source, /EarthCloudTexture/);
assert.match(source, /EarthAtmosphere/);
assert.match(source, /TONEMAPPING_ACES/);
assert.match(source, /registerStationShadows/);
assert.match(source, /OrbitalGlow/);
assert.match(source, /__albaCinematicEnvironmentPatched/);
assert.match(source, /window\.AlbaStationCinematicEnvironment/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-cinematic-environment\.js\?v=20260909-cinematic1/);
  assert.ok(html.indexOf("station-external-equipment.js") < html.indexOf("station-cinematic-environment.js"));
  assert.ok(html.indexOf("station-cinematic-environment.js") < html.indexOf("station-build-mode.js"));
}

console.log("AlbaSpace cinematic environment audit passed");
