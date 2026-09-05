import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GameRoomDO } from "../game-backend.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const syntaxFiles = [
  join(root, "game/AlbaSpace/shared/engine.js"),
  join(root, "game/AlbaSpace/shared/game-client.js"),
  join(root, "cloudflare-worker/game-backend.js"),
];
for (const lang of ["ru", "tr"]) {
  for (const file of ["classroom.js", "player.js", "station-3d.js", "teacher.js", "ar-mode.js"]) syntaxFiles.push(join(root, "game", "AlbaSpace", lang, "assets/js", file));
}
for (const file of ["classroom.js", "player.js", "teacher.js"]) syntaxFiles.push(join(root, "game", "AlbaSpace/en/assets/js", file));
for (const file of syntaxFiles) execFileSync(process.execPath, ["--check", file]);

const sharedEngine = readFileSync(join(root, "game/AlbaSpace/shared/engine.js"), "utf8");
const sharedClient = readFileSync(join(root, "game/AlbaSpace/shared/game-client.js"), "utf8");
assert.match(sharedEngine, /raw\.startsWith\("tr"\).*raw\.startsWith\("en"\)/s);
assert.match(sharedEngine, /window\.AlbaSpace = \{ LOCALE/);
assert.match(sharedClient, /"X-Game-Locale": GAME_LOCALE/);
assert.match(sharedClient, /locale=\$\{encodeURIComponent\(GAME_LOCALE\)\}/);
assert.match(sharedClient, /new AbortController\(\)/);

for (const lang of ["ru", "tr", "en"]) {
  for (const file of ["player.html", "teacher.html", "classroom.html"]) {
    const html = readFileSync(join(root, "game", "AlbaSpace", lang, file), "utf8");
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.match(html, /\.\.\/shared\/engine\.js/);
    assert.match(html, /\.\.\/shared\/game-client\.js/);
  }
  for (const file of ["index.html", "player.html", "teacher.html", "classroom.html", "anchors.html"]) {
    const html = readFileSync(join(root, "game", "AlbaSpace", lang, file), "utf8");
    assert.match(html, /Alba Space/);
  }
}

for (const lang of ["ru", "tr", "en"]) {
  const player = readFileSync(join(root, `game/AlbaSpace/${lang}/assets/js/player.js`), "utf8");
  const classroom = readFileSync(join(root, `game/AlbaSpace/${lang}/assets/js/classroom.js`), "utf8");
  assert.match(player, /state\.results\?\.items\?\.find/);
  assert.match(player, /if \(!question\)/);
  assert.match(player, /player\.lastAnswer \?\? draftAnswer/);
  assert.match(classroom, /function classroomViewKey\(snapshot\)/);
}

const questionFiles = {
  ru: join(root, "game/AlbaSpace/ru/data/questions.ru.json"),
  tr: join(root, "game/AlbaSpace/tr/data/questions.ru.json"),
  en: join(root, "game/AlbaSpace/en/data/questions.en.json"),
};
const questions = Object.fromEntries(Object.entries(questionFiles).map(([lang,file]) => [lang, JSON.parse(readFileSync(file, "utf8"))]));
for (const lang of ["ru", "tr", "en"]) {
  assert.equal(questions[lang].length, 25, `${lang} question set must contain 25 questions`);
  assert.equal(new Set(questions[lang].map(item => item.id)).size, questions[lang].length, `${lang} question ids must be unique`);
}
const canonicalIds = questions.ru.map(item => item.id).sort();
assert.deepEqual(questions.tr.map(item => item.id).sort(), canonicalIds, "TR ids must match RU ids");
assert.deepEqual(questions.en.map(item => item.id).sort(), canonicalIds, "EN ids must match RU ids");

const workerSource = readFileSync(join(root, "cloudflare-worker/game-backend.js"), "utf8");
assert.match(workerSource, /SUPPORTED_LOCALES = \["ru", "tr", "en"\]/);
assert.match(workerSource, /currentQuestionI18n/);
assert.match(workerSource, /X-Game-Locale/);
assert.match(workerSource, /QUESTIONS_URL_EN/);
assert.match(workerSource, /multilingualAccepted/);
assert.match(workerSource, /correctByLocale/);
assert.match(workerSource, /delete output\.currentQuestionI18n/);
assert.match(workerSource, /delete output\.acceptedAnswers/);

const requested = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  requested.push(String(url));
  return new Response("[]", { status:200, headers:{ "content-type":"application/json" } });
};
const room = new GameRoomDO({}, {
  QUESTIONS_URL: "https://example.test/questions-ru.json",
  QUESTIONS_URL_TR: "https://example.test/questions-tr.json",
  QUESTIONS_URL_EN: "https://example.test/questions-en.json",
});
await room.questions("ru");
await room.questions("tr");
await room.questions("en");
assert.deepEqual(requested, [
  "https://example.test/questions-ru.json",
  "https://example.test/questions-tr.json",
  "https://example.test/questions-en.json",
]);
globalThis.fetch = originalFetch;

const cssRu = readFileSync(join(root, "game/AlbaSpace/ru/assets/css/game.css"), "utf8");
const cssTr = readFileSync(join(root, "game/AlbaSpace/tr/assets/css/game.css"), "utf8");
assert.match(cssRu, /overflow-wrap:anywhere/);
assert.match(cssTr, /\.station-experience>\*,\.classroom-grid>\*,\.grid>\*\{min-width:0\}/);

const trCatalog = readFileSync(join(root, "games/index.html"), "utf8");
const ruCatalog = readFileSync(join(root, "rus/games.html"), "utf8");
const enCatalog = readFileSync(join(root, "eng/games.html"), "utf8");
assert.match(trCatalog, /\/game\/AlbaSpace\/tr\/index\.html/);
assert.match(ruCatalog, /\/game\/AlbaSpace\/ru\/index\.html/);
assert.match(enCatalog, /\/game\/AlbaSpace\/en\/index\.html/);

console.log("ALBASPACE_MULTILINGUAL_AUDIT_OK");
