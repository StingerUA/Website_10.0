let classroomUser = null;
let state = null;
let roomId = new URLSearchParams(location.search).get("room") || "";
let stopEvents = null;
const app = document.getElementById("app"), phaseLabel = document.getElementById("phaseLabel"), roomBadge = document.getElementById("roomBadge");
const standings = room => AlbaSpace.rank(room).map((player, index) => `<tr><td>${index + 1}</td><td><strong>${AlbaGame.esc(player.company || "—")}</strong></td><td>🛰️ ${player.small + player.large}/10</td><td>🎓 ${player.graduates}</td></tr>`).join("");

function classroomViewKey(snapshot) {
  return JSON.stringify({
    phase: snapshot?.phase || "", round: snapshot?.round || 0, code: snapshot?.code || "",
    question: snapshot?.currentQuestion ? { id: snapshot.currentQuestion.id, text: snapshot.currentQuestion.text, topicLabel: snapshot.currentQuestion.topicLabel, unit: snapshot.currentQuestion.unit } : null,
    results: snapshot?.results ? { correct: snapshot.results.correct, explanation: snapshot.results.explanation, items: snapshot.results.items } : null,
    players: (snapshot?.players || []).map(player => ({ id: player.id, company: player.company, ready: player.ready, answered: player.answered, small: player.small, large: player.large, graduates: player.graduates, credits: player.credits }))
  });
}
function renderHeader() {
  phaseLabel.textContent = state ? `${state.phase} · ${state.presentation?.label || AlbaSpace.PRESENTATION_MODES[state.presentationMode]?.label || state.presentationMode}` : "Экран класса";
  roomBadge.textContent = `ROOM ${state?.code || "—"}`;
}
function apply(next) { const previousKey = classroomViewKey(state); state = next; if (previousKey !== classroomViewKey(next) || !document.querySelector("#app > *")) render(); else renderHeader(); }
function connect() { stopEvents?.(); stopEvents = AlbaGame.subscribe(roomId, next => apply(next), status => { if (status === "offline") phaseLabel.textContent = "Соединение потеряно. Восстанавливаем…"; }); }
function render() {
  renderHeader();
  if (!state) { app.innerHTML = `<section class="card hero"><div class="phase">Подключение</div><h1 class="classroom-title">📺 AlbaSpace Game</h1><p class="muted">Откройте Classroom по ссылке от учителя.</p></section>`; return; }
  if (state.phase === "QUESTION" && !state.currentQuestion) { app.innerHTML = `<section class="card hero"><h2>Ожидаем данные комнаты…</h2></section>`; return; }
  if (state.phase === "RESULT" && (!state.currentQuestion || !state.results?.items)) { app.innerHTML = `<section class="card hero"><h2>Ожидаем результат вопроса…</h2></section>`; return; }
  if (state.phase === "LOBBY") { app.innerHTML = `<section class="card hero"><div class="phase">${AlbaGame.esc(state.presentation?.label || AlbaSpace.PRESENTATION_MODES[state.presentationMode]?.label || state.presentationMode)}</div><h1 class="classroom-title">Код комнаты</h1><div class="code">${state.code}</div><p class="classroom-kpi">Подключено игроков: <strong>${state.players.length}/10</strong></p><div class="kpis" style="justify-content:center">${state.players.map(player => `<span class="kpi">${player.ready ? "✅" : "⏳"} ${AlbaGame.esc(player.company || "Настройка…")}</span>`).join("")}</div></section>`; return; }
  if (state.phase === "QUESTION") { const question = state.currentQuestion, answered = state.players.filter(player => player.answered).length; app.innerHTML = `<div class="classroom-grid"><section class="card hero"><div class="phase">Вопрос ${state.round} · ${question.topicLabel}</div><h1 class="classroom-question">${AlbaGame.esc(question.text)}</h1>${question.unit ? `<p class="classroom-kpi muted">Единица ответа: <strong>${AlbaGame.esc(question.unit)}</strong></p>` : ""}</section><section class="card center"><div class="phase">Ответы</div><h1 class="classroom-title">${answered}/${state.players.length}</h1><p class="muted">игроков уже ответили</p><div class="progress"><span style="width:${state.players.length ? answered / state.players.length * 100 : 0}%"></span></div><div class="sep"></div><p class="muted">Правильный ответ появится после того как все игроки ответят.</p></section></div>`; return; }
  if (state.phase === "RESULT") { const question = state.currentQuestion, result = state.results, winners = result.items.filter(item => item.isWinner).map(item => item.company); app.innerHTML = `<div class="classroom-grid"><section class="card hero"><div class="phase">${question.topicLabel} · Правильный ответ</div><div class="classroom-answer">${AlbaGame.esc(result.correct)}${question.unit ? ` ${AlbaGame.esc(question.unit)}` : ""}</div><div class="notice" style="margin-top:22px;font-size:clamp(1.2rem,2vw,2rem)">🤖 ${AlbaGame.esc(result.explanation)}</div>${winners.length ? `<h2 style="margin-top:24px">🏆 Лучший ответ: ${winners.map(AlbaGame.esc).join(", ")}</h2>` : ""}</section><section class="card"><div class="phase">Текущий рейтинг</div><table class="table classroom-kpi"><thead><tr><th>#</th><th>Компания</th><th>Станция</th><th>🎓</th></tr></thead><tbody>${standings(state)}</tbody></table></section></div>`; return; }
  if (state.phase === "ENDGAME") { const ranked = AlbaSpace.rank(state), winner = state.winnerId ? state.players.find(player => player.id === state.winnerId) : ranked[0]; app.innerHTML = `<section class="card hero"><div class="phase">Финал</div><h1 class="classroom-title">🏆 ${AlbaGame.esc(winner?.company || "Игра окончена")}</h1><p class="classroom-kpi">${state.winnerId ? "Станция завершена — 10/10 модулей!" : "Сессия завершена."}</p></section><section class="card" style="margin-top:20px"><table class="table classroom-kpi"><thead><tr><th>#</th><th>Компания</th><th>Станция</th><th>🎓</th></tr></thead><tbody>${standings(state)}</tbody></table></section>`; return; }
  app.innerHTML = `<div class="classroom-grid"><section class="card hero"><div class="phase">Фаза станции</div><h1 class="classroom-title">🛰️ Развивайте свои станции</h1><p class="classroom-kpi muted">Победа — 10/10 модулей.</p></section><section class="card"><div class="phase">Гонка станций</div><table class="table classroom-kpi"><thead><tr><th>#</th><th>Компания</th><th>Станция</th><th>🎓</th></tr></thead><tbody>${standings(state)}</tbody></table></section></div>`;
}
(async () => { classroomUser = await AlbaGame.currentUser(); if (!classroomUser) return AlbaGame.requireLogin(app); if (!roomId) return render(); try { const response = await AlbaGame.snapshot(roomId); apply(response.state); connect(); } catch (error) { app.innerHTML = `<section class="card center"><h2>${AlbaGame.esc(error.message)}</h2></section>`; } })();
