import { GameRoomDO as BaseGameRoomDO, handleGameRequest } from "./game-backend.js";

export { handleGameRequest };

const SESSION_MIN_MINUTES = 45;
const SESSION_MAX_MINUTES = 85;
const SESSION_DEFAULT_MINUTES = 60;
const SESSION_EXTENSION_MINUTES = 15;

const userKey = user => String(user?.id || user?.google_id || user?.email || "");
const localeOf = request => String(request.headers.get("X-Game-Locale") || new URL(request.url).searchParams.get("locale") || "ru").toLowerCase();
const responseJson = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

function normalizedDuration(value) {
  const minutes = Math.round(Number(value));
  if (!Number.isFinite(minutes)) return SESSION_DEFAULT_MINUTES;
  return Math.max(SESSION_MIN_MINUTES, Math.min(SESSION_MAX_MINUTES, minutes));
}

export function ensureSessionClock(room) {
  if (!room) return false;
  let changed = false;
  const duration = normalizedDuration(room.plannedDurationMinutes);
  if (room.plannedDurationMinutes !== duration) { room.plannedDurationMinutes = duration; changed = true; }
  const defaults = {
    sessionClockVersion: 1,
    plannedEndAt: room.startedAt ? Number(room.startedAt) + duration * 60_000 : null,
    extensionMinutes: 0,
    finalRoundActive: false,
    finalRoundNumber: null,
    finalRoundStartedAt: null,
    finalRoundAnswerSeconds: null,
    finalStationPending: false,
    sessionDecision: null,
    sessionDecisionAt: null,
    sessionFinishedAt: null
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (room[key] === undefined) { room[key] = value; changed = true; }
  }
  return changed;
}

export function sessionExpired(room, at = Date.now()) {
  if (!room || room.status === "FINISHED" || !room.startedAt || !room.plannedEndAt) return false;
  return Number(at) >= Number(room.plannedEndAt);
}

export class GameRoomDO extends BaseGameRoomDO {
  async load() {
    const room = await super.load();
    if (room && ensureSessionClock(room)) {
      room.updatedAt = Date.now();
      await this.state.storage.put("room", room);
    }
    return room;
  }

  async save(room) {
    ensureSessionClock(room);
    return super.save(room);
  }

  startGame(room, user) {
    ensureSessionClock(room);
    super.startGame(room, user);
    room.plannedEndAt = Number(room.startedAt) + Number(room.plannedDurationMinutes) * 60_000;
    room.extensionMinutes = 0;
    room.finalRoundActive = false;
    room.finalRoundNumber = null;
    room.finalRoundStartedAt = null;
    room.finalRoundAnswerSeconds = null;
    room.finalStationPending = false;
    room.sessionDecision = null;
    room.sessionDecisionAt = null;
    room.sessionFinishedAt = null;
  }

  async startQuestion(room, user) {
    ensureSessionClock(room);
    if (room.finalRoundActive) throw new Error("Финальный вопрос уже запущен. После него нужно завершить игру.");
    if (sessionExpired(room)) throw new Error("Запланированное время занятия закончилось. Выберите финальный вопрос или продление на 15 минут.");
    return super.startQuestion(room, user);
  }

  startStation(room, user) {
    super.startStation(room, user);
    ensureSessionClock(room);
    if (room.finalRoundActive && Number(room.round) === Number(room.finalRoundNumber)) room.finalStationPending = true;
  }

  endSession(room, user) {
    super.endSession(room, user);
    ensureSessionClock(room);
    room.sessionFinishedAt = Date.now();
  }

  setSessionDuration(room, user, minutes) {
    this.requireTeacher(room, user);
    ensureSessionClock(room);
    if (room.status !== "LOBBY" || room.phase !== "LOBBY") throw new Error("Длительность занятия можно менять только до старта игры.");
    const numeric = Number(minutes);
    if (!Number.isFinite(numeric) || Math.round(numeric) !== numeric || numeric < SESSION_MIN_MINUTES || numeric > SESSION_MAX_MINUTES) {
      throw new Error(`Длительность занятия должна быть от ${SESSION_MIN_MINUTES} до ${SESSION_MAX_MINUTES} минут.`);
    }
    room.plannedDurationMinutes = numeric;
    room.plannedEndAt = null;
  }

  extendSession(room, user) {
    this.requireTeacher(room, user);
    ensureSessionClock(room);
    if (room.status !== "ACTIVE" || room.phase !== "STATION") throw new Error("Продлить занятие можно в фазе станции после завершения текущего раунда.");
    if (room.finalRoundActive) throw new Error("Финальный вопрос уже выбран — продление больше недоступно.");
    if (!sessionExpired(room)) throw new Error("Запланированное время занятия ещё не закончилось.");
    const decisionAt = Date.now();
    room.plannedEndAt = decisionAt + SESSION_EXTENSION_MINUTES * 60_000;
    room.extensionMinutes = Number(room.extensionMinutes || 0) + SESSION_EXTENSION_MINUTES;
    room.sessionDecision = "EXTENDED";
    room.sessionDecisionAt = decisionAt;
  }

