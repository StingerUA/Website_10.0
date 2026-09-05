let teacherUser = null;
let state = null;
let roomId = sessionStorage.getItem("alba_game_teacher_room") || "";
let stopEvents = null;
const app = document.getElementById("app"), phaseLabel = document.getElementById("phaseLabel"), roundKpi = document.getElementById("roundKpi"), roomKpi = document.getElementById("roomKpi"), sessionKpi = document.getElementById("sessionKpi"), toastEl = document.getElementById("toast");
const toast = message => { toastEl.textContent = message; toastEl.classList.remove("hidden"); setTimeout(() => toastEl.classList.add("hidden"), 2600); };
const elapsed = ms => { const total = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`; };
const standings = room => AlbaSpace.rank(room).map((player,index) => `<tr><td>${index+1}</td><td>${AlbaGame.esc(player.company || "—")}</td><td>${player.small + player.large}/10</td><td>${player.graduates}</td><td>${player.credits}</td></tr>`).join("");
const presentationOptions = selected => Object.entries(AlbaSpace.PRESENTATION_MODES).map(([key,mode]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${mode.label}</option>`).join("");
function apply(next) { state = next; render(); }
async function send(type, payload = {}) { try { const response = await AlbaGame.command(roomId, type, payload); apply(response.state); } catch (error) { toast(error.message); } }
function connect() { if (!roomId) return; stopEvents?.(); stopEvents = AlbaGame.subscribe(roomId, next => apply(next), status => { if (status === "offline") toast("Connection lost. Reconnecting…"); if (status === "connected") renderStatus(); }); }
function renderStatus() { if (state) phaseLabel.textContent = `${state.phase} · ${state.presentation?.label || AlbaSpace.PRESENTATION_MODES[state.presentationMode]?.label || state.presentationMode}`; }
function stationStatus(player) {
  const active = (player.cadets || []).filter(cadet => cadet.status === "ACTIVE").length;
  const freeSeats = Math.max(0, player.seatCapacity - active);
  const blockedThisRound = state.round > 0 && player.moduleBoughtRound === state.round;
  const canBuy = !blockedThisRound && ((player.small < AlbaSpace.MAX.small && player.credits >= AlbaSpace.ECON.small) || (player.large < AlbaSpace.MAX.large && player.credits >= AlbaSpace.ECON.large));
  if (!freeSeats && !canBuy) return { ready:true, label:"✅ Ready" };
  if (freeSeats) return { ready:false, label:"⏳ Free places available" };
  if (canBuy) return { ready:false, label:"⏳ Module available" };
  return { ready:false, label:"⏳ Preparing" };
}
function updateFinishButton() {
  const button = document.getElementById("finishSession");
  if (!button) return;
  const visible = !!(roomId && state && state.phase !== "ENDGAME");
  button.hidden = !visible;
  button.onclick = visible ? () => { if (window.confirm("End this session now? This cannot be undone.")) send("END_SESSION"); } : null;
}
function render() {
  renderStatus(); updateFinishButton(); roundKpi.textContent = `Q ${state?.round || 0}`; roomKpi.textContent = `ROOM ${state?.code || "—"}`;
  if (!state) return renderCreate();
  if (state.phase === "LOBBY") return renderLobby();
  if (state.phase === "QUESTION") return renderQuestion();
  if (state.phase === "RESULT") return renderResult();
  if (state.phase === "ENDGAME") return renderEnd();
  return renderStation();
}
function renderCreate() {
  app.innerHTML = `<section class="card"><div class="phase">Step 1 · game display</div><h1>Create a game room</h1><p class="muted">First choose how the children will see their stations.</p><label class="muted" for="presentationMode">Station format</label><select id="presentationMode" class="input">${presentationOptions("3D")}</select><div id="modeDescription" class="notice" style="margin-top:12px"></div><div style="margin-top:14px" class="grid two"><button id="create" class="btn primary">Create room</button><a class="btn ghost center" href="./index.html">Back</a></div></section>`;
  const select = document.getElementById("presentationMode"), description = document.getElementById("modeDescription");
  const updateDescription = () => { description.textContent = AlbaSpace.PRESENTATION_MODES[select.value].description; };
  select.onchange = updateDescription; updateDescription();
  document.getElementById("create").onclick = async () => { try { const response = await AlbaGame.createRoom(select.value); roomId = response.state.roomId; sessionStorage.setItem("alba_game_teacher_room", roomId); apply(response.state); connect(); } catch (error) { toast(error.message); } };
}
function renderLobby() {
  const ready = state.players.filter(player => player.ready).length;
  app.innerHTML = `<div class="grid two"><section class="card center"><div class="phase">Room code</div><div class="code">${state.code}</div><p class="muted">Share this code with the players.</p><a class="btn ghost" style="display:inline-block;margin:8px 0 8px" href="./classroom.html?room=${encodeURIComponent(state.roomId)}" target="_blank">📺 Open classroom screen</a><a class="btn ghost" style="display:inline-block;margin:0 0 14px" href="./anchors.html" target="_blank">▣ Print AR anchors</a><label class="muted">Format: ${AlbaGame.esc(state.presentation?.label || AlbaSpace.PRESENTATION_MODES[state.presentationMode]?.label || state.presentationMode)}</label></section><section class="card"><div class="phase">Lobby</div><h2>Players: ${state.players.length}/10</h2>${state.players.length ? `<table class="table"><thead><tr><th>Player</th><th>Cadets</th><th>Ready</th><th>Status</th></tr></thead><tbody>${state.players.map(player => `<tr><td>${AlbaGame.esc(player.company || "Setting up…")}</td><td>${player.cadets.length}/3</td><td>${player.ready ? "✅" : "⏳"}</td><td>${player.online === false ? "offline" : "online"}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No players have joined yet.</p>`}<div class="sep"></div><button id="start" class="btn primary" ${state.players.length < 2 || ready !== state.players.length ? "disabled" : ""}>🚀 Start game</button></section></div>`;
  document.getElementById("start").onclick = () => send("START_GAME");
}
function renderStation() {
  const winner = state.winnerId ? state.players.find(player => player.id === state.winnerId) : null;
  const readiness = state.players.map(player => { const status = stationStatus(player); return `<div class="station-readiness-row"><strong>${AlbaGame.esc(player.company || "Setting up…")}</strong><span class="${status.ready ? "station-ready" : "station-pending"}">${status.label}</span></div>`; }).join("");
  app.innerHTML = `<div class="grid two"><section class="card"><div class="phase">Station phase</div><h2>${winner ? "Game finished" : `Round ${state.round} finished`}</h2>${winner ? `<div class="notice">🏆 ${AlbaGame.esc(winner.company)} completed a 10/10 station.</div>` : `<button id="nextQ" class="btn primary">❓ Start next question</button>`}<div class="sep"></div><div class="phase">Player readiness</div><div class="station-readiness">${readiness || `<p class="muted">No players connected.</p>`}</div></section><section class="card"><div class="phase">Ranking</div><table class="table"><thead><tr><th>#</th><th>Company</th><th>Modules</th><th>🎓</th><th>ALBA Coins</th><th>Status</th></tr></thead><tbody>${state.players.map((player,index) => { const status = stationStatus(player); return `<tr><td>${index+1}</td><td>${AlbaGame.esc(player.company || "—")}</td><td>${player.small + player.large}/10</td><td>${player.graduates}</td><td>${player.credits}</td><td class="${status.ready ? "station-ready" : "station-pending"}">${status.label}</td></tr>`; }).join("")}</tbody></table></section></div>`;
  document.getElementById("nextQ")?.addEventListener("click", () => send("START_NEXT_ROUND"));
}
function renderQuestion() {
  const question = state.currentQuestion;
  if (!question) { app.innerHTML = `<section class="card hero"><h2>Waiting for a question…</h2></section>`; return; }
  const answered = state.players.filter(player => player.answered).length;
  app.innerHTML = `<div class="grid two"><section class="card"><div class="phase">${AlbaGame.esc(question.topicLabel)} · ${AlbaGame.esc(question.difficulty)}</div><div id="questionReminder"></div><h1 style="font-size:clamp(1.7rem,4vw,3.1rem)">${AlbaGame.esc(question.text)}</h1><div class="notice">Answered: <strong>${answered}/${state.players.length}</strong></div><div class="sep"></div><button id="reveal" class="btn primary">🔒 Close answers and show result</button></section><section class="card"><div class="phase">Players</div>${state.players.map(player => `<div class="player-card" style="margin-bottom:8px">${player.answered ? "✅" : "⏳"} <strong>${AlbaGame.esc(player.company)}</strong></div>`).join("")}</section></div>`;
  document.getElementById("reveal").onclick = () => send("CLOSE_ANSWERS"); updateTimers();
}
function renderResult() {
  const result = state.results, question = state.currentQuestion;
  if (!result?.items || !question) { app.innerHTML = `<section class="card hero"><h2>Waiting for results…</h2></section>`; return; }
  app.innerHTML = `<section class="card"><div class="phase">Result · ${AlbaGame.esc(question.topicLabel)}</div><h2>${AlbaGame.esc(question.text)}</h2><p>Correct answer: <strong>${AlbaGame.esc(result.correct)}${question.unit ? ` ${AlbaGame.esc(question.unit)}` : ""}</strong></p><div class="notice">🤖 ${AlbaGame.esc(result.explanation)}</div><div class="sep"></div><table class="table"><thead><tr><th>Company</th><th>Answer</th><th>Result</th><th>Reward</th></tr></thead><tbody>${result.items.map(item => `<tr><td>${AlbaGame.esc(item.company)}</td><td>${item.submitted ? AlbaGame.esc(item.answer) : "—"}</td><td>${item.isWinner ? "🏆" : item.valid ? "✅" : "—"}</td><td>ALBA Coins +${item.credits} · 🧠 +${item.knowledge}</td></tr>`).join("")}</tbody></table><div class="sep"></div><button id="station" class="btn primary">🛰️ Go to station phase</button></section>`;
  document.getElementById("station").onclick = () => send("START_STATION_PHASE");
}
function renderEnd() {
  const ranked = AlbaSpace.rank(state), winner = state.winnerId ? state.players.find(player => player.id === state.winnerId) : ranked[0];
  app.innerHTML = `<section class="card hero"><div class="phase">Final</div><h1>🏆 ${AlbaGame.esc(winner?.company || "Game finished")}</h1><p class="muted">${state.winnerId ? "First station to complete 3 large + 7 small modules." : "The session was ended by the teacher."}</p></section><section class="card" style="margin-top:14px"><table class="table"><thead><tr><th>#</th><th>Company</th><th>Modules</th><th>🎓</th><th>ALBA Coins</th></tr></thead><tbody>${standings(state)}</tbody></table></section>`;
}
function updateTimers() {
  if (!state) return;
  sessionKpi.textContent = `⏱ ${state.startedAt ? elapsed(Date.now() - state.startedAt) : "00:00"}`;
  if (state.phase !== "QUESTION") return;
  const host = document.getElementById("questionReminder");
  if (!host || !state.deadline) return;
  const remaining = Math.ceil((state.deadline - Date.now()) / 1000);
  host.innerHTML = remaining >= 0 ? `<span class="timer">${remaining} s</span><div class="muted">recommended time</div>` : `<span class="timer result-warn">+${Math.abs(remaining)} s</span><div class="result-warn">Recommended time is over. Answers are still accepted.</div>`;
}
setInterval(updateTimers, 250);
(async () => { teacherUser = await AlbaGame.currentUser(); if (!teacherUser) return AlbaGame.requireLogin(app); try { if (roomId) { const response = await AlbaGame.snapshot(roomId); apply(response.state); connect(); } else render(); } catch (error) { sessionStorage.removeItem("alba_game_teacher_room"); roomId = ""; toast(error.message); render(); } })();
