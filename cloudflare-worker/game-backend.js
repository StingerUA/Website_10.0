const SUPPORTED_LOCALES = ["ru", "tr", "en"];
const localeOf = value => SUPPORTED_LOCALES.includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "ru";

const TOPICS = {
  PLANETS: true,
  SATELLITES: true,
  TELESCOPES: true,
  ROVERS: true,
  TURKISH_SATELLITES: true
};

const PRESENTATION_MODES = {
  "3D": {
    ru: { label: "3D · ноутбуки на столах", description: "Полный интерфейс станции на ноутбуке каждого игрока." },
    tr: { label: "3D · masadaki dizüstü bilgisayarlar", description: "Her oyuncunun dizüstü bilgisayarında tam istasyon arayüzü." },
    en: { label: "3D · laptops on the tables", description: "Full station interface on each player's laptop." }
  },
  "AR": {
    ru: { label: "AR · телефоны и якоря", description: "Интерфейс станции поверх камеры телефона с якорем на столе." },
    tr: { label: "AR · telefonlar ve masa işaretçileri", description: "İstasyon arayüzü, masadaki işaretçi üzerinden telefon kamerasına yerleştirilir." },
    en: { label: "AR · phones and table anchors", description: "The station interface is placed in the phone camera view using a table anchor." }
  }
};

const MODES = {
  SPRINT: { label: "⚡ Спринт", answer: { EASY: 12, NORMAL: 17, HARD: 22, EXPERT: 27 } },
  STANDARD: { label: "⚖️ Стандарт", answer: { EASY: 15, NORMAL: 24, HARD: 30, EXPERT: 36 } },
  LEARNING: { label: "🐢 Обучение", answer: { EASY: 20, NORMAL: 30, HARD: 38, EXPERT: 45 } }
};
const ECON = { start: 300, participation: 10, winner: 30, graduation: 350, small: 650, large: 950 };
const MAX = { small: 7, large: 3, knowledge: 4 };
const LARGE_ROLES = ["COMMAND", "SCIENCE", "OPERATIONS"];
const SMALL_VARIANTS = ["GENERAL", "NAVIGATION", "OBSERVATION", "COMMUNICATIONS"];
const LARGE_RADIAL_PORTS = ["RadialPort_01", "RadialPort_02", "RadialPort_03", "RadialPort_04"];
const CADET_NAMES = ["Deniz", "Ece", "Emir", "Lina", "Mert", "Ada", "Arda", "Selin", "Kerem", "Defne", "Elif", "Can", "Maya", "Leo", "Nora", "Eren"];
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
function userId(user) { return String(user?.id || user?.google_id || user?.email || ""); }
function playerFor(state, uid) { return state.players.find(player => player.userId === uid); }
function isTeacher(state, uid) { return state.teacherUserId === uid; }
function presentationFor(mode, locale) {
  const config = PRESENTATION_MODES[mode] || PRESENTATION_MODES["3D"];
  return config[localeOf(locale)] || config.ru;
}

/* =========================
 * Persistent station layout
 * ========================= */