  async startFinalRound(room, user) {
    this.requireTeacher(room, user);
    ensureSessionClock(room);
    if (room.status !== "ACTIVE" || room.phase !== "STATION") throw new Error("Финальный вопрос можно запустить после завершения текущего раунда, в фазе станции.");
    if (room.finalRoundActive) throw new Error("Финальный вопрос уже запущен.");
    if (!sessionExpired(room)) throw new Error("Финальный вопрос становится доступен после окончания запланированного времени.");

    await super.startQuestion(room, user);
    const decisionAt = Date.now();
    const normalRemainingMs = Math.max(1_000, Number(room.deadline || decisionAt) - decisionAt);
    const acceleratedSeconds = Math.max(10, Math.ceil(normalRemainingMs / 2_000));
    room.deadline = decisionAt + acceleratedSeconds * 1_000;
    room.finalRoundActive = true;
    room.finalRoundNumber = Number(room.round);
    room.finalRoundStartedAt = decisionAt;
    room.finalRoundAnswerSeconds = acceleratedSeconds;
    room.finalStationPending = false;
    room.sessionDecision = "FINAL_ROUND";
    room.sessionDecisionAt = decisionAt;
  }

  finishFinalRound(room, user) {
    this.requireTeacher(room, user);
    ensureSessionClock(room);
    if (!room.finalRoundActive || !room.finalStationPending || room.phase !== "STATION") {
      throw new Error("Сначала завершите финальный вопрос и перейдите к последней фазе станции.");
    }
    this.endSession(room, user);
    room.finalStationPending = false;
    room.sessionDecision = "FINAL_COMPLETE";
    room.sessionDecisionAt = Date.now();
  }

  async sessionCommand(body, user, locale) {
    const requestId = String(body.requestId || "");
    if (!requestId) return responseJson({ error: "requestId обязателен" }, 400);
    const key = `idempotency:${userKey(user)}:${requestId}`;
    const previous = await this.state.storage.get(key);
    if (previous) return responseJson(previous);

    let room = await this.load();
    if (!room) return responseJson({ error: "Комната не найдена" }, 404);
    let event = "ROOM_SNAPSHOT";
    try {
      const payload = body.payload || {};
      if (body.type === "SET_SESSION_DURATION") {
        this.setSessionDuration(room, user, payload.minutes);
        event = "SESSION_DURATION_SET";
      } else if (body.type === "EXTEND_SESSION") {
        this.extendSession(room, user);
        event = "SESSION_EXTENDED";
      } else if (body.type === "START_FINAL_ROUND") {
        await this.startFinalRound(room, user);
        event = "FINAL_ROUND_STARTED";
      } else if (body.type === "FINISH_FINAL_ROUND") {
        this.finishFinalRound(room, user);
        event = "GAME_FINISHED";
      } else {
        return responseJson({ error: "Неизвестная команда" }, 400);
      }

      room = await this.save(room);
      const snapshotRequest = new Request(`https://game-room.internal/snapshot?locale=${encodeURIComponent(locale || "ru")}`, {
        method: "GET",
        headers: {
          "X-Game-User": JSON.stringify(user),
          "X-Game-Locale": locale || "ru"
        }
      });
      const snapshotResponse = await super.fetch(snapshotRequest);
      const snapshot = await snapshotResponse.json();
      if (!snapshotResponse.ok) return responseJson(snapshot, snapshotResponse.status);
      const response = { ok: true, state: snapshot.state, event };
      await this.state.storage.put(key, response, { expirationTtl: 86400 });
      await this.emit(room, event, { roomId: room.roomId, plannedEndAt: room.plannedEndAt, finalRoundNumber: room.finalRoundNumber });
      await this.persist(room, body.type, user, requestId);
      return responseJson(response);
    } catch (error) {
      return responseJson({ error: error?.message || "Session timing error" }, error?.status || 400);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/command" && request.method === "POST") {
      const body = await request.clone().json().catch(() => ({}));
      if (["SET_SESSION_DURATION", "EXTEND_SESSION", "START_FINAL_ROUND", "FINISH_FINAL_ROUND"].includes(String(body.type || ""))) {
        let user = null;
        try { user = JSON.parse(request.headers.get("X-Game-User") || "null"); } catch {}
        return this.sessionCommand(body, user, localeOf(request));
      }
    }
    return super.fetch(request);
  }
}
