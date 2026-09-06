import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const visualPath = join(root, "game/AlbaSpace/shared/station-visual-polish.js");

execFileSync(process.execPath, ["--check", visualPath]);
const visual = readFileSync(visualPath, "utf8");

assert.match(visual, /RestraintSeat_/);
assert.match(visual, /ControlScreen_/);
assert.match(visual, /CommandScreen_/);
assert.match(visual, /ScienceRack_/);
assert.match(visual, /OpsLocker_/);
assert.match(visual, /CadetHair_/);
assert.match(visual, /CadetEye_/);
assert.match(visual, /CadetArm_/);
assert.match(visual, /CadetLeg_/);
assert.match(visual, /visualSeed/);
assert.match(visual, /proto\.buildCadet/);
assert.doesNotMatch(visual, /CadetHelmet_/);
assert.doesNotMatch(visual, /CadetVisor_/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-visual-polish\.js\?v=20260906-visual1/);
  assert.ok(html.indexOf("station-3d.js") < html.indexOf("station-visual-polish.js"));
  assert.ok(html.indexOf("station-visual-polish.js") < html.indexOf("station-build-mode.js"));
}

console.log("AlbaSpace station visual polish audit passed");