function stationModuleId(player, type, ordinal) {
  return `module:${player.id}:${String(type).toLowerCase()}:${ordinal}`;
}
function crewSlotNames(module) {
  const count = module?.type === "LARGE" ? 3 : 2;
  return Array.from({ length: count }, (_, index) => `CrewSlot_0${index + 1}`);
}
function moduleCounts(player) {
  const modules = Array.isArray(player?.modules) ? player.modules : [];
  return {
    large: modules.filter(module => module.type === "LARGE").length,
    small: modules.filter(module => module.type === "SMALL").length
  };
}
function moduleCapacity(player) {
  const counts = moduleCounts(player);
  return counts.large * 3 + counts.small * 2;
}
function moduleById(player, moduleId) {
  return (player.modules || []).find(module => module.id === moduleId) || null;
}
function portOccupied(player, parentModuleId, parentPort) {
  return (player.modules || []).some(module => module.parentModuleId === parentModuleId && module.parentPort === parentPort);
}
function makeLargeModule(player, ordinal, parent = null, round = 0) {
  const index = ordinal - 1;
  return {
    id: stationModuleId(player, "LARGE", ordinal),
    type: "LARGE",
    role: LARGE_ROLES[index] || "OPERATIONS",
    visualVariant: LARGE_ROLES[index] || "OPERATIONS",
    parentModuleId: parent?.id || null,
    parentPort: parent ? "AxialPort_B" : null,
    ownPort: parent ? "AxialPort_A" : null,
    branchDepth: 0,
    spineIndex: index,
    createdRound: Number(round || 0)
  };
}
function makeSmallModule(player, ordinal, parent, parentPort, round = 0) {
  const depth = parent?.type === "SMALL" ? Number(parent.branchDepth || 1) + 1 : 1;
  return {
    id: stationModuleId(player, "SMALL", ordinal),
    type: "SMALL",
    role: "SMALL",
    visualVariant: SMALL_VARIANTS[(ordinal - 1) % SMALL_VARIANTS.length],
    parentModuleId: parent?.id || null,
    parentPort: parentPort || null,
    ownPort: parent ? "PrimaryPort" : null,
    branchDepth: depth,
    spineIndex: null,
    createdRound: Number(round || 0)
  };
}
function createStartingModules(player) {
  const command = makeLargeModule(player, 1, null, 0);
  const small = makeSmallModule(player, 1, command, "RadialPort_01", 0);
  return [command, small];
}
function autoPlacement(player, type, round = 0) {
  const counts = moduleCounts(player);
  if (type === "LARGE") {
    if (counts.large >= MAX.large) throw new GameError("Больших модулей уже 3/3");
    const largeModules = player.modules.filter(module => module.type === "LARGE").sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
    const parent = largeModules[largeModules.length - 1];
    if (!parent) throw new GameError("У станции нет центрального модуля");
    if (portOccupied(player, parent.id, "AxialPort_B")) throw new GameError("Центральная ось станции занята");
    return makeLargeModule(player, counts.large + 1, parent, round);
  }

  if (type !== "SMALL") throw new GameError("Неизвестный тип модуля");
  if (counts.small >= MAX.small) throw new GameError("Малых модулей уже 7/7");

  const largeModules = player.modules.filter(module => module.type === "LARGE").sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
  for (const parent of largeModules) {
    for (const port of LARGE_RADIAL_PORTS) {
      if (!portOccupied(player, parent.id, port)) return makeSmallModule(player, counts.small + 1, parent, port, round);
    }
  }

  const depthOneSmalls = player.modules.filter(module => module.type === "SMALL" && Number(module.branchDepth) === 1);
  for (const parent of depthOneSmalls) {
    if (!portOccupied(player, parent.id, "ExtensionPort")) return makeSmallModule(player, counts.small + 1, parent, "ExtensionPort", round);
  }
  throw new GameError("Нет свободной точки стыковки для малого модуля");
}
function selectedPlacement(player, type, parentModuleId, parentPort, round = 0) {
  if (!parentModuleId && !parentPort) return autoPlacement(player, type, round);
  const counts = moduleCounts(player);
  const parent = moduleById(player, parentModuleId);
  if (!parent) throw new GameError("Точка стыковки больше не существует");
  if (portOccupied(player, parent.id, parentPort)) throw new GameError("Эта точка стыковки уже занята");

  if (type === "LARGE") {
    if (counts.large >= MAX.large) throw new GameError("Больших модулей уже 3/3");
    const largeModules = player.modules.filter(module => module.type === "LARGE").sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
    const lastLarge = largeModules[largeModules.length - 1];
    if (parent.type !== "LARGE" || parent.id !== lastLarge?.id || parentPort !== "AxialPort_B") {
      throw new GameError("Большой модуль можно добавить только в конец центральной оси");
    }
    return makeLargeModule(player, counts.large + 1, parent, round);
  }

  if (type === "SMALL") {
    if (counts.small >= MAX.small) throw new GameError("Малых модулей уже 7/7");
    if (parent.type === "LARGE") {
      if (!LARGE_RADIAL_PORTS.includes(parentPort)) throw new GameError("Малый модуль можно стыковать только к боковому порту большого модуля");
      return makeSmallModule(player, counts.small + 1, parent, parentPort, round);
    }
    if (parent.type === "SMALL") {
      if (Number(parent.branchDepth) !== 1 || parentPort !== "ExtensionPort") {
        throw new GameError("Ветка может содержать максимум два малых модуля подряд");
      }
      return makeSmallModule(player, counts.small + 1, parent, parentPort, round);
    }
  }

  throw new GameError("Недопустимая точка стыковки");
}
function validateStationGraph(player) {
  const modules = Array.isArray(player.modules) ? player.modules : [];
  if (!modules.length) throw new GameError("У игрока отсутствует станция", 500);
  const ids = new Set();
  const occupied = new Set();
  const counts = moduleCounts(player);
  if (counts.large < 1 || counts.large > MAX.large || counts.small < 1 || counts.small > MAX.small) throw new GameError("Некорректный состав станции", 500);

  for (const module of modules) {
    if (!module.id || ids.has(module.id)) throw new GameError("Дублирующийся модуль станции", 500);
    ids.add(module.id);
  }

  const largeModules = modules.filter(module => module.type === "LARGE").sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
  largeModules.forEach((module, index) => {
    if (Number(module.spineIndex) !== index || Number(module.branchDepth) !== 0) throw new GameError("Нарушена центральная ось станции", 500);
    if (index === 0) {
      if (module.parentModuleId !== null || module.parentPort !== null) throw new GameError("Командный модуль должен быть корнем станции", 500);
    } else {
      const parent = moduleById(player, module.parentModuleId);
      if (!parent || parent.type !== "LARGE" || Number(parent.spineIndex) !== index - 1 || module.parentPort !== "AxialPort_B" || module.ownPort !== "AxialPort_A") {
        throw new GameError("Большие модули должны образовывать непрерывную ось L-L-L", 500);
      }
    }
  });

  for (const module of modules.filter(item => item.type === "SMALL")) {
    const parent = moduleById(player, module.parentModuleId);
    if (!parent) throw new GameError("У малого модуля нет родительского модуля", 500);
    if (parent.type === "LARGE") {
      if (Number(module.branchDepth) !== 1 || !LARGE_RADIAL_PORTS.includes(module.parentPort)) throw new GameError("Некорректная ветка малого модуля", 500);
    } else if (parent.type === "SMALL") {
      if (Number(parent.branchDepth) !== 1 || Number(module.branchDepth) !== 2 || module.parentPort !== "ExtensionPort") {
        throw new GameError("Ветка S-S-S запрещена", 500);
      }
    } else throw new GameError("Некорректный родитель малого модуля", 500);

    if (module.ownPort !== "PrimaryPort") throw new GameError("Некорректный порт малого модуля", 500);
  }

  for (const module of modules) {
    if (!module.parentModuleId || !module.parentPort) continue;
    const key = `${module.parentModuleId}:${module.parentPort}`;
    if (occupied.has(key)) throw new GameError("Один docking port занят двумя модулями", 500);
    occupied.add(key);
  }
  return true;
}
function syncPlayerCounts(player) {
  const counts = moduleCounts(player);
  player.large = counts.large;
  player.small = counts.small;
  player.seatCapacity = moduleCapacity(player);
}
function findFreeCrewSlot(player, preferredModuleId = null, preferredSlotId = null) {
  const active = (player.cadets || []).filter(cadet => cadet.status === "ACTIVE");
  const occupied = new Set(active.filter(cadet => cadet.moduleId && cadet.slotId).map(cadet => `${cadet.moduleId}:${cadet.slotId}`));
  const moduleOrder = [...(player.modules || [])].sort((a, b) => {
    if (a.type !== b.type) return a.type === "LARGE" ? -1 : 1;
    if (a.type === "LARGE") return Number(a.spineIndex || 0) - Number(b.spineIndex || 0);
    return String(a.id).localeCompare(String(b.id));
  });

  if (preferredModuleId && preferredSlotId) {
    const module = moduleById(player, preferredModuleId);
    if (!module || !crewSlotNames(module).includes(preferredSlotId)) throw new GameError("Такого места экипажа нет");
    const key = `${module.id}:${preferredSlotId}`;
    if (occupied.has(key)) throw new GameError("Это место уже занято");
    return { moduleId: module.id, slotId: preferredSlotId };
  }

  for (const module of moduleOrder) {
    for (const slotId of crewSlotNames(module)) {
      if (!occupied.has(`${module.id}:${slotId}`)) return { moduleId: module.id, slotId };
    }
  }
  return null;
}
function ensureCadetAssignments(player) {
  let changed = false;
  const used = new Set();
  for (const cadet of (player.cadets || []).filter(item => item.status === "ACTIVE")) {
    const module = moduleById(player, cadet.moduleId);
    const valid = module && crewSlotNames(module).includes(cadet.slotId) && !used.has(`${cadet.moduleId}:${cadet.slotId}`);
    if (valid) {
      used.add(`${cadet.moduleId}:${cadet.slotId}`);
      continue;
    }
    cadet.moduleId = null;
    cadet.slotId = null;
    changed = true;
  }

  for (const cadet of (player.cadets || []).filter(item => item.status === "ACTIVE" && (!item.moduleId || !item.slotId))) {
    const free = findFreeCrewSlot(player);
    if (!free) break;
    cadet.moduleId = free.moduleId;
    cadet.slotId = free.slotId;
    used.add(`${free.moduleId}:${free.slotId}`);
    changed = true;
  }
  return changed;
}
function ensurePlayerStationLayout(player) {
  let changed = false;
  if (!Array.isArray(player.modules) || !player.modules.length) {
    const legacyLarge = Math.max(1, Math.min(MAX.large, Number(player.large || 1)));
    const legacySmall = Math.max(1, Math.min(MAX.small, Number(player.small || 1)));
    player.modules = createStartingModules(player);
    changed = true;
    while (moduleCounts(player).large < legacyLarge) player.modules.push(autoPlacement(player, "LARGE", 0));
    while (moduleCounts(player).small < legacySmall) player.modules.push(autoPlacement(player, "SMALL", 0));
  }

  for (const module of player.modules) {
    if (module.type === "LARGE") {
      const index = Number.isFinite(Number(module.spineIndex)) ? Number(module.spineIndex) : player.modules.filter(item => item.type === "LARGE").indexOf(module);
      if (module.branchDepth !== 0) { module.branchDepth = 0; changed = true; }
      if (!module.role) { module.role = LARGE_ROLES[index] || "OPERATIONS"; changed = true; }
      if (!module.visualVariant) { module.visualVariant = module.role; changed = true; }
      if (module.spineIndex !== index) { module.spineIndex = index; changed = true; }
    } else if (module.type === "SMALL") {
      if (!module.role) { module.role = "SMALL"; changed = true; }
      if (!module.visualVariant) { module.visualVariant = "GENERAL"; changed = true; }
    }
    if (module.createdRound === undefined) { module.createdRound = 0; changed = true; }
  }

  syncPlayerCounts(player);
  if (ensureCadetAssignments(player)) changed = true;
  validateStationGraph(player);
  return changed;
}
function ensureRoomStationLayouts(room) {
  let changed = false;
  for (const player of room?.players || []) if (ensurePlayerStationLayout(player)) changed = true;
  return changed;
}

