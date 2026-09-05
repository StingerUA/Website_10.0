import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GameRoomDO } from "../game-backend.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

for (const file of [
  join(root, "cloudflare-worker/game-backend.js"),
  join(root, "game/AlbaSpace/shared/station-3d.js")
]) execFileSync(process.execPath, ["--check", file]);

for (const lang of ["ru", "tr", "en"]) {
  const html = readFileSync(join(root, `game/AlbaSpace/${lang}/player.html`), "utf8");
  assert.match(html, /\.\.\/shared\/station-3d\.js\?v=20260905-layout1/);
}

const renderer = readFileSync(join(root, "game/AlbaSpace/shared/station-3d.js"), "utf8");
assert.match(renderer, /player\?\.modules/);
assert.match(renderer, /cadet\.moduleId/);
assert.match(renderer, /cadet\.slotId/);
assert.match(renderer, /branchDepth/);
assert.match(renderer, /RadialPort_04/);

class MemoryStorage {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.get(key); }
  async put(key, value) { this.map.set(key, structuredClone(value)); }
}

async function freshRoom() {
  const state = { storage: new MemoryStorage() };
  const roomDO = new GameRoomDO(state, {});
  const teacher = { id: "teacher-1", name: "Teacher", email: "teacher@example.com" };
  const request = new Request("https://game-room.internal/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Game-User": JSON.stringify(teacher),
      "X-Game-Locale": "en"
    },
    body: JSON.stringify({
      roomId: "room-1",
      code: "12345",
      mode: "STANDARD",
      presentationMode: "3D",
      locale: "en"
    })
  });
  const response = await roomDO.fetch(request);
  assert.equal(response.status, 200);
  return { roomDO, teacher, room: await roomDO.load() };
}

const { roomDO, room } = await freshRoom();
const user = { id: "player-1", name: "Player", email: "player@example.com" };
roomDO.join(room, user);
const player = room.players[0];

assert.equal(player.modules.length, 2);
assert.equal(player.large, 1);
assert.equal(player.small, 1);
assert.equal(player.seatCapacity, 5);

const command = player.modules.find(module => module.type === "LARGE");
const startingSmall = player.modules.find(module => module.type === "SMALL");
assert.equal(command.role, "COMMAND");
assert.equal(command.parentModuleId, null);
assert.equal(startingSmall.parentModuleId, command.id);
assert.equal(startingSmall.parentPort, "RadialPort_01");
assert.equal(startingSmall.branchDepth, 1);

roomDO.setCompany(room, user, "ORION");
roomDO.setCadets(room, user, ["PLANETS", "SATELLITES", "TELESCOPES"]);
assert.equal(player.cadets.length, 3);
assert.ok(player.cadets.every(cadet => cadet.moduleId && cadet.slotId));
assert.equal(new Set(player.cadets.map(cadet => `${cadet.moduleId}:${cadet.slotId}`)).size, 3);
assert.ok(player.cadets.every(cadet => cadet.moduleId === command.id));

room.phase = "STATION";
room.round = 0;
player.credits = 100000;

const startingIds = player.modules.map(module => module.id);
roomDO.buyModule(room, user, "LARGE");
roomDO.buyModule(room, user, "LARGE");

const larges = player.modules.filter(module => module.type === "LARGE").sort((a, b) => a.spineIndex - b.spineIndex);
assert.equal(larges.length, 3);
assert.equal(larges[0].id, startingIds[0]);
assert.equal(larges[1].parentModuleId, larges[0].id);
assert.equal(larges[2].parentModuleId, larges[1].id);
assert.ok(larges.slice(1).every(module => module.parentPort === "AxialPort_B"));
assert.ok(larges.slice(1).every(module => module.ownPort === "AxialPort_A"));
assert.ok(larges.every(module => module.branchDepth === 0));

