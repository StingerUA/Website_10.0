/* AlbaSpace planned lesson clock + final-round decision UX. */
(() => {
  if (window.AlbaSessionTimingUX) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const brand = String(document.querySelector(".brand")?.textContent || "").toUpperCase();
  const SURFACE = brand.includes("TEACHER") ? "teacher" : brand.includes("CLASSROOM") ? "classroom" : brand.includes("PLAYER") ? "player" : "other";
  if (SURFACE === "other") return;

  const COPY = {
    ru: {
      durationLabel: "Плановая длительность занятия",
      durationHelp: "45–85 минут. По окончании игра не остановится сама — учитель выберет финальный вопрос или +15 минут.",
      minutes: "мин",
      planned: "до конца",
      expiredShort: "ВРЕМЯ",
      fiveMinutes: "До планового конца меньше 5 минут",
      expired: "Запланированное время занятия завершено",
      finishRound: "Завершите текущий раунд. В фазе станции появится выбор, как закончить занятие.",
      choose: "Как продолжить занятие?",
      chooseSub: "Никто ещё не построил станцию 10/10. Выберите один из двух вариантов.",
      finalButton: "⚡ Финальный ускоренный вопрос",
      finalHelp: "Один последний вопрос с сокращённым временем ответа. После него — последняя фаза станции и итоговый рейтинг.",
      extendButton: "➕ Продолжить ещё 15 минут",
      extendHelp: "Добавить 15 минут к игре и продолжить обычные раунды.",
      finalQuestion: "ФИНАЛЬНЫЙ ВОПРОС",
      finalQuestionSub: "Это последний вопрос занятия",
      finalResult: "РЕЗУЛЬТАТ ФИНАЛЬНОГО ВОПРОСА",
      finalResultSub: "Покажите результат и перейдите к последней фазе станции.",
      finalStation: "ПОСЛЕДНЯЯ ФАЗА СТАНЦИИ",
      finalStationSub: "Используйте последние награды: можно принять кадета или построить модуль. Затем учитель завершит игру.",
      finishGame: "🏁 Завершить игру и показать результаты",
      waitingTeacher: "Время занятия завершено — ждём решение учителя.",
      classFinalQuestion: "⚡ Финальный вопрос занятия",
      classFinalResult: "🏆 Результат финального вопроса",
      classFinalStation: "🏁 Последняя фаза станции — используйте полученные награды",
      extended: "Занятие продлено на 15 минут",
      actionFailed: "Не удалось выполнить действие"
    },
    tr: {
      durationLabel: "Planlanan ders süresi",
      durationHelp: "45–85 dakika. Süre bitince oyun otomatik durmaz; öğretmen final sorusunu veya +15 dakikayı seçer.",
      minutes: "dk",
      planned: "kalan",
      expiredShort: "SÜRE",
      fiveMinutes: "Planlanan bitişe 5 dakikadan az kaldı",
      expired: "Planlanan ders süresi sona erdi",
      finishRound: "Mevcut turu tamamlayın. İstasyon aşamasında dersi nasıl bitireceğinizi seçebilirsiniz.",
      choose: "Derse nasıl devam edelim?",
      chooseSub: "Henüz hiç kimse 10/10 istasyon kurmadı. İki seçenekten birini seçin.",
      finalButton: "⚡ Hızlandırılmış final sorusu",
      finalHelp: "Kısaltılmış cevap süresiyle son bir soru. Ardından son istasyon aşaması ve final sıralaması gelir.",
      extendButton: "➕ 15 dakika daha devam et",
      extendHelp: "Oyuna 15 dakika ekleyin ve normal turlara devam edin.",
      finalQuestion: "FİNAL SORUSU",
      finalQuestionSub: "Bu dersin son sorusudur",
      finalResult: "FİNAL SORUSU SONUCU",
      finalResultSub: "Sonucu gösterin ve son istasyon aşamasına geçin.",
      finalStation: "SON İSTASYON AŞAMASI",
      finalStationSub: "Son ödülleri kullanın: öğrenci alın veya modül inşa edin. Ardından öğretmen oyunu bitirir.",
      finishGame: "🏁 Oyunu bitir ve sonuçları göster",
      waitingTeacher: "Ders süresi bitti — öğretmenin kararını bekliyoruz.",
      classFinalQuestion: "⚡ Dersin final sorusu",
      classFinalResult: "🏆 Final sorusunun sonucu",
      classFinalStation: "🏁 Son istasyon aşaması — son ödülleri kullanın",
      extended: "Ders 15 dakika uzatıldı",
      actionFailed: "İşlem gerçekleştirilemedi"
    },
    en: {
      durationLabel: "Planned lesson duration",
      durationHelp: "45–85 minutes. When time expires the game does not stop automatically; the teacher chooses a final question or +15 minutes.",
      minutes: "min",
      planned: "left",
      expiredShort: "TIME",
      fiveMinutes: "Less than 5 minutes remain in the planned lesson",
      expired: "The planned lesson time has ended",
      finishRound: "Finish the current round. In the station phase you can choose how to end the lesson.",
      choose: "How should the lesson continue?",
      chooseSub: "No one has completed a 10/10 station yet. Choose one of the two options.",
      finalButton: "⚡ Final accelerated question",
      finalHelp: "One last question with a shorter answer window, followed by the final station phase and standings.",
      extendButton: "➕ Continue for 15 more minutes",
      extendHelp: "Add 15 minutes to the game and continue with normal rounds.",
      finalQuestion: "FINAL QUESTION",
      finalQuestionSub: "This is the last question of the lesson",
      finalResult: "FINAL QUESTION RESULT",
      finalResultSub: "Show the result, then move to the final station phase.",
      finalStation: "FINAL STATION PHASE",
      finalStationSub: "Use the last rewards: recruit a cadet or build a module. Then the teacher ends the game.",
      finishGame: "🏁 Finish game and show results",
      waitingTeacher: "Lesson time has ended — waiting for the teacher's decision.",
      classFinalQuestion: "⚡ Final question of the lesson",
      classFinalResult: "🏆 Final question result",
      classFinalStation: "🏁 Final station phase — use your last rewards",
      extended: "Lesson extended by 15 minutes",
      actionFailed: "Action could not be completed"
    }
  }[LOCALE];

  const app = document.getElementById("app");
  let busy = false;
  let queued = false;
  let lastStateSignature = "";

  const style = document.createElement("style");
  style.id = "alba-session-timing-style";
  style.textContent = `
    .alba-duration-control{margin:14px 0;padding:13px 14px;border-radius:14px;border:1px solid rgba(112,232,255,.13);background:rgba(112,232,255,.035)}
    .alba-duration-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.alba-duration-head label{font-weight:850}.alba-duration-value{padding:5px 9px;border-radius:999px;background:rgba(112,232,255,.09);border:1px solid rgba(112,232,255,.15);color:#9cf1ff;font-weight:900;white-space:nowrap}
    .alba-duration-control input[type=range]{width:100%;margin:12px 0 7px;accent-color:#72e8ff}.alba-duration-help{font-size:.78rem;line-height:1.45;color:#9eb3c1}
    #plannedSessionKpi.alba-time-warn{border-color:rgba(255,209,102,.34);color:#ffe29b;box-shadow:0 0 20px rgba(255,209,102,.07)}#plannedSessionKpi.alba-time-expired{border-color:rgba(255,111,111,.38);color:#ffb0a9;box-shadow:0 0 20px rgba(255,90,90,.08)}
    .alba-time-banner{position:relative;margin:0 0 14px;padding:12px 14px 12px 46px;border-radius:15px;border:1px solid rgba(255,209,102,.22);background:linear-gradient(135deg,rgba(255,209,102,.09),rgba(255,128,80,.035));box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}.alba-time-banner::before{content:"⏱";position:absolute;left:14px;top:12px;font-size:1.25rem}.alba-time-banner strong{display:block;color:#ffe09a;font-size:.82rem;letter-spacing:.07em}.alba-time-banner span{display:block;margin-top:3px;color:#c9d7df;font-size:.82rem;line-height:1.42}
    .alba-session-decision{margin:0 0 15px;padding:17px;border-radius:18px;border:1px solid rgba(255,209,102,.25);background:radial-gradient(circle at 15% 0,rgba(255,209,102,.105),transparent 38%),rgba(4,14,25,.82);box-shadow:0 18px 50px rgba(0,0,0,.2)}.alba-session-decision h2{margin:3px 0 5px;font-size:clamp(1.15rem,2vw,1.55rem)}.alba-session-decision>p{margin:0 0 14px;color:#aebfca;line-height:1.45}.alba-session-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.alba-session-option{padding:13px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}.alba-session-option .btn{width:100%;min-height:46px}.alba-session-option p{margin:8px 2px 0;font-size:.76rem;line-height:1.42;color:#9fb2bf}.alba-session-option.final{border-color:rgba(255,209,102,.17)}.alba-session-option.extend{border-color:rgba(112,232,255,.14)}
    .alba-final-round-banner{margin:0 0 14px;padding:13px 15px;border-radius:15px;border:1px solid rgba(112,232,255,.22);background:linear-gradient(135deg,rgba(112,232,255,.085),rgba(130,103,255,.04));box-shadow:0 0 30px rgba(112,232,255,.04)}.alba-final-round-banner strong{display:block;color:#9cf3ff;letter-spacing:.1em;font-size:.78rem}.alba-final-round-banner span{display:block;margin-top:4px;color:#c2d3dc;font-size:.82rem;line-height:1.4}.alba-final-round-banner .alba-final-seconds{display:inline-flex;margin-top:8px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,209,102,.19);background:rgba(255,209,102,.06);color:#ffe29b;font-size:.72rem;font-weight:900}
    .alba-final-station-panel{margin:0 0 14px;padding:16px;border-radius:17px;border:1px solid rgba(112,232,255,.25);background:radial-gradient(circle at 12% 0,rgba(112,232,255,.095),transparent 38%),rgba(3,14,24,.82)}.alba-final-station-panel h2{margin:2px 0 5px;font-size:1.25rem}.alba-final-station-panel p{margin:0 0 12px;color:#aebfca;font-size:.83rem;line-height:1.45}.alba-final-station-panel .btn{width:100%}
    .alba-student-final-status{margin:0 0 14px;padding:12px 14px;border-radius:14px;border:1px solid rgba(112,232,255,.16);background:rgba(112,232,255,.045);color:#c8d9e2;font-weight:760;text-align:center}.alba-student-final-status strong{color:#9cf3ff}
    @media(max-width:720px){.alba-session-options{grid-template-columns:1fr}.alba-duration-head{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  function gameState() {
    try { return typeof state !== "undefined" ? state : null; } catch { return null; }
  }
  function activeRoomId() {
    try { if (typeof roomId !== "undefined" && roomId) return roomId; } catch {}
    return gameState()?.roomId || "";
  }
  function callApply(next) {
    try { if (typeof apply === "function") apply(next); } catch {}
  }
  function callToast(message) {
    try { if (typeof toast === "function") return toast(message); } catch {}
    console.info("[AlbaSpace]", message);
  }
  function isExpired(gs, at = Date.now()) {
    return !!(gs && gs.status !== "FINISHED" && gs.startedAt && gs.plannedEndAt && at >= Number(gs.plannedEndAt));
  }
  function remainingLabel(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}` : `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  }
  async function send(type, payload = {}) {
    if (busy) return null;
    const rid = activeRoomId();
    if (!rid) return null;
    busy = true;
    document.querySelectorAll("[data-session-command]").forEach(button => button.disabled = true);
    try {
      const response = await AlbaGame.command(rid, type, payload);
      if (response?.state) callApply(response.state);
      return response;
    } catch (error) {
      callToast(error?.message || COPY.actionFailed);
      return null;
    } finally {
      busy = false;
      queueSync();
    }
  }

  function patchCreateRoom() {
    if (SURFACE !== "teacher" || !window.AlbaGame?.createRoom || AlbaGame.createRoom.__albaSessionTiming) return;
    const original = AlbaGame.createRoom.bind(AlbaGame);
    const patched = async (presentationMode, timingMode = "STANDARD") => {
      const duration = Number(document.getElementById("plannedDuration")?.value || 60);
      const created = await original(presentationMode, timingMode);
      if (!created?.state?.roomId) return created;
      return AlbaGame.command(created.state.roomId, "SET_SESSION_DURATION", { minutes: duration });
    };
    patched.__albaSessionTiming = true;
    AlbaGame.createRoom = patched;
  }

  function injectDurationControl() {
    if (SURFACE !== "teacher" || gameState() || document.getElementById("albaDurationControl")) return;
    const createButton = document.getElementById("create");
    const presentation = document.getElementById("presentationMode");
    if (!createButton || !presentation) return;
    const buttonGrid = createButton.closest(".grid");
    const host = document.createElement("div");
    host.id = "albaDurationControl";
    host.className = "alba-duration-control";
    host.innerHTML = `<div class="alba-duration-head"><label for="plannedDuration">⏱ ${COPY.durationLabel}</label><span id="plannedDurationValue" class="alba-duration-value">60 ${COPY.minutes}</span></div><input id="plannedDuration" type="range" min="45" max="85" step="5" value="60" aria-label="${COPY.durationLabel}"><div class="alba-duration-help">${COPY.durationHelp}</div>`;
    if (buttonGrid) buttonGrid.before(host); else presentation.after(host);
    const slider = host.querySelector("#plannedDuration");
    const output = host.querySelector("#plannedDurationValue");
    slider.addEventListener("input", () => output.textContent = `${slider.value} ${COPY.minutes}`);
  }

  function syncTeacherClock(gs) {
    if (SURFACE !== "teacher") return;
    const sessionKpi = document.getElementById("sessionKpi");
    if (!sessionKpi || !gs?.startedAt || gs.phase === "ENDGAME") {
      document.getElementById("plannedSessionKpi")?.remove();
      return;
    }
    let clock = document.getElementById("plannedSessionKpi");
    if (!clock) {
      clock = document.createElement("span");
      clock.id = "plannedSessionKpi";
      clock.className = "kpi";
      sessionKpi.after(clock);
    }
    const ms = Number(gs.plannedEndAt || 0) - Date.now();
    clock.classList.toggle("alba-time-warn", ms > 0 && ms <= 5 * 60_000);
    clock.classList.toggle("alba-time-expired", ms <= 0);
    clock.textContent = ms <= 0 ? `⏱ ${COPY.expiredShort}` : `⏳ ${remainingLabel(ms)} ${COPY.planned}`;
    clock.title = ms > 0 && ms <= 5 * 60_000 ? COPY.fiveMinutes : COPY.durationLabel;
  }

  function topInsert(node) {
    if (!app || !node) return;
    const first = app.firstElementChild;
    if (first) app.insertBefore(node, first); else app.appendChild(node);
  }
  function clearTransient() {
    document.querySelectorAll(".alba-time-banner,.alba-session-decision,.alba-final-round-banner,.alba-final-station-panel,.alba-student-final-status").forEach(node => node.remove());
  }
  function setNormalNextButton(gs, blocked) {
    if (SURFACE !== "teacher") return;
    const next = document.getElementById("nextQ");
    if (!next) return;
    const finalStation = !!(gs?.finalRoundActive && gs?.finalStationPending && gs?.phase === "STATION");
    next.hidden = finalStation;
    next.disabled = !!blocked;
    next.setAttribute("aria-disabled", blocked ? "true" : "false");
  }

  function addTimeBanner(title, text) {
    const banner = document.createElement("div");
    banner.className = "alba-time-banner";
    banner.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    topInsert(banner);
  }
  function addFinalBanner(title, sub, seconds = null) {
    const banner = document.createElement("div");
    banner.className = "alba-final-round-banner";
    banner.innerHTML = `<strong>⚡ ${title}</strong><span>${sub}</span>${seconds ? `<span class="alba-final-seconds">≈ ${seconds} s</span>` : ""}`;
    topInsert(banner);
  }

  function renderTeacherTiming(gs) {
    if (!gs || gs.phase === "LOBBY" || gs.phase === "ENDGAME" || !gs.startedAt) return;
    const expired = isExpired(gs);
    const final = !!gs.finalRoundActive;

    if (final) {
      setNormalNextButton(gs, true);
      if (gs.phase === "QUESTION") addFinalBanner(COPY.finalQuestion, COPY.finalQuestionSub, Number(gs.finalRoundAnswerSeconds || 0));
      else if (gs.phase === "RESULT") addFinalBanner(COPY.finalResult, COPY.finalResultSub);
      else if (gs.phase === "STATION" && gs.finalStationPending) {
        const panel = document.createElement("div");
        panel.className = "alba-final-station-panel";
        panel.innerHTML = `<h2>🏁 ${COPY.finalStation}</h2><p>${COPY.finalStationSub}</p><button class="btn primary" data-session-command="finish-final">${COPY.finishGame}</button>`;
        topInsert(panel);
        panel.querySelector("[data-session-command]").onclick = () => send("FINISH_FINAL_ROUND");
      }
      return;
    }

    if (!expired) {
      setNormalNextButton(gs, false);
      return;
    }

    if (gs.phase !== "STATION") {
      addTimeBanner(COPY.expired, COPY.finishRound);
      return;
    }

    setNormalNextButton(gs, true);
    const panel = document.createElement("div");
    panel.className = "alba-session-decision";
    panel.innerHTML = `<div class="phase">⏱ ${COPY.expired}</div><h2>${COPY.choose}</h2><p>${COPY.chooseSub}</p><div class="alba-session-options"><div class="alba-session-option final"><button class="btn primary" data-session-command="final">${COPY.finalButton}</button><p>${COPY.finalHelp}</p></div><div class="alba-session-option extend"><button class="btn ghost" data-session-command="extend">${COPY.extendButton}</button><p>${COPY.extendHelp}</p></div></div>`;
    topInsert(panel);
    panel.querySelector('[data-session-command="final"]').onclick = () => send("START_FINAL_ROUND");
    panel.querySelector('[data-session-command="extend"]').onclick = async () => {
      const result = await send("EXTEND_SESSION");
      if (result) callToast(COPY.extended);
    };
  }

  function renderAudienceTiming(gs) {
    if (!gs || gs.phase === "LOBBY" || gs.phase === "ENDGAME" || !gs.startedAt) return;
    let text = "";
    if (gs.finalRoundActive) {
      if (gs.phase === "QUESTION") text = COPY.classFinalQuestion;
      else if (gs.phase === "RESULT") text = COPY.classFinalResult;
      else if (gs.phase === "STATION") text = COPY.classFinalStation;
    } else if (isExpired(gs)) text = COPY.waitingTeacher;
    if (!text) return;
    const banner = document.createElement("div");
    banner.className = "alba-student-final-status";
    banner.innerHTML = `<strong>${text}</strong>`;
    topInsert(banner);
  }

  function sync() {
    queued = false;
    patchCreateRoom();
    const gs = gameState();
    injectDurationControl();
    syncTeacherClock(gs);
    clearTransient();
    if (!gs) return;
    const signature = [gs.version, gs.phase, gs.plannedEndAt, gs.finalRoundActive, gs.finalStationPending, gs.finalRoundNumber].join(":");
    lastStateSignature = signature;
    if (SURFACE === "teacher") renderTeacherTiming(gs); else renderAudienceTiming(gs);
  }
  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  if (app) new MutationObserver(queueSync).observe(app, { childList:true, subtree:true });
  setInterval(() => {
    const gs = gameState();
    if (gs?.startedAt && gs.phase !== "ENDGAME") queueSync();
  }, 500);
  window.addEventListener("focus", queueSync);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) queueSync(); });
  patchCreateRoom();
  queueSync();

  window.AlbaSessionTimingUX = { version:"20260910-time1", surface:SURFACE, refresh:queueSync, isExpired };
})();
