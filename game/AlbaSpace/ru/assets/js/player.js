let playerUser = null;
let state = null;
let roomId = sessionStorage.getItem("alba_game_player_room") || "";
let draftAnswer = "";
let draftRound = null;
let stopEvents = null;
let selectedTopics = [];
let stationRenderer = null;
let stationView = null;

const app = document.getElementById("app");
const hud = document.getElementById("hud");
const phaseLabel = document.getElementById("phaseLabel");
const toastEl = document.getElementById("toast");
const toast = message => { toastEl.textContent = message; toastEl.classList.remove("hidden"); setTimeout(() => toastEl.classList.add("hidden"), 2600); };

function playerViewKey(snapshot) {
  const current = snapshot?.players?.find(player => player.id === snapshot.viewerPlayerId);
  const result = snapshot?.results?.items?.find(item => item.playerId === snapshot.viewerPlayerId);
  return JSON.stringify({
    phase: snapshot?.phase || "",
    round: snapshot?.round || 0,
    questionId: snapshot?.currentQuestion?.id || "",
    winnerId: snapshot?.winnerId || "",
    player: current ? { company: current.company, credits: current.credits, small: current.small, large: current.large, seatCapacity: current.seatCapacity, graduates: current.graduates, correct: current.correct, wins: current.wins, answered: current.answered, lastAnswer: current.lastAnswer, moduleBoughtRound: current.moduleBoughtRound, cadets: current.cadets } : null,
    result: result || null
  });
}

function apply(next) {
  const input = document.getElementById("answer");
  if (input && document.activeElement === input) draftAnswer = input.value;
  const previousKey = playerViewKey(state);
  state = next;
  if (previousKey !== playerViewKey(next) || !document.querySelector("#app > *")) render();
  else renderHud(me());
}

async function send(type, payload = {}) {
  try { const response = await AlbaGame.command(roomId, type, payload); apply(response.state); }
  catch (error) { toast(error.message); }
}

function connect() {
  if (!roomId) return;
  stopEvents?.();
  stopEvents = AlbaGame.subscribe(roomId, next => apply(next), status => {
    if (status === "offline") toast("Соединение потеряно. Восстанавливаем…");
    if (status === "connected") toast("Подключение восстановлено");
  });
}

function me() { return state?.players.find(player => player.id === state.viewerPlayerId); }
function modeLabel() { return state?.presentationMode === "AR" ? "AR · мобильный fallback" : "3D · laptop station"; }
function renderHud(player) {
  hud.innerHTML = player ? `<span class="kpi">💰 ${player.credits}</span><span class="kpi">🛰️ ${player.small + player.large}/10</span><span class="kpi">🎓 ${player.graduates}</span>` : "";
  phaseLabel.textContent = state ? `${state.phase} · ${AlbaGame.esc(player?.company || "Игрок")} · ${modeLabel()}` : "Вход";
}

function render() {
  const player = me();
  renderHud(player);
  if (!state || !player) return renderJoin();
  if (!player.company) return renderCompany();
  if ((player.cadets || []).length < 3) return renderCadetSetup();
  if (state.phase === "LOBBY") return renderWaiting(player);
  if (state.phase === "QUESTION") return renderQuestion(player);
  if (state.phase === "RESULT") return renderResult(player);
  if (state.phase === "ENDGAME") return renderEnd(player);
  renderStation(player);
}

function renderJoin() {
  app.innerHTML = `<section class="card"><div class="phase">Вход в комнату</div><h1>Присоединиться 🚀</h1><label class="muted">Код учителя</label><input id="code" class="input big-input" inputmode="numeric" maxlength="5" placeholder="48271"><div style="margin-top:14px"><button id="join" class="btn primary">Войти</button></div></section>`;
  document.getElementById("join").onclick = async () => { try { const response = await AlbaGame.joinRoom(document.getElementById("code").value.trim()); state = response.state; roomId = state.roomId; sessionStorage.setItem("alba_game_player_room", roomId); connect(); render(); } catch (error) { toast(error.message); } };
}

function renderCompany() {
  app.innerHTML = `<section class="card"><div class="phase">Шаг 1 из 2</div><h1>Назови свою компанию</h1><input id="name" class="input big-input" maxlength="20" placeholder="ORION SPACE"><div style="margin-top:14px"><button id="save" class="btn primary">Продолжить</button></div></section>`;
  document.getElementById("save").onclick = () => send("SET_COMPANY_NAME", { name: document.getElementById("name").value });
}

