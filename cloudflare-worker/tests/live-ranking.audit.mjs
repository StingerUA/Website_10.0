import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = path => readFileSync(join(root, path), "utf8");
const stationSource = read("game/AlbaSpace/shared/station-3d.js");
const visualSource = read("game/AlbaSpace/shared/station-visual-polish.js");
const engineSource = read("game/AlbaSpace/shared/engine.js");

class Vector3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
}
const stationWindow = {};
vm.runInNewContext(stationSource, {
  window: stationWindow,
  document: { documentElement: { lang: "ru" } },
  BABYLON: { Vector3 },
  URLSearchParams,
  location: { search: "" }
});
vm.runInNewContext(visualSource, { window: stationWindow });
const renderer = stationWindow.AlbaStation3D.Station3DRenderer.prototype;
const offset = stationWindow.AlbaStationVisualPolish.cadetLabelOffset;
assert.equal(offset("SMALL"), 0.58);
assert.equal(offset("LARGE"), 0.64);
assert.match(visualSource, /width: 0\.80, height: 0\.17/); // at most 3 head diameters (3 x 0.27 = 0.81)
const poses = [-0.08, 0.06, -0.22, 0.18, Math.PI / 2, -0.35];
for (const type of ["SMALL", "LARGE"]) {
  const radius = (type === "SMALL" ? 1.72 : 2.35) / 2;
  const halfLength = (type === "SMALL" ? 2.2 : 3.05) / 2;
  for (let index = 0; index < (type === "SMALL" ? 2 : 3); index++) {
    const slot = renderer.crewLocal(index, type);
    for (const pose of poses) {
      const height = offset(type);
      const centerX = slot.x - height * Math.sin(pose);
      const centerY = slot.y + height * Math.cos(pose);
      const halfWidthX = 0.40 * Math.abs(Math.cos(pose)) + 0.085 * Math.abs(Math.sin(pose));
      const halfHeightY = 0.40 * Math.abs(Math.sin(pose)) + 0.085 * Math.abs(Math.cos(pose));
      const floatAllowance = 0.035;
      assert.ok(Math.abs(centerX) + halfWidthX + floatAllowance < halfLength,
        type + " slot " + index + " horizontal label exceeds hull in pose " + pose);
      assert.ok(Math.abs(centerY) + halfHeightY + floatAllowance < radius,
        type + " slot " + index + " vertical label exceeds hull in pose " + pose);
      assert.ok(Math.abs(slot.z - 0.38 - 0.022) + floatAllowance < radius,
        type + " slot " + index + " front label exceeds hull");
    }
  }
}

// Simulate a subscribed player snapshot where only a rival's module count changes.
// The original renderer should NOT be rebuilt, but the visible ranking must refresh.
for (const lang of ["ru", "tr", "en"]) {
  const drawer = {
    dataset: { activeDrawer: "ranking" },
    classList: { contains: () => false, remove: () => {} },
    innerHTML: ""
  };
  const nodes = {
    drawer,
    app: { innerHTML: "existing station canvas" },
    hud: { innerHTML: "" },
    phaseLabel: { textContent: "" },
    toast: { textContent: "", classList: { remove: () => {}, add: () => {} } }
  };
  const document = {
    documentElement: { lang },
    activeElement: null,
    getElementById: id => nodes[id] || null,
    querySelector: selector => selector === "#app > *" ? {} : null
  };
  const context = {
    document, sessionStorage: { getItem: () => "", removeItem: () => {} },
    setTimeout: () => 0, console,
    AlbaGame: {
      esc: value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;"),
      currentUser: () => new Promise(() => {})
    },
    addEventListener: () => {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(engineSource, context, { filename: "engine.js" });
  const playerSource = read("game/AlbaSpace/" + lang + "/assets/js/player.js");
  vm.runInContext(playerSource, context, { filename: lang + "-player.js" });
  const self = { id: "self", company: "ORION", credits: 600, small: 1, large: 1, graduates: 0, correct: 1, wins: 0, answered: false, cadets: [], seatCapacity: 5 };
  const rival = { id: "rival", company: "NOVA", credits: 400, small: 1, large: 1, graduates: 0, correct: 3 };
  context.initial = { phase: "STATION", round: 2, presentationMode: "3D", viewerPlayerId: "self", players: [self, rival] };
  vm.runInContext("state = initial; refreshRankingDrawer()", context);
  assert.match(drawer.innerHTML, /1\. ORION/);
  assert.match(drawer.innerHTML, /🛰️ 2\/10/);
  context.next = { ...context.initial, players: [self, { ...rival, small: 2 }] };
  vm.runInContext("apply(next)", context);
  assert.match(drawer.innerHTML, /1\. NOVA/);
  assert.match(drawer.innerHTML, /🛰️ 3\/10/);
  assert.equal(nodes.app.innerHTML, "existing station canvas", "Rival update must not rebuild the 3D scene");
  assert.match(playerSource, /rankingRows\(state\)/, "Drawer must use current state when opened");
  assert.match(playerSource, /drawer\.dataset\.activeDrawer = button\.dataset\.drawer/);
}
console.log("AlbaSpace in-hull labels and live rankings audit passed");
