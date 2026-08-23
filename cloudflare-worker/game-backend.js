const TOPICS = {
  PLANETS: { label: "🟣 Планеты" },
  SATELLITES: { label: "🔵 Спутники" },
  TELESCOPES: { label: "🟢 Телескопы" },
  ROVERS: { label: "🟠 Марсоходы" },
  TURKISH_SATELLITES: { label: "🟡 Турецкие спутники" }
};

const PRESENTATION_MODES = {
  "3D": { label: "3D · ноутбуки на столах", description: "Полный интерфейс станции на ноутбуке каждого игрока." },
  "AR": { label: "AR · телефоны и якоря", description: "Интерфейс станции поверх камеры телефона с якорем на столе." }
};
const MODES = {
  SPRINT: { label: "⚡ Спринт", answer: { EASY: 12, NORMAL: 17, HARD: 22, EXPERT: 27 } },
  STANDARD: { label: "⚖️ Стандарт", answer: { EASY: 15, NORMAL: 24, HARD: 30, EXPERT: 36 } },
  LEARNING: { label: "🐢 Обучение", answer: { EASY: 20, NORMAL: 30, HARD: 38, EXPERT: 45 } }
};
const ECON = { start: 300, participation: 10, winner: 30, graduation: 350, small: 650, large: 950 };
const MAX = { small: 7, large: 3, knowledge: 4 };
const now = () => Date.now();
const clone = value => JSON.parse(JSON.stringify(value));
const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", ...headers } });

class GameError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replace(/ё/g, "е").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'`´]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}
function damerau(a, b) {
  const n = a.length, m = b.length, d = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[n][m];
}
function textMatches(value, accepted = []) {
  const given = normalize(value).replace(/\s/g, "");
  if (!given) return false;
  return accepted.some(answer => {
    const expected = normalize(answer).replace(/\s/g, "");
    if (!expected) return false;
    const len = Math.max(given.length, expected.length);
    const allowed = len <= 5 ? 1 : len <= 9 ? 2 : len <= 15 ? 3 : 4;
    return given === expected || damerau(given, expected) <= allowed;
  });
}
function userId(user) { return String(user.id || user.google_id || user.email || ""); }
function playerFor(state, uid) { return state.players.find(player => player.userId === uid); }
function isTeacher(state, uid) { return state.teacherUserId === uid; }
function safeQuestion(question, role, phase) {
  if (!question) return null;
  const output = clone(question);
  if (phase !== "RESULT" && phase !== "ENDGAME") {
    delete output.correct;
    delete output.answers;
    delete output.tolerance;
    if (role !== "teacher") delete output.explanation;
  }
  return output;
}
function safeState(state, user) {
  const viewerId = userId(user);
  const role = isTeacher(state, viewerId) ? "teacher" : "player";
  const output = clone(state);
  output.presentationMode = PRESENTATION_MODES[state.presentationMode] ? state.presentationMode : "3D";
  output.presentation = PRESENTATION_MODES[output.presentationMode];
  output.currentQuestion = safeQuestion(state.currentQuestion, role, state.phase);
  output.players = output.players.map(player => {
    const item = { ...player, lastAnswer: null };
    delete item.userId;
    delete item.email;
    if (role !== "teacher" && player.userId !== viewerId) item.answered = !!player.answered;
    return item;
  });
  output.viewerPlayerId = playerFor(state, viewerId)?.id || null;
  if (role !== "teacher") output.results = state.phase === "RESULT" || state.phase === "ENDGAME" ? clone(state.results) : null;
  return { ...output, role };
}

function initialState(roomId, code, mode, teacher, presentationMode = "3D") {
  return {
    roomId, code, status: "LOBBY", phase: "LOBBY", mode: MODES[mode] ? mode : "STANDARD", presentationMode: PRESENTATION_MODES[presentationMode] ? presentationMode : "3D", round: 0,
    teacherUserId: userId(teacher), teacher: { name: teacher.name || teacher.email || "Учитель", email: teacher.email || "" },
    players: [], usedQuestionIds: [], topicBag: [], currentQuestion: null, deadline: null, startedAt: null,
    results: null, winnerId: null, createdAt: now(), updatedAt: now(), version: 1, anchorProtocol: "TABLE_ANCHOR_V1", sessionId: id()
  };
}