function renderCadetSetup() {
  selectedTopics = [];
  app.innerHTML = `<section class="card"><div class="phase">Шаг 2 из 2</div><h1>Выбери 3 кадетов</h1><p class="muted">Каждый кадет специализируется на одной теме. Выбрано: <strong id="count">0/3</strong></p><div class="grid two" id="topics">${Object.entries(AlbaSpace.TOPICS).map(([key, topic]) => `<div class="topic-card" data-topic="${key}"><strong>${topic.label}</strong><p class="muted">Кадет 0/4</p></div>`).join("")}</div><div style="margin-top:14px"><button id="confirm" class="btn primary" disabled>Подтвердить экипаж</button></div></section>`;
  document.querySelectorAll(".topic-card").forEach(element => element.onclick = () => { const topic = element.dataset.topic; if (selectedTopics.includes(topic)) { selectedTopics = selectedTopics.filter(value => value !== topic); element.classList.remove("selected"); } else if (selectedTopics.length < 3) { selectedTopics.push(topic); element.classList.add("selected"); } document.getElementById("count").textContent = `${selectedTopics.length}/3`; document.getElementById("confirm").disabled = selectedTopics.length !== 3; });
  document.getElementById("confirm").onclick = () => send("SELECT_START_CADETS", { topics: selectedTopics });
}

function renderWaiting(player) {
  app.innerHTML = `<section class="card hero"><div class="phase">Готово · ${modeLabel()}</div><h1>🚀 ${AlbaGame.esc(player.company)}</h1><p>Экипаж сформирован. Ожидаем учителя…</p><div class="kpis" style="justify-content:center"><span class="kpi">💰 ${player.credits}</span><span class="kpi">🛰️ ${player.small + player.large}/10</span><span class="kpi">👨‍🚀 ${player.cadets.length}/${player.seatCapacity}</span></div></section>`;
}

function stationLayout(player, rightPanel) {
  const active = (player.cadets || []).filter(cadet => cadet.status === "ACTIVE");
  const moduleCount = player.small + player.large;
  return `<div class="station-experience"><section class="station-stage card"><div class="station-stage-bar"><div><div class="phase">${state.phase === "QUESTION" ? "Вопрос · станция остаётся видимой" : state.phase === "RESULT" ? "Результат · станция остаётся видимой" : "Твоя орбитальная станция"}</div><strong>${AlbaGame.esc(player.company)}</strong></div><div class="station-stage-actions"><span class="kpi">${moduleCount}/10 модулей</span><button id="resetView" class="btn ghost compact">⌂ Сбросить вид</button></div></div><div id="station3d" class="station-viewport" aria-label="Интерактивная 3D станция"></div><div class="station-bottom"><span class="muted">${modeLabel()} · drag для вращения · wheel для zoom</span><span class="muted">${active.length}/${player.seatCapacity} мест занято</span></div></section>${rightPanel}</div>`;
}

function mount3D(player) {
  const host = document.getElementById("station3d");
  if (state.presentationMode === "AR") {
    stationRenderer?.dispose(); stationRenderer = null; stationView = null;
    host.innerHTML = `<div class="ar-development-fallback"><div class="phase">AR mode</div><h2>Мобильный режим подготовки</h2><p>Настоящий AR Renderer пока не подключён. Комната и multiplayer продолжают работать через лёгкий интерфейс.</p><p class="muted">Позже к этому месту подключится: AR Anchor → StationRoot.</p></div>`;
    return;
  }
  if (!window.AlbaStation3D || !host) return;
  if (stationRenderer?.ready && stationRenderer.canvas) {
    // Keep the Babylon engine and ArcRotateCamera alive while the HTML side panel re-renders.
    stationRenderer.host = host;
    host.innerHTML = "";
    host.appendChild(stationRenderer.canvas);
    stationRenderer.update(state, player);
  } else {
    stationRenderer?.dispose();
    stationRenderer = new AlbaStation3D.Station3DRenderer(host, { onSelect: selection => openSelection(selection), onError: () => toast("3D режим недоступен на этом устройстве") });
    stationRenderer.init();
    stationRenderer.update(state, player);
  }
  document.getElementById("resetView")?.addEventListener("click", () => stationRenderer?.resetView());
}

