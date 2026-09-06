import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const fxPath = join(root, "game/AlbaSpace/shared/station-result-fx.js");

execFileSync(process.execPath, ["--check", fxPath]);
const fx = readFileSync(fxPath, "utf8");
assert.match(fx, /MAX_SEQUENCE_MS\s*=\s*3900/);
assert.match(fx, /item\.changes/);
assert.match(fx, /item\.grads/);
assert.match(fx, /animateKnowledge/);
assert.match(fx, /animateGraduation/);
assert.match(fx, /cadetId/);
assert.match(fx, /moduleId/);
assert.match(fx, /structuredClone\(this\.player\)/);
assert.match(fx, /previousState\?\.phase === "QUESTION"/);
assert.match(fx, /nextState\?\.phase === "RESULT"/);
assert.match(fx, /__albaResultFxToken/);
assert.match(fx, /__albaResultFxRunning/);
assert.match(fx, /originalUpdate\.call\(renderer, nextState, nextPlayer\)/);
assert.match(fx, /tweenCamera/);
assert.match(fx, /grad\.reward \|\| 350/);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-result-fx\.js\?v=20260906-result1/);
  assert.ok(html.indexOf("station-cadet-inspect.js") < html.indexOf("station-result-fx.js"));
  assert.ok(html.indexOf("station-result-fx.js") < html.indexOf("assets/js/player.js"));
}

console.log("AlbaSpace knowledge + graduation result FX audit passed");
