import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const inspectPath = join(root, "game/AlbaSpace/shared/station-cadet-inspect.js");
execFileSync(process.execPath, ["--check", inspectPath]);

const inspect = readFileSync(inspectPath, "utf8");
assert.match(inspect, /openCadet/);
assert.match(inspect, /focusCadet/);
assert.match(inspect, /HighlightLayer/);
assert.match(inspect, /data-cadet/);
assert.match(inspect, /cadet-row-focused/);
assert.match(inspect, /rankLabel/);
assert.match(inspect, /moduleLabel/);
assert.match(inspect, /AlbaStationBuildMode/);
assert.match(inspect, /AlbaCrewSlotMode/);
assert.match(inspect, /OnPickTrigger/);
assert.match(inspect, /Cadet_/);
assert.match(inspect, /knowledge/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  const player = readFileSync(join(root, `game/AlbaSpace/${lang}/assets/js/player.js`), "utf8");
  assert.match(html, /\.\.\/shared\/station-cadet-inspect\.js\?v=20260905-inspect1/);
  assert.ok(html.indexOf("station-cadet-inspect.js") < html.indexOf("./assets/js/player.js"));
  assert.match(player, /data-cadet=/);
}

console.log("AlbaSpace cadet inspect + Crew drawer focus audit passed");