function openSelection(selection) {
  if (selection.kind !== "cadet") return;
  const cadet = selection.cadet;
  toast(`${cadet.name || "Кадет"} · ${AlbaSpace.TOPICS[cadet.topic]?.label || cadet.topic} · ${cadet.knowledge}/4`);
}

function renderQuestion(player) {
  const question = state.currentQuestion;
  if (!question) { app.innerHTML = `<section class="card center"><h2>Ожидаем вопрос…</h2></section>`; return; }
  if (draftRound !== state.round) { draftRound = state.round; draftAnswer = ""; }
  const already = player.answered;
  const safe = AlbaGame.esc(draftAnswer);
  const questionPanel = `<aside class="question-panel card"><div class="phase">${AlbaGame.esc(question.topicLabel)} · ${AlbaGame.esc(question.difficulty || "")}</div><h2>${AlbaGame.esc(question.text)}</h2>${already ? `<div class="notice"><strong>🔒 Ответ принят</strong><p class="muted">Твой ответ: ${AlbaGame.esc(player.lastAnswer ?? draftAnswer ?? "—")}</p><p class="muted">Ожидаем остальных игроков.</p></div>` : `<input id="answer" class="input" ${question.type === "NUMBER" ? 'inputmode="decimal"' : ""} value="${safe}" autocomplete="off" placeholder="${question.type === "NUMBER" ? "Введите число" : "Введите ответ"}">${question.unit ? `<p class="muted">${AlbaGame.esc(question.unit)}</p>` : ""}<button id="submit" class="btn primary" style="width:100%">Ответить</button>`}</aside>`;
  app.innerHTML = stationLayout(player, questionPanel);
  mount3D(player);
  const input = document.getElementById("answer");
  if (input) { input.addEventListener("input", () => { draftAnswer = input.value; }); if (document.activeElement !== input) input.focus(); document.getElementById("submit").onclick = () => { draftAnswer = input.value; send("SUBMIT_ANSWER", { value: draftAnswer }); }; }
}

function renderResult(player) {
  const item = state.results?.items?.find(result => result.playerId === player.id);
  const question = state.currentQuestion;
  if (!item || !question || !state.results) return renderStation(player);
  const cls = item.isWinner || item.valid ? "result-good" : item.submitted ? "result-warn" : "result-bad";
  const title = item.isWinner ? "🏆 Лучший ответ" : item.valid ? "✅ Верно" : item.submitted ? "🌌 Не совсем" : "⌛ Ответ не отправлен";
  const resultPanel = `<aside class="question-panel result-panel card"><div class="phase">${AlbaGame.esc(question.topicLabel)}</div><h2 class="${cls}">${title}</h2><p>Твой ответ: <strong>${item.submitted ? AlbaGame.esc(item.answer) : "—"}</strong></p><p>Правильный: <strong>${AlbaGame.esc(state.results.correct)}${question.unit ? ` ${AlbaGame.esc(question.unit)}` : ""}</strong></p><div class="grid two"><div class="reward"><strong>💰 +${item.credits}</strong><span>кредиты</span></div><div class="reward"><strong>🧠 +${item.knowledge}</strong><span>знания</span></div></div><div class="notice" style="margin-top:14px">🤖 ${AlbaGame.esc(state.results.explanation || "Каждый вопрос помогает экипажу учиться.")}</div><p class="muted small-note">Ожидаем следующую фазу…</p></aside>`;
  app.innerHTML = stationLayout(player, resultPanel);
  mount3D(player);
}

