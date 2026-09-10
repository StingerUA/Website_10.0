import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GameRoomDO, sessionExpired } from "../game-backend-session.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const backendPath = join(root, "cloudflare-worker/game-backend-session.js");
const uxPath = join(root, "game/AlbaSpace/shared/session-timing-ux.js");
const wrapperPath = join(root, "cloudflare-worker/worker-with-ll2-refresh.js");

for (const file of [backendPath, uxPath, wrapperPath]) execFileSync(process.execPath, ["--check", file]);

const backend = readFileSync(backendPath, "utf8");
for (const token of ["SET_SESSION_DURATION", "EXTEND_SESSION", "START_FINAL_ROUND", "FINISH_FINAL_ROUND", "plannedEndAt", "finalRoundAnswerSeconds", "SESSION_MIN_MINUTES = 45", "SESSION_MAX_MINUTES = 85", "SESSION_EXTENSION_MINUTES = 15", "SessionError"]) assert.match(backend, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const ux = readFileSync(uxPath, "utf8");
for (const token of ["plannedDuration", "plannedSessionKpi", "START_FINAL_ROUND", "EXTEND_SESSION", "FINISH_FINAL_ROUND", "finalRoundActive", "finalStationPending", "45", "85", "15", "ru:", "tr:", "en:"]) assert.ok(ux.includes(token), `Missing session UX token: ${token}`);

const wrapper = readFileSync(wrapperPath, "utf8");
assert.match(wrapper, /GameRoomDO.*\.\/game-backend-session\.js/);

for (const lang of ["ru", "tr", "en"]) {
  for (const page of ["teacher", "classroom", "player"]) {
    const html = readFileSync(join(root, `game/AlbaSpace/${lang}/${page}.html`), "utf8");
    assert.match(html, /\.\.\/shared\/session-timing-ux\.js\?v=20260910-time1/);
    if (page === "teacher") assert.ok(html.indexOf("session-timing-ux.js") < html.indexOf("./assets/js/teacher.js"), `${lang} teacher timing script must load before teacher.js`);
  }
}

class MemoryStorage {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.get(key); }
  async put(key, value) { this.map.set(key, structuredClone(value)); }
}

const storage = new MemoryStorage();
const roomDO = new GameRoomDO({ storage }, {});
const teacher = { id:"teacher-time", name:"Teacher", email:"teacher@example.com" };
const init = new Request("https://game-room.internal/init", {
  method:"POST",
  headers:{ "Content-Type":"application/json", "X-Game-User":JSON.stringify(teacher), "X-Game-Locale":"en" },
  body:JSON.stringify({ roomId:"time-room", code:"45678", mode:"STANDARD", presentationMode:"3D", locale:"en" })
});
const initResponse = await roomDO.fetch(init);
assert.equal(initResponse.status, 200);
const room = await roomDO.load();
assert.equal(room.plannedDurationMinutes, 60);
assert.equal(room.plannedEndAt, null);

assert.throws(() => roomDO.setSessionDuration(room, teacher, 44), /45/);
roomDO.setSessionDuration(room, teacher, 45);
assert.equal(room.plannedDurationMinutes, 45);

const players = [
  { id:"p-time-1", name:"Player 1", email:"p1@example.com" },
  { id:"p-time-2", name:"Player 2", email:"p2@example.com" }
];
for (const [index, user] of players.entries()) {
  roomDO.join(room, user);
  roomDO.setCompany(room, user, index ? "VEGA" : "ORION");
  roomDO.setCadets(room, user, ["PLANETS", "SATELLITES", "TELESCOPES"]);
}
roomDO.startGame(room, teacher);
assert.equal(room.phase, "STATION");
assert.equal(room.plannedEndAt - room.startedAt, 45 * 60_000);

room.plannedEndAt = Date.now() - 1;
assert.equal(sessionExpired(room), true);
await assert.rejects(() => roomDO.startQuestion(room, teacher), error => error?.status === 400 && /время/i.test(error.message));

roomDO.extendSession(room, teacher);
assert.equal(room.extensionMinutes, 15);
assert.equal(room.sessionDecision, "EXTENDED");
assert.ok(room.plannedEndAt > Date.now() + 14 * 60_000);
assert.equal(sessionExpired(room), false);

room.plannedEndAt = Date.now() - 1;
room.topicBag = ["PLANETS"];
const q = { id:"q-final-time", topic:"PLANETS", topicLabel:"Planets", difficulty:"NORMAL", type:"NUMBER", text:"Final?", correct:1, tolerance:0, answers:[], explanation:"Final explanation" };
roomDO.allQuestions = async () => ({ ru:[q], tr:[q], en:[q] });
await roomDO.startFinalRound(room, teacher);
assert.equal(room.phase, "QUESTION");
assert.equal(room.finalRoundActive, true);
assert.equal(room.finalRoundNumber, 1);
assert.equal(room.finalRoundAnswerSeconds, 12);
assert.ok(room.deadline > Date.now());
assert.ok(room.deadline <= Date.now() + 12_500);

roomDO.reveal(room, teacher);
assert.equal(room.phase, "RESULT");
roomDO.startStation(room, teacher);
assert.equal(room.phase, "STATION");
assert.equal(room.finalStationPending, true);
await assert.rejects(() => roomDO.startQuestion(room, teacher), error => error?.status === 400 && /Финальный вопрос/i.test(error.message));

roomDO.finishFinalRound(room, teacher);
assert.equal(room.status, "FINISHED");
assert.equal(room.phase, "ENDGAME");
assert.equal(room.winnerId, null);
assert.equal(room.finalStationPending, false);
assert.equal(room.sessionDecision, "FINAL_COMPLETE");
assert.ok(room.sessionFinishedAt);

console.log("AlbaSpace planned session timing + final accelerated round audit passed");
