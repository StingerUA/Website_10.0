import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const structuralPath = join(root, "game/AlbaSpace/shared/station-structural-polish.js");

execFileSync(process.execPath, ["--check", structuralPath]);
const source = readFileSync(structuralPath, "utf8");

assert.match(source, /addSegmentedHull/);
assert.match(source, /PressureRib_/);
assert.match(source, /CutawayLipTop/);
assert.match(source, /AxialDockRing_/);
assert.match(source, /Radial_4/);
assert.match(source, /_Collar/);
assert.match(source, /ExteriorRail_/);
assert.match(source, /CableTray/);
assert.match(source, /ObservationWindow_/);
assert.match(source, /__albaStructuralPolishPatched/);
assert.match(source, /originalBuildModule\.call\(this, meta\)/);
assert.match(source, /window\.AlbaStationStructuralPolish/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-structural-polish\.js\?v=20260908-structure1/);
  assert.ok(html.indexOf("station-visual-polish.js") < html.indexOf("station-structural-polish.js"));
  assert.ok(html.indexOf("station-structural-polish.js") < html.indexOf("station-build-mode.js"));
}

console.log("AlbaSpace structural station polish audit passed");