function renderStation(player) {
  const free = AlbaSpace.freeSeats(player);
  const active = (player.cadets || []).filter(cadet => cadet.status === "ACTIVE");
  const crew = active.map(cadet => `<button class="drawer-row recruit-like" data-cadet="${AlbaGame.esc(cadet.id)}"><span>${AlbaGame.esc(cadet.name || AlbaSpace.TOPICS[cadet.topic]?.label || "Кадет")}</span><span>${AlbaSpace.TOPICS[cadet.topic]?.label || cadet.topic} · ${cadet.knowledge}/4</span></button>`).join("");
  const ranking = AlbaSpace.rank(state).map((item, index) => `<div class="drawer-row"><span>${index + 1}. ${AlbaGame.esc(item.company)}</span><span>${item.correct}/${state.round || 0} · 🎓 ${item.graduates}</span></div>`).join("");
  const panel = `<aside class="station-controls card"><div class="control-tabs"><button class="btn ghost compact" data-drawer="crew">Экипаж ▾</button><button class="btn ghost compact" data-drawer="ranking">Рейтинг ▾</button></div><div id="drawer" class="drawer hidden"></div><div class="phase">Станция · ${modeLabel()}</div><div class="notice">Свободных мест: <strong>${free}</strong></div><h2>+ Модуль</h2><div class="grid two"><button id="small" class="btn" ${player.small >= AlbaSpace.MAX.small || player.credits < AlbaSpace.ECON.small ? "disabled" : ""}>SMALL<br><strong>650 💰</strong><br>+2 места</button><button id="large" class="btn" ${player.large >= AlbaSpace.MAX.large || player.credits < AlbaSpace.ECON.large ? "disabled" : ""}>LARGE<br><strong>950 💰</strong><br>+3 места</button></div><p class="muted small-note">После подтверждения сервером доступные docking ports подсветятся в Build View.</p><div class="sep"></div><h2>Принять кадета</h2>${free > 0 ? `<div class="grid two">${Object.entries(AlbaSpace.TOPICS).map(([key, topic]) => `<button class="btn ghost recruit" data-topic="${key}">${topic.label}</button>`).join("")}</div>` : `<p class="muted">Свободных мест нет.</p>`}</aside>`;
  app.innerHTML = stationLayout(player, panel) + `<section class="card station-summary"><div class="phase">Состояние станции</div><div class="kpis"><span class="kpi">LARGE ${player.large}/3</span><span class="kpi">SMALL ${player.small}/7</span><span class="kpi">Экипаж ${active.length}/${player.seatCapacity}</span></div>${player.small + player.large === 9 ? `<div class="milestone">🚨 Остался один модуль!</div>` : ""}</section>`;
  mount3D(player);
  document.getElementById("small")?.addEventListener("click", () => send("BUY_MODULE", { type: "SMALL" }));
  document.getElementById("large")?.addEventListener("click", () => send("BUY_MODULE", { type: "LARGE" }));
  document.querySelectorAll(".recruit").forEach(button => button.onclick = () => send("RECRUIT_CADET", { topic: button.dataset.topic }));
  document.querySelectorAll("[data-drawer]").forEach(button => button.onclick = () => { const drawer = document.getElementById("drawer"); drawer.classList.remove("hidden"); drawer.innerHTML = button.dataset.drawer === "crew" ? `<strong>ЭКИПАЖ · ${active.length}/${player.seatCapacity}</strong>${crew || `<p class=\"muted\">Пока пусто.</p>`}` : `<strong>РЕЙТИНГ</strong>${ranking}`; });
}

function renderEnd(player) {
  const ranked = AlbaSpace.rank(state), position = ranked.findIndex(item => item.id === player.id) + 1, winner = state.winnerId ? state.players.find(item => item.id === state.winnerId) : ranked[0];
  const panel = `<aside class="endgame-panel card"><div class="phase">Endgame camera · станция завершена</div><h2>${winner?.id === player.id ? "🏆 ПОБЕДА" : `🚀 ${AlbaGame.esc(winner?.company || "Игра завершена")}`}</h2><p>${AlbaGame.esc(player.company)} · место: <strong>${position}</strong></p><div class="kpis"><span class="kpi">🛰️ ${player.small + player.large}/10</span><span class="kpi">🎓 ${player.graduates}</span><span class="kpi">✅ ${player.correct}</span><span class="kpi">💰 ${player.credits}</span></div></aside>`;
  app.innerHTML = stationLayout(player, panel);
  mount3D(player);
}

window.addEventListener("beforeunload", () => stationRenderer?.dispose());
(async () => { playerUser = await AlbaGame.currentUser(); if (!playerUser) return AlbaGame.requireLogin(app); try { if (roomId) { const response = await AlbaGame.snapshot(roomId); apply(response.state); connect(); } else render(); } catch (error) { sessionStorage.removeItem("alba_game_player_room"); roomId = ""; toast(error.message); render(); } })();
