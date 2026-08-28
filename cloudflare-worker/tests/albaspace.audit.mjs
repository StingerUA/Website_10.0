import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GameRoomDO } from "../game-backend.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const files = [];
for (const lang of ["ru", "tr"]) {
  for (const file of ["classroom.js", "engine.js", "game-client.js", "player.js", "station-3d.js", "teacher.js", "ar-mode.js"]) {
    files.push(join(root, "game", "AlbaSpace", lang, "assets", "js", file));
  }
  const player = readFileSync(join(root, "game", "AlbaSpace", lang, "assets/js/player.js"), "utf8");
  const classroom = readFileSync(join(root, "game", "AlbaSpace", lang, "assets/js/classroom.js"), "utf8");
  const client = readFileSync(join(root, "game", "AlbaSpace", lang, "assets/js/game-client.js"), "utf8");
  const station = readFileSync(join(root, "game", "AlbaSpace", lang, "assets/js/station-3d.js"), "utf8");
  assert.match(client, new RegExp(`const GAME_LOCALE = "${lang}"`));
  assert.match(client, /locale: GAME_LOCALE/);
  assert.match(client, /new AbortController\(\)/);
  assert.match(player, /state\.results\?\.items\?\.find/);
  assert.match(player, /if \(!question\)/);
  assert.match(player, /player\.lastAnswer \?\? draftAnswer/);
  assert.match(classroom, /function classroomViewKey\(snapshot\)/);
  assert.match(classroom, /function renderHeader\(\)/);
  assert.doesNotMatch(player, /Таймера на Player нет|Player zamanlayıcısı yok/);
  assert.doesNotMatch(station, /AlbaStationRenderer\?\.dispose/);
}
for (const file of files) execFileSync(process.execPath, ["--check", file]);
const cssRu = readFileSync(join(root, "game/AlbaSpace/ru/assets/css/game.css"), "utf8");
const cssTr = readFileSync(join(root, "game/AlbaSpace/tr/assets/css/game.css"), "utf8");
assert.match(cssRu, /overflow-wrap:anywhere/);
assert.match(cssTr, /\.station-experience>\*,\.classroom-grid>\*,\.grid>\*\{min-width:0\}/);
const workerSource = readFileSync(join(root, "cloudflare-worker/game-backend.js"), "utf8");
assert.match(workerSource, /QUESTIONS_URL_TR/);
assert.match(workerSource, /delete output\.acceptedAnswers/);

const requested = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  requested.push(String(url));
  return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
};
const room = new GameRoomDO({}, { QUESTIONS_URL_TR: "https://example.test/questions-tr.json" });
await room.questions("tr");
assert.deepEqual(requested, ["https://example.test/questions-tr.json"]);
requested.length = 0;
const fallbackRoom = new GameRoomDO({}, {});
globalThis.fetch = async url => {
  requested.push(String(url));
  return new Response(requested.length === 1 ? "" : "[]", { status: requested.length === 1 ? 503 : 200, headers: { "content-type": "application/json" } });
};
await fallbackRoom.questions("tr");
assert.deepEqual(requested, [
  "https://albaspace.com.tr/game/AlbaSpace/tr/data/questions.ru.json",
  "https://albaspace.com.tr/game/AlbaSpace/ru/data/questions.ru.json",
]);
globalThis.fetch = originalFetch;
for (const lang of ["ru", "tr"]) {
  for (const file of ["index.html", "player.html", "teacher.html", "classroom.html", "anchors.html"]) {
    const html = readFileSync(join(root, "game", "AlbaSpace", lang, file), "utf8");
    assert.doesNotMatch(html, /AlbaSpace Game|ALBASPACE ·|ORBI AR|💰/);
    assert.match(html, /Alba Space/);
  }
}
const catalog = readFileSync(join(root, "games/index.html"), "utf8");
assert.doesNotMatch(catalog, /AlbaSpace Game|ORBI AR|💰/);
assert.match(catalog, /Alba Space/);
for (const lang of ["ru", "tr"]) {
  for (const file of ["classroom.js", "player.js", "teacher.js"]) {
    const source = readFileSync(join(root, "game", "AlbaSpace", lang, "assets/js", file), "utf8");
    assert.doesNotMatch(source, /ORBI AR|💰|<span>кредиты<\/span>|<span>kredi<\/span>/);
  }
}
console.log("ALBASPACE_AUDIT_TEST_OK");