function localizedQuestion(state, locale) {
  const lang = localeOf(locale);
  const byLocale = state.currentQuestionI18n || null;
  return clone(byLocale?.[lang] || byLocale?.ru || byLocale?.tr || byLocale?.en || state.currentQuestion || null);
}
function safeQuestion(question, role, phase) {
  if (!question) return null;
  const output = clone(question);
  if (phase !== "RESULT" && phase !== "ENDGAME") {
    delete output.correct;
    delete output.answers;
    delete output.tolerance;
    delete output.acceptedAnswers;
    if (role !== "teacher") delete output.explanation;
  }
  return output;
}
function localizeResults(results, locale) {
  if (!results) return null;
  const lang = localeOf(locale);
  const output = clone(results);
  if (output.correctByLocale) output.correct = output.correctByLocale[lang] ?? output.correctByLocale.ru ?? output.correct;
  if (output.explanationByLocale) output.explanation = output.explanationByLocale[lang] ?? output.explanationByLocale.ru ?? output.explanation;
  delete output.correctByLocale;
  delete output.explanationByLocale;
  return output;
}
function safeState(state, user, locale = "ru") {
  const lang = localeOf(locale);
  const viewerId = userId(user);
  const role = isTeacher(state, viewerId) ? "teacher" : "player";
  const output = clone(state);
  output.presentationMode = PRESENTATION_MODES[state.presentationMode] ? state.presentationMode : "3D";
  output.presentation = presentationFor(output.presentationMode, lang);
  output.locale = lang;
  output.currentQuestion = safeQuestion(localizedQuestion(state, lang), role, state.phase);
  delete output.currentQuestionI18n;
  output.players = output.players.map(player => {
    const item = { ...player, lastAnswer: player.userId === viewerId ? player.lastAnswer : null };
    delete item.userId;
    delete item.email;
    if (role !== "teacher" && player.userId !== viewerId) item.answered = !!player.answered;
    return item;
  });
  output.viewerPlayerId = playerFor(state, viewerId)?.id || null;
  if (state.phase === "RESULT" || state.phase === "ENDGAME") output.results = localizeResults(state.results, lang);
  else if (role !== "teacher") output.results = null;
  return { ...output, role };
}