while (player.small < 7) roomDO.buyModule(room, user, "SMALL");
assert.equal(player.modules.length, 10);
assert.equal(player.large, 3);
assert.equal(player.small, 7);
assert.equal(player.seatCapacity, 23);
assert.ok(player.modules.filter(module => module.type === "SMALL").every(module => module.branchDepth <= 2));
assert.ok(player.modules.filter(module => module.type === "LARGE" && module.spineIndex > 0).every(module => {
  const parent = player.modules.find(item => item.id === module.parentModuleId);
  return parent?.type === "LARGE";
}));

let maxSmallRejected = false;
try { roomDO.buyModule(room, user, "SMALL"); } catch { maxSmallRejected = true; }
assert.equal(maxSmallRejected, true);

// Explicit future Build Mode placement: L-S-S is valid, but L-S-S-S and L-S-L are not.
const second = await freshRoom();
const user2 = { id: "player-2", name: "Player 2", email: "player2@example.com" };
second.roomDO.join(second.room, user2);
const player2 = second.room.players[0];
second.room.phase = "STATION";
second.room.round = 0;
player2.credits = 100000;
const small1 = player2.modules.find(module => module.type === "SMALL");
second.roomDO.buyModule(second.room, user2, "SMALL", small1.id, "ExtensionPort");
const depth2 = player2.modules.find(module => module.type === "SMALL" && module.branchDepth === 2);
assert.ok(depth2);
assert.equal(depth2.parentModuleId, small1.id);

let thirdSmallRejected = false;
try { second.roomDO.buyModule(second.room, user2, "SMALL", depth2.id, "ExtensionPort"); } catch { thirdSmallRejected = true; }
assert.equal(thirdSmallRejected, true);

let largeAfterSmallRejected = false;
try { second.roomDO.buyModule(second.room, user2, "LARGE", small1.id, "ExtensionPort"); } catch { largeAfterSmallRejected = true; }
assert.equal(largeAfterSmallRejected, true);

// Preferred crew slots persist and a graduated cadet frees exactly that slot.
second.roomDO.setCompany(second.room, user2, "VEGA");
second.roomDO.setCadets(second.room, user2, ["PLANETS", "SATELLITES", "TELESCOPES"]);
const freeTargetModule = small1;
second.roomDO.recruit(second.room, user2, "ROVERS", freeTargetModule.id, "CrewSlot_02");
let recruited = player2.cadets[player2.cadets.length - 1];
assert.equal(recruited.moduleId, freeTargetModule.id);
assert.equal(recruited.slotId, "CrewSlot_02");
recruited.status = "GRADUATED";
second.roomDO.recruit(second.room, user2, "TURKISH_SATELLITES", freeTargetModule.id, "CrewSlot_02");
recruited = player2.cadets[player2.cadets.length - 1];
assert.equal(recruited.moduleId, freeTargetModule.id);
assert.equal(recruited.slotId, "CrewSlot_02");

// Legacy rooms are migrated deterministically on load without a D1 schema migration.
const legacyState = { storage: new MemoryStorage() };
const legacyDO = new GameRoomDO(legacyState, {});
const legacyRoom = {
  roomId: "legacy-room",
  teacherUserId: "teacher",
  players: [{
    id: "legacy-player",
    userId: "legacy-user",
    large: 2,
    small: 3,
    seatCapacity: 12,
    cadets: [
      { id: "c1", topic: "PLANETS", knowledge: 1, status: "ACTIVE", name: "Ada" },
      { id: "c2", topic: "SATELLITES", knowledge: 2, status: "ACTIVE", name: "Ece" }
    ]
  }],
  version: 1
};
await legacyState.storage.put("room", legacyRoom);
const migratedA = await legacyDO.load();
const legacyPlayer = migratedA.players[0];
assert.equal(legacyPlayer.modules.length, 5);
assert.equal(legacyPlayer.large, 2);
assert.equal(legacyPlayer.small, 3);
assert.equal(legacyPlayer.seatCapacity, 12);
assert.ok(legacyPlayer.cadets.every(cadet => cadet.moduleId && cadet.slotId));
const snapshotIds = legacyPlayer.modules.map(module => module.id);
const migratedB = await legacyDO.load();
assert.deepEqual(migratedB.players[0].modules.map(module => module.id), snapshotIds);

console.log("AlbaSpace persistent station layout audit passed");
