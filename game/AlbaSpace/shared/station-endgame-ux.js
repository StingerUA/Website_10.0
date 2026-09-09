/* AlbaSpace Endgame UX — 9/10 warning and authoritative 10th-module victory presentation. */
(function () {
  if (window.AlbaStationEndgameUX) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: {
      finalWarning: "ПОСЛЕДНИЙ МОДУЛЬ",
      finalWarningBody: "Станция готова на 9/10. Построй ещё один модуль — и победа твоя.",
      finalBuild: "ПОБЕДНЫЙ МОДУЛЬ",
      finalBuildHint: "Следующая успешная стыковка завершит строительство станции.",
      complete: "ОРБИТАЛЬНАЯ СТАНЦИЯ ЗАВЕРШЕНА",
      tenOfTen: "10 / 10 МОДУЛЕЙ",
      victory: "ПОБЕДА",
      victorySub: "Миссия выполнена. Твоя орбитальная академия полностью построена.",
      winner: "ПОБЕДИТЕЛЬ",
      missionComplete: "МИССИЯ ЗАВЕРШЕНА",
      winnerSub: "Первой завершила орбитальную станцию",
      sessionComplete: "СЕССИЯ ЗАВЕРШЕНА",
      sessionSub: "Итоги занятия готовы.",
      finalStatus: "ФИНАЛЬНЫЙ СТАТУС"
    },
    tr: {
      finalWarning: "SON MODÜL",
      finalWarningBody: "İstasyon 9/10 tamamlandı. Bir modül daha inşa et ve zafer senin olsun.",
      finalBuild: "ZAFER MODÜLÜ",
      finalBuildHint: "Bir sonraki başarılı kenetlenme istasyonu tamamlayacak.",
      complete: "YÖRÜNGE İSTASYONU TAMAMLANDI",
      tenOfTen: "10 / 10 MODÜL",
      victory: "ZAFER",
      victorySub: "Görev tamamlandı. Yörünge akademin tamamen kuruldu.",
      winner: "KAZANAN",
      missionComplete: "GÖREV TAMAMLANDI",
      winnerSub: "Yörünge istasyonunu ilk tamamlayan",
      sessionComplete: "OTURUM TAMAMLANDI",
      sessionSub: "Ders sonuçları hazır.",
      finalStatus: "FİNAL DURUMU"
    },
    en: {
      finalWarning: "FINAL MODULE",
      finalWarningBody: "Your station is 9/10 complete. Build one more module to win.",
      finalBuild: "VICTORY MODULE",
      finalBuildHint: "The next successful docking completes the station.",
      complete: "ORBITAL STATION COMPLETE",
      tenOfTen: "10 / 10 MODULES",
      victory: "VICTORY",
      victorySub: "Mission complete. Your orbital academy is fully built.",
      winner: "WINNER",
      missionComplete: "MISSION COMPLETE",
      winnerSub: "First to complete the orbital station",
      sessionComplete: "SESSION COMPLETE",
      sessionSub: "The lesson results are ready.",
      finalStatus: "FINAL STATUS"
    }
  }[LOCALE];

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  let queued = false;
  let warningRound = null;
  let endgameKey = null;
  let cinematicToken = 0;

  const style = document.createElement("style");
  style.id = "alba-endgame-ux-style";
  style.textContent = `
    .alba-final-module-warning{position:relative;margin:10px 0 13px;padding:13px 14px 13px 48px;border-radius:15px;border:1px solid rgba(255,209,102,.34);background:linear-gradient(135deg,rgba(255,209,102,.11),rgba(255,151,73,.055));box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 0 28px rgba(255,209,102,.055);overflow:hidden}
    .alba-final-module-warning::before{content:"9/10";position:absolute;left:10px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,222,128,.42);background:rgba(255,209,102,.12);font-size:.7rem;font-weight:900;color:#ffe39b;box-shadow:0 0 18px rgba(255,209,102,.12)}
    .alba-final-module-warning strong{display:block;font-size:.78rem;letter-spacing:.12em;color:#ffe39b}.alba-final-module-warning span{display:block;margin-top:4px;font-size:.82rem;line-height:1.4;color:#d8e1e7}
    .station-viewport[data-final-module="1"]{box-shadow:inset 0 0 0 1px rgba(255,209,102,.24),0 0 38px rgba(255,209,102,.07)}
    .station-action-section[data-station-section="build"].alba-final-build{border-color:rgba(255,209,102,.22);background:linear-gradient(180deg,rgba(255,209,102,.055),rgba(255,255,255,.02))}
    .alba-final-build-note{margin:9px 0 0;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,209,102,.18);background:rgba(255,209,102,.055);font-size:.78rem;line-height:1.4;color:#f4e1b1}.alba-final-build-note strong{color:#ffe39b;letter-spacing:.05em}
    .station-stage.alba-endgame-stage{position:relative;overflow:hidden}.station-stage.alba-endgame-stage .endgame-panel{transition:opacity .55s ease,transform .55s ease}.endgame-panel[data-cinematic-hidden="1"]{opacity:0!important;transform:translateY(10px);pointer-events:none}
    .alba-endgame-overlay{position:absolute;inset:0;z-index:46;display:grid;place-items:center;border-radius:inherit;overflow:hidden;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(20,68,92,.18),rgba(2,8,16,.72) 72%);backdrop-filter:blur(1.5px)}
    .alba-endgame-overlay::before,.alba-endgame-overlay::after{content:"";position:absolute;inset:-35%;background:conic-gradient(from 0deg,transparent 0 12deg,rgba(109,230,255,.055) 13deg,transparent 14deg 42deg,rgba(255,209,102,.045) 43deg,transparent 44deg 72deg);animation:albaEndOrbit 8s linear infinite}.alba-endgame-overlay::after{inset:-15%;animation-duration:12s;animation-direction:reverse;opacity:.55}
    .alba-endgame-center{position:relative;z-index:2;width:min(560px,calc(100% - 38px));padding:24px 24px 21px;text-align:center;border-radius:22px;border:1px solid rgba(126,236,255,.22);background:linear-gradient(180deg,rgba(5,18,31,.82),rgba(3,11,21,.72));box-shadow:0 28px 80px rgba(0,0,0,.42),0 0 60px rgba(87,221,244,.07);backdrop-filter:blur(12px)}
    .alba-endgame-emblem{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 12px;border-radius:50%;border:1px solid rgba(255,218,116,.4);background:radial-gradient(circle,rgba(255,213,102,.17),rgba(255,213,102,.035));font-size:1.8rem;box-shadow:0 0 34px rgba(255,209,102,.12)}
    .alba-endgame-kicker{font-size:.72rem;font-weight:900;letter-spacing:.19em;color:#91efff}.alba-endgame-title{margin:7px 0 0;font-size:clamp(1.35rem,3vw,2.35rem);line-height:1.05;letter-spacing:.04em}.alba-endgame-sub{margin:9px auto 0;max-width:440px;color:#c1d2dc;font-size:.88rem;line-height:1.5}.alba-endgame-meter{display:flex;align-items:center;gap:10px;margin:17px auto 0;max-width:360px}.alba-endgame-meter span{font-size:.72rem;font-weight:900;color:#ffe39b;white-space:nowrap}.alba-endgame-track{flex:1;height:4px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.alba-endgame-fill{width:0;height:100%;border-radius:999px;background:linear-gradient(90deg,#70e8ff,#ffd166);box-shadow:0 0 18px rgba(112,232,255,.28);animation:albaEndFill 2.25s .55s ease forwards}
    .alba-endgame-pulse{position:absolute;left:50%;top:50%;width:130px;height:130px;border:1px solid rgba(112,232,255,.28);border-radius:50%;transform:translate(-50%,-50%);animation:albaEndPulse 2.2s ease-out infinite}
    .alba-endgame-finalized .endgame-panel{border-color:rgba(112,232,255,.2);box-shadow:0 18px 54px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.035)}
    .alba-endgame-summary-badge{margin:0 0 10px;padding:9px 10px;border-radius:11px;border:1px solid rgba(112,232,255,.14);background:rgba(112,232,255,.045);font-size:.74rem;letter-spacing:.1em;font-weight:900;color:#9af2ff;text-align:center}
    @keyframes albaEndOrbit{to{transform:rotate(360deg)}}@keyframes albaEndFill{to{width:100%}}@keyframes albaEndPulse{0%{opacity:.42;transform:translate(-50%,-50%) scale(.55)}75%,100%{opacity:0;transform:translate(-50%,-50%) scale(3.2)}}
    @media (prefers-reduced-motion:reduce){.alba-endgame-overlay::before,.alba-endgame-overlay::after,.alba-endgame-fill,.alba-endgame-pulse{animation:none!important}.alba-endgame-fill{width:100%}}
  `;
  document.head.appendChild(style);

  function currentState() {
    try { return typeof state !== "undefined" ? state : null; } catch { return null; }
  }
  function currentPlayer() {
    try { return typeof me === "function" ? me() : null; } catch { return null; }
  }
  function renderer() {
    try { return typeof stationRenderer !== "undefined" ? stationRenderer : null; } catch { return null; }
  }
  function modules(player) { return Number(player?.small || 0) + Number(player?.large || 0); }
  function safe(value) {
    try { return AlbaGame.esc(String(value ?? "")); } catch { return String(value ?? ""); }
  }
  function roomKey(gameState, player) {
    let rid = gameState?.roomId || "room";
    try { if (typeof roomId !== "undefined" && roomId) rid = roomId; } catch {}
    return `alba:endgame:v1:${rid}:${gameState?.winnerId || "none"}:${gameState?.round || 0}:${player?.id || "viewer"}`;
  }

  function addFinalModuleWarning(gameState, player) {
    const isNine = gameState?.phase === "STATION" && modules(player) === 9 && !gameState.winnerId;
    const controls = document.querySelector(".station-controls");
    const viewport = document.querySelector(".station-viewport");
    if (!isNine) {
      document.querySelectorAll(".alba-final-module-warning,.alba-final-build-note").forEach(node => node.remove());
      document.querySelectorAll(".alba-final-build").forEach(node => node.classList.remove("alba-final-build"));
      if (viewport) viewport.dataset.finalModule = "0";
      warningRound = null;
      return;
    }
    if (viewport) viewport.dataset.finalModule = "1";
    if (!controls) return;
    const hub = controls.querySelector(".station-phase-hub");
    if (!controls.querySelector(".alba-final-module-warning")) {
      const warning = document.createElement("div");
      warning.className = "alba-final-module-warning";
      warning.innerHTML = `<strong>⚠ ${COPY.finalWarning}</strong><span>${COPY.finalWarningBody}</span>`;
      if (hub) hub.after(warning); else controls.prepend(warning);
    }
    const build = controls.querySelector('[data-station-section="build"]');
    if (build) {
      build.classList.add("alba-final-build");
      if (!build.querySelector(".alba-final-build-note")) {
        const note = document.createElement("div");
        note.className = "alba-final-build-note";
        note.innerHTML = `<strong>🏁 ${COPY.finalBuild}</strong><br>${COPY.finalBuildHint}`;
        build.appendChild(note);
      }
    }
    warningRound = Number(gameState.round || 0);
  }

  function tweenCamera(targetRenderer, destination, duration) {
    const camera = targetRenderer?.camera;
    if (!camera || !window.BABYLON) return Promise.resolve();
    const token = ++cinematicToken;
    const start = targetRenderer.captureView?.() || {
      alpha: camera.alpha, beta: camera.beta, radius: camera.radius,
      target: { x: camera.target?.x || 0, y: camera.target?.y || 0, z: camera.target?.z || 0 }
    };
    const started = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    return new Promise(resolve => {
      const frame = now => {
        if (token !== cinematicToken || !targetRenderer.camera) return resolve();
        const rawT = Math.min(1, (now - started) / Math.max(1, duration));
        const t = ease(rawT);
        camera.alpha = start.alpha + (destination.alpha - start.alpha) * t;
        camera.beta = start.beta + (destination.beta - start.beta) * t;
        camera.radius = start.radius + (destination.radius - start.radius) * t;
        camera.setTarget(new BABYLON.Vector3(
          start.target.x + (destination.target.x - start.target.x) * t,
          start.target.y + (destination.target.y - start.target.y) * t,
          start.target.z + (destination.target.z - start.target.z) * t
        ));
        if (rawT < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  function pullBack(localWinner) {
    const targetRenderer = renderer();
    if (!targetRenderer?.camera) return Promise.resolve();
    const target = targetRenderer.defaultTarget || new BABYLON.Vector3(0, 0.2, 0);
    const current = targetRenderer.captureView?.();
    const destination = {
      alpha: -Math.PI / 3 + (localWinner ? 0.18 : -0.04),
      beta: 1.03,
      radius: Math.min(31, Math.max(localWinner ? 25 : 22, Number(current?.radius || targetRenderer.camera.radius || 20) * 1.32)),
      target: { x: target.x || 0, y: target.y ?? 0.2, z: target.z || 0 }
    };
    return tweenCamera(targetRenderer, destination, reducedMotion ? 1 : (localWinner ? 2550 : 1650));
  }

  function upgradeEndPanel(gameState, player) {
    const panel = document.querySelector(".endgame-panel");
    const stage = document.querySelector(".station-stage");
    if (!panel || panel.dataset.endgameUpgraded === "1") return;
    panel.dataset.endgameUpgraded = "1";
    panel.dataset.cinematicHidden = "0";
    stage?.classList.add("alba-endgame-finalized");
    const badge = document.createElement("div");
    badge.className = "alba-endgame-summary-badge";
    const localWinner = Boolean(gameState.winnerId && gameState.winnerId === player.id);
    badge.textContent = localWinner ? `🏆 ${COPY.finalStatus} · ${COPY.tenOfTen}` : `✦ ${COPY.finalStatus}`;
    panel.prepend(badge);
  }

  function createOverlay(gameState, player, localWinner) {
    const stage = document.querySelector(".station-stage");
    if (!stage) return null;
    stage.classList.add("alba-endgame-stage");
    stage.querySelector(".alba-endgame-overlay")?.remove();
    const winner = gameState.winnerId ? gameState.players?.find(item => item.id === gameState.winnerId) : null;
    const overlay = document.createElement("div");
    overlay.className = "alba-endgame-overlay";
    const title = localWinner ? COPY.victory : winner ? COPY.missionComplete : COPY.sessionComplete;
    const kicker = localWinner ? COPY.complete : winner ? COPY.winner : COPY.finalStatus;
    const sub = localWinner ? COPY.victorySub : winner ? `${COPY.winnerSub}: ${safe(winner.company)}` : COPY.sessionSub;
    const emblem = localWinner ? "🏆" : winner ? "🚀" : "✦";
    overlay.innerHTML = `<div class="alba-endgame-pulse"></div><div class="alba-endgame-center"><div class="alba-endgame-emblem">${emblem}</div><div class="alba-endgame-kicker">${kicker}</div><h2 class="alba-endgame-title">${title}</h2><p class="alba-endgame-sub">${sub}</p>${localWinner ? `<div class="alba-endgame-meter"><span>0</span><div class="alba-endgame-track"><div class="alba-endgame-fill"></div></div><span>${COPY.tenOfTen}</span></div>` : ""}</div>`;
    stage.appendChild(overlay);
    return overlay;
  }

  async function playEndgame(gameState, player) {
    const key = roomKey(gameState, player);
    if (endgameKey === key) return;
    endgameKey = key;
    const panel = document.querySelector(".endgame-panel");
    if (!panel) return;

    const alreadySeen = sessionStorage.getItem(key) === "1";
    const localWinner = Boolean(gameState.winnerId && gameState.winnerId === player.id && modules(player) === 10);
    if (alreadySeen) {
      upgradeEndPanel(gameState, player);
      if (renderer()?.camera) {
        try { renderer().resetView?.(); } catch {}
      }
      return;
    }
    sessionStorage.setItem(key, "1");

    try { window.AlbaStationBuildMode?.cancel?.(false); } catch {}
    try { window.AlbaCrewSlotMode?.cancel?.(); } catch {}
    try { window.AlbaCadetInspectMode?.close?.(false); } catch {}
    try { window.AlbaStationPhaseUI?.selectAction?.("overview", { passive: true }); } catch {}

    panel.dataset.cinematicHidden = "1";
    const overlay = createOverlay(gameState, player, localWinner);
    if (!overlay) {
      upgradeEndPanel(gameState, player);
      return;
    }

    if (reducedMotion) {
      await pullBack(localWinner);
      setTimeout(() => {
        overlay.remove();
        upgradeEndPanel(gameState, player);
      }, 550);
      return;
    }

    // The authoritative tenth-module update reaches ENDGAME immediately. Give Build Mode's
    // existing docking animation time to settle, then pull back to reveal the complete station.
    await new Promise(resolve => setTimeout(resolve, localWinner ? 1150 : 500));
    await pullBack(localWinner);
    await new Promise(resolve => setTimeout(resolve, localWinner ? 950 : 450));
    overlay.style.transition = "opacity .55s ease";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
      upgradeEndPanel(gameState, player);
    }, 560);
  }

  function process() {
    queued = false;
    const gameState = currentState();
    const player = currentPlayer();
    if (!gameState || !player) return;
    addFinalModuleWarning(gameState, player);
    if (gameState.phase === "ENDGAME" && document.querySelector(".endgame-panel")) playEndgame(gameState, player);
    else if (gameState.phase !== "ENDGAME") endgameKey = null;
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(process);
  }

  const app = document.getElementById("app");
  if (app) new MutationObserver(queue).observe(app, { childList: true, subtree: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) queue(); });
  queue();

  window.AlbaStationEndgameUX = {
    version: "20260909-endgame1",
    refresh: queue,
    get warningRound() { return warningRound; }
  };
})();