function initialState(roomId, code, mode, teacher, presentationMode = "3D", locale = "ru") {
  const creatorLocale = localeOf(locale);
  return {
    roomId, code, status: "LOBBY", phase: "LOBBY", mode: MODES[mode] ? mode : "STANDARD",
    presentationMode: PRESENTATION_MODES[presentationMode] ? presentationMode : "3D",
    locale: creatorLocale, creatorLocale, round: 0,
    teacherUserId: userId(teacher), teacher: { name: teacher.name || teacher.email || "Учитель", email: teacher.email || "" },
    players: [], usedQuestionIds: [], topicBag: [], currentQuestion: null, currentQuestionI18n: null,
    deadline: null, startedAt: null, results: null, winnerId: null, createdAt: now(), updatedAt: now(), version: 1,
    anchorProtocol: "TABLE_ANCHOR_V1", sessionId: id()
  };
}

export class GameRoomDO {
  constructor(state, env) { this.state = state; this.env = env; this.subscribers = new Map(); }
  async load() {
    const room = (await this.state.storage.get("room")) || null;
    if (room && ensureRoomStationLayouts(room)) {
      room.updatedAt = now();
      await this.state.storage.put("room", room);
    }
    return room;
  }
  async save(room) {
    ensureRoomStationLayouts(room);
    room.updatedAt = now();
    room.version = Number(room.version || 0) + 1;
    await this.state.storage.put("room", room);
    return room;
  }
  async emit(room, type, payload = {}) {
    for (const [controller, subscriber] of this.subscribers) {
      try {
        const message = JSON.stringify({ type, payload, state: safeState(room, subscriber.user, subscriber.locale) });
        controller.enqueue(`event: ${type}\ndata: ${message}\n\n`);
      } catch { this.subscribers.delete(controller); }
    }
  }
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const user = JSON.parse(request.headers.get("X-Game-User") || "null");
      const locale = localeOf(request.headers.get("X-Game-Locale") || url.searchParams.get("locale") || "ru");
      if (url.pathname === "/init" && request.method === "POST") {
        const body = await request.json();
        const current = await this.load();
        if (!current) {
          const room = initialState(body.roomId, body.code, body.mode, user, body.presentationMode, body.locale || locale);
          await this.save(room);
          return json({ ok: true, state: safeState(room, user, locale) });
        }
        return json({ ok: true, state: safeState(current, user, locale) });
      }
      if (url.pathname === "/snapshot") {
        const room = await this.load();
        if (!room) throw new GameError("Комната не найдена", 404);
        if (!isTeacher(room, userId(user)) && !playerFor(room, userId(user))) throw new GameError("Нет доступа к комнате", 403);
        return json({ ok: true, state: safeState(room, user, locale) });
      }
      if (url.pathname === "/events") return this.events(user, locale);
      if (url.pathname === "/command" && request.method === "POST") return this.command(request, user, locale);
      return json({ error: "Not found" }, 404);
    } catch (error) { return json({ error: error.message || "Internal game error" }, error.status || 500); }
  }
  async events(user, locale) {
    const room = await this.load();
    if (!room) throw new GameError("Комната не найдена", 404);
    if (!isTeacher(room, userId(user)) && !playerFor(room, userId(user))) throw new GameError("Нет доступа к комнате", 403);
    const encoder = new TextEncoder();
    let controllerRef;
    let heartbeat;
    const stream = new ReadableStream({
      start: controller => {
        controllerRef = controller;
        this.subscribers.set(controller, { user, locale: localeOf(locale) });
        controller.enqueue(encoder.encode(`event: ROOM_SNAPSHOT\ndata: ${JSON.stringify({ type: "ROOM_SNAPSHOT", state: safeState(room, user, locale) })}\n\n`));
        heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`)); }
          catch { clearInterval(heartbeat); this.subscribers.delete(controller); }
        }, 15000);
      },
      cancel: () => { clearInterval(heartbeat); if (controllerRef) this.subscribers.delete(controllerRef); }
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  }
  async command(request, user, locale) {
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
    else if (type === "RECRUIT_CADET") { this.recruit(room, user, payload.topic, payload.moduleId, payload.slotId); event = "CADET_UPDATED"; }
    else if (type === "BUY_MODULE") { this.buyModule(room, user, payload.type, payload.parentModuleId, payload.parentPort); event = "MODULE_BUILT"; }
    else if (type === "END_SESSION") { this.endSession(room, user); event = "GAME_FINISHED"; }
    else if (type === "REQUEST_ROOM_SNAPSHOT") { /* no mutation */ }
    else throw new GameError("Неизвестная команда");
    room = await this.save(room);
    const response = { ok: true, state: safeState(room, user, locale), event };
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
    const player = {
      id: id(), userId: uid, name: user.name || user.email || "Игрок", email: user.email || "", company: "", ready: false,
      credits: ECON.start, small: 1, large: 1, seatCapacity: 5, modules: [], cadets: [], graduates: 0, correct: 0, wins: 0,
      answered: false, lastAnswer: null, moduleBoughtRound: 0, online: true, stationNumber,
      anchor: { id: `TABLE-${String(stationNumber).padStart(2, "0")}`, label: `Якорь стола ${stationNumber}`, protocol: "TABLE_ANCHOR_V1" }
    };
    player.modules = createStartingModules(player);
    syncPlayerCounts(player);
    validateStationGraph(player);
    room.players.push(player);
  }
  requireTeacher(room, user) { if (!isTeacher(room, userId(user))) throw new GameError("Только учитель может выполнить это действие", 403); }
  getPlayer(room, user) { const player = playerFor(room, userId(user)); if (!player) throw new GameError("Игрок не найден", 403); return player; }
  setCompany(room, user, name) {
    const player = this.getPlayer(room, user);
    const value = String(name || "").trim();
    if (value.length < 3 || value.length > 20) throw new GameError("Название: 3–20 символов");
    if (room.players.some(item => item.id !== player.id && normalize(item.company) === normalize(value))) throw new GameError("Это название уже занято");
    player.company = value;
  }
  setCadets(room, user, topics) {
    const player = this.getPlayer(room, user);
    if (!Array.isArray(topics) || topics.length !== 3 || new Set(topics).size !== 3 || topics.some(topic => !TOPICS[topic])) throw new GameError("Выбери ровно 3 направления");
    player.cadets = topics.map((topic, index) => ({
      id: id(), topic, knowledge: 0, status: "ACTIVE",
      name: CADET_NAMES[(player.stationNumber * 3 + index) % CADET_NAMES.length],
      moduleId: null, slotId: null, poseId: `Pose_0${(index % 6) + 1}`, visualSeed: `${player.id}:${index}`
    }));
    ensureCadetAssignments(player);
    player.ready = !!player.company;
  }
  startGame(room, user) {
    this.requireTeacher(room, user);
    if (room.players.length < 2) throw new GameError("Нужно минимум 2 игрока");
    if (room.players.some(player => !player.ready)) throw new GameError("Не все игроки готовы");
    room.status = "ACTIVE"; room.phase = "STATION"; room.round = 0; room.startedAt = now();
  }
  async startQuestion(room, user) {
    this.requireTeacher(room, user);
    if (!["STATION", "RESULT"].includes(room.phase)) throw new GameError("Сейчас нельзя запускать вопрос");
    const localizedSets = await this.allQuestions();
    const canonical = localizedSets.ru?.length ? localizedSets.ru : (localizedSets.en?.length ? localizedSets.en : localizedSets.tr);
    const availableTopics = Object.keys(TOPICS);
    if (!room.topicBag.length) room.topicBag = availableTopics.sort(() => Math.random() - 0.5);
    const topic = room.topicBag.shift();
    let pool = canonical.filter(q => q.topic === topic && !room.usedQuestionIds.includes(q.id));
    if (!pool.length) pool = canonical.filter(q => q.topic === topic);
    if (!pool.length) throw new GameError("Нет вопросов для этой темы", 500);
    const question = clone(pool[Math.floor(Math.random() * pool.length)]);
    const byLocale = {};
    for (const locale of SUPPORTED_LOCALES) byLocale[locale] = clone(localizedSets[locale]?.find(item => item.id === question.id) || question);
    room.usedQuestionIds.push(question.id);
    room.round += 1;
    room.phase = "QUESTION";
    room.results = null;
    room.players.forEach(player => { player.answered = false; player.lastAnswer = null; });
    room.currentQuestion = question;
    room.currentQuestionI18n = byLocale;
    room.deadline = now() + (MODES[room.mode]?.answer?.[question.difficulty] || 20) * 1000;
  }
  submit(room, user, value) {
    const player = this.getPlayer(room, user);
    if (room.phase !== "QUESTION") throw new GameError("Сейчас нельзя отвечать");
    if (player.answered) throw new GameError("Вы уже отвечали на этот вопрос");
    if (room.currentQuestion.type === "NUMBER") {
      const number = Number(String(value).replace(",", ".").replace(/\s/g, ""));
      if (!Number.isFinite(number)) throw new GameError("Введите число");
      player.lastAnswer = number;
    } else {
      const text = String(value || "").trim();
      if (!text) throw new GameError("Введите ответ");
      player.lastAnswer = text;
    }
    player.answered = true;
  }
  reveal(room, user) {
    this.requireTeacher(room, user);
    if (room.phase !== "QUESTION") throw new GameError("Нет активного вопроса");
    const q = room.currentQuestion;
    const localized = room.currentQuestionI18n || {};
    const multilingualAccepted = [...new Set(Object.values(localized).flatMap(item => item?.answers || item?.acceptedAnswers || []))];
    const accepted = multilingualAccepted.length ? multilingualAccepted : (q.answers || q.acceptedAnswers || []);
    const scored = room.players.map(player => {
      const submitted = player.lastAnswer !== null && player.lastAnswer !== undefined;
      if (!submitted) return { player, submitted: false, valid: false, distance: null };
      if (q.type === "NUMBER") {
        const distance = Math.abs(Number(player.lastAnswer) - Number(q.correct));
        return { player, submitted: true, valid: distance <= Number(q.tolerance || 0), distance };
      }
      return { player, submitted: true, valid: textMatches(player.lastAnswer, accepted), distance: null };
    });
    const submitted = scored.filter(item => item.submitted);
    const winners = q.type === "NUMBER" && submitted.length
      ? submitted.filter(item => item.distance === Math.min(...submitted.map(item => item.distance))).map(item => item.player.id)
      : scored.filter(item => item.valid).map(item => item.player.id);
    const items = scored.map(item => {
      const player = item.player;
      let credits = item.submitted ? ECON.participation : 0;
      let knowledge = 0;
      const changes = [];
      const grads = [];
      if (item.submitted) player.credits += ECON.participation;
      const winner = winners.includes(player.id);
      if (winner) { player.credits += ECON.winner; player.wins += 1; credits += ECON.winner; }
      if (item.valid) {
        player.correct += 1;
        knowledge = winner ? 2 : 1;
        let left = knowledge;
        for (const cadet of player.cadets.filter(cadet => cadet.status === "ACTIVE" && cadet.topic === q.topic).sort((a, b) => b.knowledge - a.knowledge)) {
          if (!left) break;
          const before = cadet.knowledge;
          cadet.knowledge += Math.min(left, MAX.knowledge - cadet.knowledge);
          left -= cadet.knowledge - before;
          changes.push({ cadetId: cadet.id, before, after: cadet.knowledge, moduleId: cadet.moduleId, slotId: cadet.slotId });
          if (cadet.knowledge >= MAX.knowledge) {
            cadet.status = "GRADUATED";
            player.graduates += 1;
            player.credits += ECON.graduation;
            grads.push({ cadetId: cadet.id, reward: ECON.graduation, moduleId: cadet.moduleId, slotId: cadet.slotId });
          }
        }
      }
      return { playerId: player.id, company: player.company, answer: player.lastAnswer, submitted: item.submitted, valid: item.valid, distance: item.distance, isWinner: winner, credits, knowledge, changes, grads };
    });
    const correctByLocale = {};
    const explanationByLocale = {};
    for (const locale of SUPPORTED_LOCALES) {
      const item = localized[locale] || q;
      correctByLocale[locale] = q.type === "NUMBER" ? q.correct : (item.answers?.[0] || item.acceptedAnswers?.[0] || q.answers?.[0] || q.acceptedAnswers?.[0] || "");
      explanationByLocale[locale] = item.explanation || q.explanation || "";
    }
    room.results = {
      questionId: q.id,
      correct: correctByLocale.ru,
      explanation: explanationByLocale.ru,
      correctByLocale,
      explanationByLocale,
      items
    };
    room.phase = "RESULT";
    room.deadline = null;
  }
  startStation(room, user) {
    this.requireTeacher(room, user);
    if (room.phase !== "RESULT") throw new GameError("Сначала покажите результат");
    room.phase = "STATION";
    room.deadline = null;
  }
  recruit(room, user, topic, moduleId = null, slotId = null) {
    const player = this.getPlayer(room, user);
    if (room.phase !== "STATION") throw new GameError("Сейчас нельзя принимать кадетов");
    const active = player.cadets.filter(cadet => cadet.status === "ACTIVE").length;
    if (active >= player.seatCapacity) throw new GameError("Нет свободных мест");
    if (!TOPICS[topic]) throw new GameError("Неизвестная специализация");
    const free = findFreeCrewSlot(player, moduleId || null, slotId || null);
    if (!free) throw new GameError("Нет свободных мест");
    const cadetIndex = player.cadets.length;
    player.cadets.push({
      id: id(), topic, knowledge: 0, status: "ACTIVE",
      name: CADET_NAMES[(player.stationNumber * 5 + cadetIndex) % CADET_NAMES.length],
      moduleId: free.moduleId, slotId: free.slotId,
      poseId: `Pose_0${(cadetIndex % 6) + 1}`, visualSeed: `${player.id}:${cadetIndex}`
    });
  }
  buyModule(room, user, type, parentModuleId = null, parentPort = null) {
    const player = this.getPlayer(room, user);
    if (room.phase !== "STATION") throw new GameError("Сейчас нельзя строить");
    if (player.moduleBoughtRound === room.round && room.round > 0) throw new GameError("В этом раунде модуль уже построен");
    const normalizedType = String(type || "").toUpperCase();
    const counts = moduleCounts(player);

    if (normalizedType === "SMALL") {
      if (counts.small >= MAX.small) throw new GameError("Малых модулей уже 7/7");
      if (player.credits < ECON.small) throw new GameError("Недостаточно кредитов");
    } else if (normalizedType === "LARGE") {
      if (counts.large >= MAX.large) throw new GameError("Больших модулей уже 3/3");
      if (player.credits < ECON.large) throw new GameError("Недостаточно кредитов");
    } else throw new GameError("Неизвестный тип модуля");

    const module = selectedPlacement(player, normalizedType, parentModuleId || null, parentPort || null, room.round);
    player.modules.push(module);
    validateStationGraph(player);
    player.credits -= normalizedType === "SMALL" ? ECON.small : ECON.large;
    syncPlayerCounts(player);
    player.moduleBoughtRound = room.round;

    if (player.small === MAX.small && player.large === MAX.large) {
      room.winnerId = player.id;
      room.status = "FINISHED";
      room.phase = "ENDGAME";
    }
  }
  endSession(room, user) { this.requireTeacher(room, user); room.status = "FINISHED"; room.phase = "ENDGAME"; room.deadline = null; }
  async questions(locale = "ru") {
    const lang = localeOf(locale);
    const paths = {
      ru: "https://albaspace.com.tr/game/AlbaSpace/ru/data/questions.ru.json",
      tr: "https://albaspace.com.tr/game/AlbaSpace/tr/data/questions.ru.json",
      en: "https://albaspace.com.tr/game/AlbaSpace/en/data/questions.en.json"
    };
    const envUrls = { ru: this.env.QUESTIONS_URL, tr: this.env.QUESTIONS_URL_TR, en: this.env.QUESTIONS_URL_EN };
    const url = envUrls[lang] || paths[lang];
    const response = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (response.ok) return response.json();
    if (lang !== "ru") {
      const fallbackResponse = await fetch(paths.ru, { cf: { cacheTtl: 300, cacheEverything: true } });
      if (fallbackResponse.ok) return fallbackResponse.json();
    }
    throw new GameError("Не удалось загрузить базу вопросов", 503);
  }
  async allQuestions() {
    const [ru, tr, en] = await Promise.all(SUPPORTED_LOCALES.map(locale => this.questions(locale)));
    return { ru, tr, en };
  }
  async persist(room, event, user, requestId) {
    try {
      await this.env.DB.prepare("UPDATE game_rooms SET state_json = ?, phase = ?, status = ?, updated_at = ? WHERE room_id = ?").bind(JSON.stringify(room), room.phase, room.status, Math.floor(now() / 1000), room.roomId).run();
      await this.env.DB.prepare("INSERT INTO game_events (room_id, event_type, actor_user_id, request_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(room.roomId, event, userId(user), requestId, JSON.stringify({ phase: room.phase, round: room.round }), Math.floor(now() / 1000)).run();
    } catch (error) { console.error("game persistence failed", error); }
  }
}

export async function handleGameRequest(request, env, user, cors) {
  const url = new URL(request.url);
  const headers = { ...cors, "Cache-Control": "no-store" };
  const roomMatch = url.pathname.match(/^\/api\/game\/rooms\/([^/]+)(?:\/(snapshot|events|command))?$/);
  const headerLocale = request.headers.get("X-Game-Locale") || url.searchParams.get("locale") || "ru";
  try {
    if (url.pathname === "/api/game/rooms" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const mode = MODES[body.mode] ? body.mode : "STANDARD";
      const presentationMode = PRESENTATION_MODES[body.presentationMode] ? body.presentationMode : "3D";
      const locale = localeOf(body.locale || headerLocale);
      let roomId = id(), code = String(10000 + Math.floor(Math.random() * 90000));
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          await env.DB.prepare("INSERT INTO game_rooms (room_id, join_code, teacher_user_id, mode, status, phase, state_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'LOBBY', 'LOBBY', ?, ?, ?)").bind(roomId, code, userId(user), mode, "{}", Math.floor(now() / 1000), Math.floor(now() / 1000)).run();
          break;
        } catch (error) {
          if (attempt === 7) throw error;
          roomId = id(); code = String(10000 + Math.floor(Math.random() * 90000));
        }
      }
      const result = await roomFetch(env, roomId, "/init", "POST", user, { roomId, code, mode, presentationMode, locale }, locale);
      return json(result, 201, headers);
    }
    if (url.pathname === "/api/game/rooms/join" && request.method === "POST") {
      const { code } = await request.json().catch(() => ({}));
      const locale = localeOf(headerLocale);
      const row = await env.DB.prepare("SELECT room_id FROM game_rooms WHERE join_code = ? LIMIT 1").bind(String(code || "").trim()).first();
      if (!row) throw new GameError("Комната не найдена", 404);
      return new Response(JSON.stringify(await roomFetch(env, row.room_id, "/command", "POST", user, { type: "JOIN_GAME_ROOM", requestId: id(), payload: {} }, locale)), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }
    if (!roomMatch) return json({ error: "Not found" }, 404, headers);
    const roomId = roomMatch[1], action = roomMatch[2] || "snapshot", locale = localeOf(headerLocale);
    if (action === "snapshot" && request.method === "GET") return new Response(JSON.stringify(await roomFetch(env, roomId, "/snapshot", "GET", user, undefined, locale)), { headers: { ...headers, "Content-Type": "application/json" } });
    if (action === "events" && request.method === "GET") {
      const response = await roomFetch(env, roomId, `/events?locale=${encodeURIComponent(locale)}`, "GET", user, undefined, locale);
      const eventHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([key, value]) => eventHeaders.set(key, value));
      return new Response(response.body, { status: response.status, headers: eventHeaders });
    }
    if (action === "command" && request.method === "POST") return new Response(JSON.stringify(await roomFetch(env, roomId, "/command", "POST", user, await request.json(), locale)), { headers: { ...headers, "Content-Type": "application/json" } });
    return json({ error: "Method not allowed" }, 405, headers);
  } catch (error) { return json({ error: error.message || "Game backend error" }, error.status || 500, headers); }
}

async function roomFetch(env, roomId, path, method, user, body, locale = "ru") {
  if (!env.GAME_ROOMS) throw new GameError("GAME_ROOMS Durable Object binding не настроен", 503);
  const stub = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(roomId));
  const response = await stub.fetch(`https://game-room.internal${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Game-User": JSON.stringify(user), "X-Game-Locale": localeOf(locale) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Game backend error" }));
    throw new GameError(data.error || "Game backend error", response.status);
  }
  return response.json();
}
