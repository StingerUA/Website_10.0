import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const equipmentPath = join(root, "game/AlbaSpace/shared/station-external-equipment.js");

execFileSync(process.execPath, ["--check", equipmentPath]);
const source = readFileSync(equipmentPath, "utf8");

assert.match(source, /SolarRotaryJoint_/);
assert.match(source, /SolarAlphaJoint_/);
assert.match(source, /SolarBlanket_/);
assert.match(source, /SolarCellGrid_/);
assert.match(source, /RadiatorWing_/);
assert.match(source, /RadiatorPanel_/);
assert.match(source, /HighGainAntenna/);
assert.match(source, /TrackingAntenna/);
assert.match(source, /TelemetryMast/);
assert.match(source, /ExternalServicePackage_/);
assert.match(source, /ExternalAvionicsBox_/);
assert.match(source, /__albaExternalEquipmentPatched/);
assert.match(source, /originalSolarArrays\.call\(this, modules\)/);
assert.match(source, /window\.AlbaStationExternalEquipment/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-external-equipment\.js\?v=20260909-external1/);
  assert.ok(html.indexOf("station-connections-polish.js") < html.indexOf("station-external-equipment.js"));
  assert.ok(html.indexOf("station-external-equipment.js") < html.indexOf("station-build-mode.js"));
}

console.log("AlbaSpace external equipment audit passed");