export class GameRoomDO {
  constructor(state, env) { this.state = state; this.env = env; this.subscribers = new Map(); }
  async load() { return (await this.state.storage.get("room")) || null; }
  async save(room) { room.updatedAt = now(); room.version = Number(room.version || 0) + 1; await this.state.storage.put("room", room); return room; }
  async emit(room, type, payload = {}) {
    for (const [controller, subscriber] of this.subscribers) {
      try {
        const message = JSON.stringify({ type, payload, state: safeState(room, subscriber.user) });
        controller.enqueue(`event: ${type}\ndata: ${message}\n\n`);
      } catch { this.subscribers.delete(controller); }
    }
  }
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const user = JSON.parse(request.headers.get("X-Game-User") || "null");
      if (url.pathname === "/init" && request.method === "POST") {
        const body = await request.json();
        const current = await this.load();
        if (!current) { const room = initialState(body.roomId, body.code, body.mode, user, body.presentationMode); await this.save(room); return json({ ok: true, state: safeState(room, user) }); }
        return json({ ok: true, state: safeState(current, user) });
      }
      if (url.pathname === "/snapshot") {
        const room = await this.load();
        if (!room) throw new GameError("Комната не найдена", 404);
        if (!isTeacher(room, userId(user)) && !playerFor(room, userId(user))) throw new GameError("Нет доступа к комнате", 403);
        return json({ ok: true, state: safeState(room, user) });
      }
      if (url.pathname === "/events") return this.events(user);
      if (url.pathname === "/command" && request.method === "POST") return this.command(request, user);
      return json({ error: "Not found" }, 404);
    } catch (error) { return json({ error: error.message || "Internal game error" }, error.status || 500); }
  }
  async events(user) {
    const room = await this.load();
    if (!room) throw new GameError("Комната не найдена", 404);
    if (!isTeacher(room, userId(user)) && !playerFor(room, userId(user))) throw new GameError("Нет доступа к комнате", 403);
    const encoder = new TextEncoder();
    let controllerRef;
    let heartbeat;
    const stream = new ReadableStream({
      start: controller => { controllerRef = controller; this.subscribers.set(controller, { user }); controller.enqueue(encoder.encode(`event: ROOM_SNAPSHOT\ndata: ${JSON.stringify({ type: "ROOM_SNAPSHOT", state: safeState(room, user) })}\n\n`)); heartbeat = setInterval(() => { try { controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`)); } catch { clearInterval(heartbeat); this.subscribers.delete(controller); } }, 15000); },
      cancel: () => { clearInterval(heartbeat); if (controllerRef) this.subscribers.delete(controllerRef); }
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  }
  async command(request, user) {
    const body = await request.json();
    const requestId = String(body.requestId || "");
    if (!requestId) throw new GameError("requestId обязателен");
    const key = `idempotency:${userId(user)}:${requestId}`;
    const previous = await this.state.storage.get(key);
    if (previous) return json(previous);
    let room = await this.load();
    if (!room) throw new GameError("Комната не найдена", 404);
    const type = String(body.type || "");
    const payload = body.payload || {};
    let event = "ROOM_SNAPSHOT";
    if (type === "JOIN_GAME_ROOM") { this.join(room, user); event = "PLAYER_JOINED"; }
    else if (type === "SET_COMPANY_NAME") { this.setCompany(room, user, payload.name); event = "PLAYER_UPDATED"; }
    else if (type === "SELECT_START_CADETS") { this.setCadets(room, user, payload.topics); event = "PLAYER_UPDATED"; }
    else if (type === "START_GAME") { this.startGame(room, user); event = "GAME_STARTED"; }
    else if (type === "SUBMIT_ANSWER") { this.submit(room, user, payload.value); event = "ANSWER_ACCEPTED"; }
    else if (type === "CLOSE_ANSWERS") { this.reveal(room, user); event = "ROUND_RESULT"; }
    else if (type === "START_NEXT_ROUND") { await this.startQuestion(room, user); event = "QUESTION_STARTED"; }
    else if (type === "START_STATION_PHASE") { this.startStation(room, user); event = "STATION_PHASE_STARTED"; }
    else if (type === "RECRUIT_CADET") { this.recruit(room, user, payload.topic); event = "CADET_UPDATED"; }
    else if (type === "BUY_MODULE") { this.buyModule(room, user, payload.type); event = "MODULE_BUILT"; }
    else if (type === "END_SESSION") { this.endSession(room, user); event = "GAME_FINISHED"; }
    else if (type === "REQUEST_ROOM_SNAPSHOT") { /* no mutation */ }
    else throw new GameError("Неизвестная команда");
    room = await this.save(room);
    const response = { ok: true, state: safeState(room, user), event };
    await this.state.storage.put(key, response, { expirationTtl: 86400 });
    await this.emit(room, event, { roomId: room.roomId });
    await this.persist(room, type, user, requestId);
    return json(response);
  }
  join(room, user) {
    const uid = userId(user);
    if (isTeacher(room, uid)) throw new GameError("Учитель не может быть игроком");
    if (room.players.some(player => player.userId === uid)) return;
    if (room.status !== "LOBBY") throw new GameError("Игра уже началась");
    if (room.players.length >= 10) throw new GameError("В комнате уже 10 игроков");
    const stationNumber = room.players.length + 1;
    room.players.push({ id: id(), userId: uid, name: user.name || user.email || "Игрок", email: user.email || "", company: "", ready: false, credits: ECON.start, small: 1, large: 1, seatCapacity: 5, cadets: [], graduates: 0, correct: 0, wins: 0, answered: false, lastAnswer: null, moduleBoughtRound: 0, online: true, stationNumber, anchor: { id: `TABLE-${String(stationNumber).padStart(2, "0")}`, label: `Якорь стола ${stationNumber}`, protocol: "TABLE_ANCHOR_V1" } });
  }
  requireTeacher(room, user) { if (!isTeacher(room, userId(user))) throw new GameError("Только учитель может выполнить это действие", 403); }
  getPlayer(room, user) { const player = playerFor(room, userId(user)); if (!player) throw new GameError("Игрок не найден", 403); return player; }
  setCompany(room, user, name) { const player = this.getPlayer(room, user); const value = String(name || "").trim(); if (value.length < 3 || value.length > 20) throw new GameError("Название: 3–20 символов"); if (room.players.some(item => item.id !== player.id && normalize(item.company) === normalize(value))) throw new GameError("Это название уже занято"); player.company = value; }
  setCadets(room, user, topics) { const player = this.getPlayer(room, user); if (!Array.isArray(topics) || topics.length !== 3 || new Set(topics).size !== 3 || topics.some(topic => !TOPICS[topic])) throw new GameError("Выбери ровно 3 направления"); player.cadets = topics.map(topic => ({ id: id(), topic, knowledge: 0, status: "ACTIVE" })); player.ready = !!player.company; }
  startGame(room, user) { this.requireTeacher(room, user); if (room.players.length < 2) throw new GameError("Нужно минимум 2 игрока"); if (room.players.some(player => !player.ready)) throw new GameError("Не все игроки готовы"); room.status = "ACTIVE"; room.phase = "STATION"; room.round = 0; room.startedAt = now(); }
  async startQuestion(room, user) { this.requireTeacher(room, user); if (!["STATION", "RESULT"].includes(room.phase)) throw new GameError("Сейчас нельзя запускать вопрос"); const questions = await this.questions(); const availableTopics = Object.keys(TOPICS); if (!room.topicBag.length) room.topicBag = availableTopics.sort(() => Math.random() - 0.5); const topic = room.topicBag.shift(); let pool = questions.filter(q => q.topic === topic && !room.usedQuestionIds.includes(q.id)); if (!pool.length) pool = questions.filter(q => q.topic === topic); if (!pool.length) throw new GameError("Нет вопросов для этой темы", 500); const question = clone(pool[Math.floor(Math.random() * pool.length)]); room.usedQuestionIds.push(question.id); room.round += 1; room.phase = "QUESTION"; room.results = null; room.players.forEach(player => { player.answered = false; player.lastAnswer = null; }); room.currentQuestion = question; room.deadline = now() + (MODES[room.mode]?.answer?.[question.difficulty] || 20) * 1000; }
  submit(room, user, value) { const player = this.getPlayer(room, user); if (room.phase !== "QUESTION") throw new GameError("Сейчас нельзя отвечать"); if (player.answered) throw new GameError("Вы уже отвечали на этот вопрос"); if (room.currentQuestion.type === "NUMBER") { const number = Number(String(value).replace(",", ".").replace(/\s/g, "")); if (!Number.isFinite(number)) throw new GameError("Введите число"); player.lastAnswer = number; } else { const text = String(value || "").trim(); if (!text) throw new GameError("Введите ответ"); player.lastAnswer = text; } player.answered = true; }
  reveal(room, user) { this.requireTeacher(room, user); if (room.phase !== "QUESTION") throw new GameError("Нет активного вопроса"); const q = room.currentQuestion; const scored = room.players.map(player => { const submitted = player.lastAnswer !== null && player.lastAnswer !== undefined; if (!submitted) return { player, submitted: false, valid: false, distance: null }; if (q.type === "NUMBER") { const distance = Math.abs(Number(player.lastAnswer) - Number(q.correct)); return { player, submitted: true, valid: distance <= Number(q.tolerance || 0), distance }; } return { player, submitted: true, valid: textMatches(player.lastAnswer, q.answers || q.acceptedAnswers || []) , distance: null }; }); const submitted = scored.filter(item => item.submitted); const winners = q.type === "NUMBER" && submitted.length ? submitted.filter(item => item.distance === Math.min(...submitted.map(item => item.distance))).map(item => item.player.id) : scored.filter(item => item.valid).map(item => item.player.id); const items = scored.map(item => { const player = item.player; let credits = item.submitted ? ECON.participation : 0; let knowledge = 0; const changes = []; const grads = []; if (item.submitted) player.credits += ECON.participation; const winner = winners.includes(player.id); if (winner) { player.credits += ECON.winner; player.wins += 1; credits += ECON.winner; } if (item.valid) { player.correct += 1; knowledge = winner ? 2 : 1; let left = knowledge; for (const cadet of player.cadets.filter(cadet => cadet.status === "ACTIVE" && cadet.topic === q.topic).sort((a, b) => b.knowledge - a.knowledge)) { if (!left) break; const before = cadet.knowledge; cadet.knowledge += Math.min(left, MAX.knowledge - cadet.knowledge); left -= cadet.knowledge - before; changes.push({ cadetId: cadet.id, before, after: cadet.knowledge }); if (cadet.knowledge >= MAX.knowledge) { cadet.status = "GRADUATED"; player.graduates += 1; player.credits += ECON.graduation; grads.push({ cadetId: cadet.id, reward: ECON.graduation }); } } } return { playerId: player.id, company: player.company, answer: player.lastAnswer, submitted: item.submitted, valid: item.valid, distance: item.distance, isWinner: winner, credits, knowledge, changes, grads }; }); room.results = { questionId: q.id, correct: q.type === "NUMBER" ? q.correct : (q.answers?.[0] || q.acceptedAnswers?.[0] || ""), explanation: q.explanation || "", items }; room.phase = "RESULT"; room.deadline = null; }
  startStation(room, user) { this.requireTeacher(room, user); if (room.phase !== "RESULT") throw new GameError("Сначала покажите результат"); room.phase = "STATION"; room.deadline = null; }
  recruit(room, user, topic) { const player = this.getPlayer(room, user); if (room.phase !== "STATION") throw new GameError("Сейчас нельзя принимать кадетов"); const active = player.cadets.filter(cadet => cadet.status === "ACTIVE").length; if (active >= player.seatCapacity) throw new GameError("Нет свободных мест"); if (!TOPICS[topic]) throw new GameError("Неизвестная специализация"); player.cadets.push({ id: id(), topic, knowledge: 0, status: "ACTIVE" }); }
  buyModule(room, user, type) { const player = this.getPlayer(room, user); if (room.phase !== "STATION") throw new GameError("Сейчас нельзя строить"); if (player.moduleBoughtRound === room.round && room.round > 0) throw new GameError("В этом раунде модуль уже построен"); if (type === "SMALL") { if (player.small >= MAX.small) throw new GameError("Малых модулей уже 7/7"); if (player.credits < ECON.small) throw new GameError("Недостаточно кредитов"); player.credits -= ECON.small; player.small += 1; player.seatCapacity += 2; } else if (type === "LARGE") { if (player.large >= MAX.large) throw new GameError("Больших модулей уже 3/3"); if (player.credits < ECON.large) throw new GameError("Недостаточно кредитов"); player.credits -= ECON.large; player.large += 1; player.seatCapacity += 3; } else throw new GameError("Неизвестный тип модуля"); player.moduleBoughtRound = room.round; if (player.small === MAX.small && player.large === MAX.large) { room.winnerId = player.id; room.status = "FINISHED"; room.phase = "ENDGAME"; } }
  endSession(room, user) { this.requireTeacher(room, user); room.status = "FINISHED"; room.phase = "ENDGAME"; room.deadline = null; }
  async questions() { const url = this.env.QUESTIONS_URL || "https://albaspace.com.tr/game/AlbaSpace/ru/data/questions.ru.json"; const response = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } }); if (!response.ok) throw new GameError("Не удалось загрузить базу вопросов", 503); return response.json(); }
  async persist(room, event, user, requestId) { try { await this.env.DB.prepare("UPDATE game_rooms SET state_json = ?, phase = ?, status = ?, updated_at = ? WHERE room_id = ?").bind(JSON.stringify(room), room.phase, room.status, Math.floor(now() / 1000), room.roomId).run(); await this.env.DB.prepare("INSERT INTO game_events (room_id, event_type, actor_user_id, request_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(room.roomId, event, userId(user), requestId, JSON.stringify({ phase: room.phase, round: room.round }), Math.floor(now() / 1000)).run(); } catch (error) { console.error("game persistence failed", error); } }
}

export async function handleGameRequest(request, env, user, cors) {
  const url = new URL(request.url);
  const headers = { ...cors, "Cache-Control": "no-store" };
  const roomMatch = url.pathname.match(/^\/api\/game\/rooms\/([^/]+)(?:\/(snapshot|events|command))?$/);
  try {
    if (url.pathname === "/api/game/rooms" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const mode = MODES[body.mode] ? body.mode : "STANDARD";
      const presentationMode = PRESENTATION_MODES[body.presentationMode] ? body.presentationMode : "3D";
      let roomId = id(), code = String(10000 + Math.floor(Math.random() * 90000));
      for (let attempt = 0; attempt < 8; attempt++) { try { await env.DB.prepare("INSERT INTO game_rooms (room_id, join_code, teacher_user_id, mode, status, phase, state_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'LOBBY', 'LOBBY', ?, ?, ?)").bind(roomId, code, userId(user), mode, "{}", Math.floor(now() / 1000), Math.floor(now() / 1000)).run(); break; } catch (error) { if (attempt === 7) throw error; roomId = id(); code = String(10000 + Math.floor(Math.random() * 90000)); } }
      const result = await roomFetch(env, roomId, "/init", "POST", user, { roomId, code, mode, presentationMode });
      return json(result, 201, headers);
    }
    if (url.pathname === "/api/game/rooms/join" && request.method === "POST") {
      const { code } = await request.json().catch(() => ({}));
      const row = await env.DB.prepare("SELECT room_id FROM game_rooms WHERE join_code = ? LIMIT 1").bind(String(code || "").trim()).first();
      if (!row) throw new GameError("Комната не найдена", 404);
      return new Response(JSON.stringify(await roomFetch(env, row.room_id, "/command", "POST", user, { type: "JOIN_GAME_ROOM", requestId: id(), payload: {} })), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }
    if (!roomMatch) return json({ error: "Not found" }, 404, headers);
    const roomId = roomMatch[1], action = roomMatch[2] || "snapshot";
    if (action === "snapshot" && request.method === "GET") return new Response(JSON.stringify(await roomFetch(env, roomId, "/snapshot", "GET", user)), { headers: { ...headers, "Content-Type": "application/json" } });
    if (action === "events" && request.method === "GET") {
      const response = await roomFetch(env, roomId, "/events", "GET", user);
      const eventHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([key, value]) => eventHeaders.set(key, value));
      return new Response(response.body, { status: response.status, headers: eventHeaders });
    }
    if (action === "command" && request.method === "POST") return new Response(JSON.stringify(await roomFetch(env, roomId, "/command", "POST", user, await request.json())), { headers: { ...headers, "Content-Type": "application/json" } });
    return json({ error: "Method not allowed" }, 405, headers);
  } catch (error) { return json({ error: error.message || "Game backend error" }, error.status || 500, headers); }
}

async function roomFetch(env, roomId, path, method, user, body) {
  if (!env.GAME_ROOMS) throw new GameError("GAME_ROOMS Durable Object binding не настроен", 503);
  const stub = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(roomId));
  const response = await stub.fetch(`https://game-room.internal${path}`, { method, headers: { "Content-Type": "application/json", "X-Game-User": JSON.stringify(user) }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) { const data = await response.json().catch(() => ({ error: "Game backend error" })); throw new GameError(data.error || "Game backend error", response.status); }
  return response.json();
}
