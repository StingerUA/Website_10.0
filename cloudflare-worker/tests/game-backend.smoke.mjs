import assert from "node:assert/strict";
import { GameRoomDO } from "../game-backend.js";

class Storage {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.get(key); }
  async put(key, value) { this.map.set(key, value); }
}
const user = (id, name) => ({ id, email: `${id}@example.test`, name });
const call = async (room, path, method, actor, body) => {
  const response = await room.fetch(new Request(`https://test${path}`, { method, headers: { "Content-Type": "application/json", "X-Game-User": JSON.stringify(actor) }, body: body === undefined ? undefined : JSON.stringify(body) }));
  const payload = await response.json();
  assert.equal(response.ok, true, JSON.stringify(payload));
  return payload;
};
const storage = new Storage();
const db = { prepare() { return { bind() { return this; }, async run() {}, async first() { return null; } }; } };
const room = new GameRoomDO({ storage }, { DB: db, QUESTIONS_URL: "https://invalid.test/questions.json" });
const teacher = user("teacher-1", "Teacher");
const p1 = user("player-1", "Orion");
const p2 = user("player-2", "Nova");
const init = await call(room, "/init", "POST", teacher, { roomId: "room-1", code: "48271", mode: "STANDARD" });
assert.equal(init.state.phase, "LOBBY");
await call(room, "/command", "POST", p1, { type: "JOIN_GAME_ROOM", requestId: "join-1", payload: {} });
await call(room, "/command", "POST", p2, { type: "JOIN_GAME_ROOM", requestId: "join-2", payload: {} });
for (const [actor, name] of [[p1, "ORION SPACE"], [p2, "NOVA SPACE"]]) {
  await call(room, "/command", "POST", actor, { type: "SET_COMPANY_NAME", requestId: `name-${actor.id}`, payload: { name } });
  await call(room, "/command", "POST", actor, { type: "SELECT_START_CADETS", requestId: `cadets-${actor.id}`, payload: { topics: ["PLANETS", "ROVERS", "TELESCOPES"] } });
}
await call(room, "/command", "POST", teacher, { type: "START_GAME", requestId: "start", payload: {} });
const activeRoom = await room.load();
activeRoom.topicBag = ["PLANETS"];
await room.save(activeRoom);
room.questions = async () => [{ id: "q1", topic: "PLANETS", topicLabel: "🟣 Планеты", difficulty: "EASY", type: "NUMBER", text: "Сколько планет?", correct: 8, tolerance: 0, explanation: "В Солнечной системе 8 планет." }];
const question = await call(room, "/command", "POST", teacher, { type: "START_NEXT_ROUND", requestId: "question-1", payload: {} });
assert.equal(question.state.currentQuestion.correct, undefined);
await call(room, "/command", "POST", p1, { type: "SUBMIT_ANSWER", requestId: "answer-1", payload: { value: "8" } });
const result = await call(room, "/command", "POST", teacher, { type: "CLOSE_ANSWERS", requestId: "close-1", payload: {} });
const playerView = await call(room, "/command", "POST", p1, { type: "REQUEST_ROOM_SNAPSHOT", requestId: "snapshot-after-result", payload: {} });
const playerResult = playerView.state.players.find(player => player.id === playerView.state.viewerPlayerId);
assert.equal(playerResult.credits, 340);
assert.equal(playerView.state.results.items.find(item => item.playerId === playerResult.id).knowledge, 2);
await call(room, "/command", "POST", teacher, { type: "START_STATION_PHASE", requestId: "station-1", payload: {} });
const stationRoom = await room.load();
stationRoom.players.find(player => player.userId === p1.id).credits = 700;
await room.save(stationRoom);
const buildBody = { type: "BUY_MODULE", requestId: "buy-same", payload: { type: "SMALL" } };
const built = await call(room, "/command", "POST", p1, buildBody);
const duplicate = await call(room, "/command", "POST", p1, buildBody);
assert.equal(built.state.players.find(player => player.id === built.state.viewerPlayerId).small, 2);
assert.equal(duplicate.state.players.find(player => player.id === duplicate.state.viewerPlayerId).small, 2);
console.log("GAME_V02_SMOKE_OK");
