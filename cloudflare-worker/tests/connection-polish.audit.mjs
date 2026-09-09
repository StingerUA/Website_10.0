import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const sourcePath = join(root, "game/AlbaSpace/shared/station-connections-polish.js");

execFileSync(process.execPath, ["--check", sourcePath]);
const source = readFileSync(sourcePath, "utf8");

assert.match(source, /addPhysicalConnections/);
assert.match(source, /ConnectionTunnel_/);
assert.match(source, /ConnectionCollar_A_/);
assert.match(source, /ConnectionCollar_B_/);
assert.match(source, /ConnectionRail_L_/);
assert.match(source, /MainTruss_Longerons_/);
assert.match(source, /MainTruss_Diagonal_/);
assert.match(source, /TrussModuleSupport_L_/);
assert.match(source, /SolarPowerMast_Main/);
assert.match(source, /SolarBoom_/);
assert.match(source, /originalSolarArrays\.call\(this, modules\)/);
assert.match(source, /__albaConnectionsPolishPatched/);
assert.match(source, /window\.AlbaStationConnectionsPolish/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-connections-polish\.js\?v=20260909-connections1/);
  assert.ok(html.indexOf("station-structural-polish.js") < html.indexOf("station-connections-polish.js"));
  assert.ok(html.indexOf("station-connections-polish.js") < html.indexOf("station-build-mode.js"));
}

console.log("AlbaSpace physical tunnels + central truss audit passed");
