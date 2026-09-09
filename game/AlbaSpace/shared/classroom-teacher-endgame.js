/* AlbaSpace Teacher + Classroom Endgame — projector finale and teacher summary. */
(function () {
  if (window.AlbaClassroomTeacherEndgame) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const brand = String(document.querySelector(".brand")?.textContent || "").toUpperCase();
  const SURFACE = brand.includes("CLASSROOM") ? "classroom" : brand.includes("TEACHER") ? "teacher" : "other";
  if (SURFACE === "other") return;

  const COPY = {
    ru: {
      finale: "ФИНАЛ МИССИИ",
      winner: "ПОБЕДИТЕЛЬ",
      stationComplete: "ОРБИТАЛЬНАЯ СТАНЦИЯ ЗАВЕРШЕНА",
      firstComplete: "Первая компания, завершившая орбитальную академию",
      ten: "10 / 10 МОДУЛЕЙ",
      winnerStation: "СТАНЦИЯ ПОБЕДИТЕЛЯ",
      finalRanking: "ИТОГОВЫЙ РЕЙТИНГ",
      company: "Компания",
      station: "Станция",
      graduates: "Выпускники",
      credits: "ALBA Coins",
      sessionComplete: "ЗАНЯТИЕ ЗАВЕРШЕНО",
      sessionSub: "Учитель завершил сессию. Итоговый рейтинг зафиксирован.",
      leader: "Лидер по итогам занятия",
      teacherFinal: "ФИНАЛ ЗАНЯТИЯ",
      teacherVictory: "Станция 10/10 построена",
      teacherSession: "Сессия завершена учителем",
      players: "Игроков",
      round: "Раундов",
      duration: "Время",
      openClassroom: "📺 Открыть финал на экране класса",
      classroomHint: "На большом экране одновременно показываются станция победителя, 10/10 и итоговый рейтинг.",
      results: "Итоговые результаты",
      missionComplete: "МИССИЯ ВЫПОЛНЕНА",
      noCompany: "Игра завершена"
    },
    tr: {
      finale: "GÖREV FİNALİ",
      winner: "KAZANAN",
      stationComplete: "YÖRÜNGE İSTASYONU TAMAMLANDI",
      firstComplete: "Yörünge akademisini ilk tamamlayan şirket",
      ten: "10 / 10 MODÜL",
      winnerStation: "KAZANANIN İSTASYONU",
      finalRanking: "FİNAL SIRALAMASI",
      company: "Şirket",
      station: "İstasyon",
      graduates: "Mezunlar",
      credits: "ALBA Coins",
      sessionComplete: "DERS TAMAMLANDI",
      sessionSub: "Öğretmen oturumu sonlandırdı. Final sıralaması kaydedildi.",
      leader: "Ders sonu lideri",
      teacherFinal: "DERS FİNALİ",
      teacherVictory: "10/10 istasyon tamamlandı",
      teacherSession: "Oturum öğretmen tarafından sonlandırıldı",
      players: "Oyuncu",
      round: "Tur",
      duration: "Süre",
      openClassroom: "📺 Sınıf ekranında finali aç",
      classroomHint: "Büyük ekranda kazanan istasyon, 10/10 ve final sıralaması birlikte gösterilir.",
      results: "Final sonuçları",
      missionComplete: "GÖREV TAMAMLANDI",
      noCompany: "Oyun tamamlandı"
    },
    en: {
      finale: "MISSION FINALE",
      winner: "WINNER",
      stationComplete: "ORBITAL STATION COMPLETE",
      firstComplete: "First company to complete the orbital academy",
      ten: "10 / 10 MODULES",
      winnerStation: "WINNER STATION",
      finalRanking: "FINAL RANKING",
      company: "Company",
      station: "Station",
      graduates: "Graduates",
      credits: "ALBA Coins",
      sessionComplete: "LESSON COMPLETE",
      sessionSub: "The teacher ended the session. Final standings are locked.",
      leader: "Lesson leader",
      teacherFinal: "LESSON FINALE",
      teacherVictory: "10/10 station completed",
      teacherSession: "Session ended by teacher",
      players: "Players",
      round: "Rounds",
      duration: "Time",
      openClassroom: "📺 Open finale on classroom screen",
      classroomHint: "The big screen shows the winning station, 10/10 and final ranking together.",
      results: "Final results",
      missionComplete: "MISSION COMPLETE",
      noCompany: "Game complete"
    }
  }[LOCALE];

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const app = document.getElementById("app");
  let queued = false;
  let rendering = false;
  let lastKey = "";
  let classroomRenderer = null;
  let orbitObserver = null;
  let introRaf = 0;

  const style = document.createElement("style");
  style.id = "alba-classroom-teacher-endgame-style";
  style.textContent = `
    .alba-class-final{position:relative;isolation:isolate;overflow:hidden;border-radius:24px;padding:18px;background:radial-gradient(circle at 28% 18%,rgba(75,199,239,.11),transparent 30%),radial-gradient(circle at 78% 12%,rgba(255,207,91,.08),transparent 25%),linear-gradient(180deg,rgba(5,17,30,.9),rgba(2,8,17,.96));border:1px solid rgba(126,235,255,.16);box-shadow:0 30px 90px rgba(0,0,0,.32)}
    .alba-class-final::before{content:"";position:absolute;inset:-45%;z-index:-1;background:conic-gradient(from 90deg,transparent 0 18deg,rgba(100,229,255,.035) 19deg,transparent 20deg 53deg,rgba(255,209,102,.025) 54deg,transparent 55deg 88deg);animation:albaClassOrbit 18s linear infinite}
    .alba-class-final-head{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;margin-bottom:14px;padding:12px 14px}
    .alba-class-kicker{font-size:clamp(.72rem,1.1vw,1rem);font-weight:900;letter-spacing:.22em;color:#8eeeff}.alba-class-final-head h1{margin:5px 0 0;font-size:clamp(2.1rem,5vw,5.3rem);line-height:.98;letter-spacing:.01em}.alba-class-final-head p{margin:8px 0 0;color:#bcd0dc;font-size:clamp(.95rem,1.6vw,1.4rem)}
    .alba-ten-badge{display:grid;place-items:center;min-width:190px;min-height:88px;padding:12px 18px;border-radius:20px;border:1px solid rgba(255,214,104,.35);background:linear-gradient(145deg,rgba(255,209,102,.14),rgba(255,160,76,.055));box-shadow:0 0 48px rgba(255,209,102,.08),inset 0 1px 0 rgba(255,255,255,.06);font-size:clamp(1.15rem,2vw,1.8rem);font-weight:1000;letter-spacing:.08em;color:#ffe199;text-align:center}
    .alba-class-final-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(360px,.75fr);gap:16px;align-items:stretch}
    .alba-winner-stage,.alba-final-ranking{position:relative;border-radius:20px;border:1px solid rgba(255,255,255,.075);background:rgba(2,10,19,.66);overflow:hidden;min-height:540px}
    .alba-winner-stage{display:flex;flex-direction:column}.alba-stage-caption{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 15px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(4,16,27,.7);font-size:.78rem;font-weight:900;letter-spacing:.13em;color:#9aedfb}.alba-stage-caption span:last-child{color:#ffe29b}
    #albaClassWinnerStation{position:relative;flex:1;min-height:490px;overflow:hidden;pointer-events:none}.alba-class-station-fallback{height:100%;min-height:490px;display:grid;place-items:center;font-size:6rem;background:radial-gradient(circle,rgba(83,215,244,.12),transparent 48%)}
    .alba-stage-intro{position:absolute;inset:45px 0 0;z-index:10;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at center,rgba(3,13,24,.12),rgba(3,10,19,.62) 78%);transition:opacity .8s ease}.alba-stage-intro.settled{opacity:0}.alba-stage-intro-card{text-align:center;padding:22px 26px;border-radius:20px;border:1px solid rgba(126,235,255,.18);background:rgba(3,14,25,.73);backdrop-filter:blur(9px);box-shadow:0 20px 70px rgba(0,0,0,.3)}.alba-stage-intro-card .cup{font-size:2.5rem}.alba-stage-intro-card strong{display:block;margin-top:7px;font-size:clamp(1.2rem,2.3vw,2.2rem);letter-spacing:.06em}.alba-stage-intro-card span{display:block;margin-top:6px;color:#ffe19a;font-size:clamp(.85rem,1.4vw,1.15rem);font-weight:900;letter-spacing:.12em}
    .alba-final-ranking{padding:15px}.alba-final-ranking h2{margin:2px 0 13px;font-size:clamp(1.05rem,1.6vw,1.45rem);letter-spacing:.09em}.alba-rank-list{display:flex;flex-direction:column;gap:8px}.alba-rank-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:11px 10px;border-radius:13px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.025)}.alba-rank-row.winner{border-color:rgba(255,209,102,.3);background:linear-gradient(90deg,rgba(255,209,102,.11),rgba(255,209,102,.025));box-shadow:inset 3px 0 0 rgba(255,209,102,.55)}.alba-rank-pos{font-size:1.05rem;font-weight:1000;color:#91efff}.alba-rank-company{min-width:0;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.alba-rank-metric{font-size:.82rem;color:#c7d8e1;white-space:nowrap}.alba-rank-metric strong{color:#fff}.alba-class-final-footer{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:13px}.alba-class-final-pill{padding:7px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);font-size:.78rem;color:#bdd0dc}
    .alba-session-only{padding:34px 24px;text-align:center}.alba-session-only .icon{font-size:3rem}.alba-session-only h1{margin:8px 0 4px;font-size:clamp(2rem,5vw,4.6rem)}.alba-session-only p{font-size:clamp(1rem,1.8vw,1.5rem);color:#bcd0dc}.alba-session-rank{max-width:1000px;margin:20px auto 0;text-align:left}
    .alba-teacher-final{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:15px}.alba-teacher-final .card{margin:0}.alba-teacher-hero{position:relative;overflow:hidden;background:radial-gradient(circle at 20% 10%,rgba(78,216,246,.1),transparent 34%),rgba(4,15,27,.75)}.alba-teacher-hero h1{margin:7px 0 5px;font-size:clamp(1.8rem,4vw,3.5rem)}.alba-teacher-win{display:inline-flex;margin:10px 0;padding:7px 10px;border-radius:999px;border:1px solid rgba(255,209,102,.28);background:rgba(255,209,102,.08);color:#ffe19a;font-weight:900}.alba-teacher-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.alba-teacher-stat{padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025)}.alba-teacher-stat span{display:block;font-size:.72rem;color:#9fb4c2}.alba-teacher-stat strong{display:block;margin-top:3px;font-size:1.05rem}.alba-open-classroom{display:block;width:100%;margin-top:13px;text-align:center}.alba-teacher-hint{margin-top:9px;font-size:.78rem;color:#9fb4c2;line-height:1.45}.alba-teacher-table .winner td{background:rgba(255,209,102,.055);color:#ffe5ab}.alba-teacher-table .winner td:first-child{box-shadow:inset 3px 0 0 rgba(255,209,102,.55)}
    @keyframes albaClassOrbit{to{transform:rotate(360deg)}}
    @media(max-width:1050px){.alba-class-final-grid,.alba-teacher-final{grid-template-columns:1fr}.alba-winner-stage,.alba-final-ranking{min-height:auto}.alba-final-ranking{min-height:0}.alba-class-final-head{grid-template-columns:1fr}.alba-ten-badge{min-width:0;min-height:58px}.alba-rank-row{grid-template-columns:34px minmax(0,1fr) auto}.alba-rank-row .alba-rank-metric:last-child{display:none}}
    @media(max-width:620px){.alba-class-final{padding:8px}.alba-class-final-head{padding:8px}.alba-winner-stage{min-height:380px}#albaClassWinnerStation,.alba-class-station-fallback{min-height:330px}.alba-rank-row{grid-template-columns:30px minmax(0,1fr) auto}.alba-teacher-stats{grid-template-columns:1fr}.alba-class-final-head h1{font-size:2rem}}
    @media(prefers-reduced-motion:reduce){.alba-class-final::before{animation:none}.alba-stage-intro{transition:none}}
  `;
  document.head.appendChild(style);

  function gameState() {
    try { return typeof state !== "undefined" ? state : null; } catch { return null; }
  }
  function escapeHtml(value) {
    try { return AlbaGame.esc(String(value ?? "")); } catch { return String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  }
  function rankedPlayers(gs) {
    try { return AlbaSpace.rank(gs); } catch { return [...(gs?.players || [])].sort((a,b) => (b.small + b.large) - (a.small + a.large) || (b.credits || 0) - (a.credits || 0)); }
  }
  function winnerPlayer(gs) {
    const ranked = rankedPlayers(gs);
    return gs?.winnerId ? (gs.players || []).find(player => player.id === gs.winnerId) || ranked[0] : null;
  }
  function moduleCount(player) { return Number(player?.small || 0) + Number(player?.large || 0); }
  function elapsed(start) {
    if (!start) return "00:00";
    const total = Math.max(0, Math.floor((Date.now() - Number(start)) / 1000));
    return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
  }
  function keyFor(gs) {
    return JSON.stringify({
      surface: SURFACE, phase: gs?.phase, winnerId: gs?.winnerId || "", round: gs?.round || 0,
      players: (gs?.players || []).map(p => [p.id, p.company, p.small, p.large, p.graduates, p.credits])
    });
  }

  function stopClassroomRenderer() {
    if (classroomRenderer?.scene && orbitObserver) {
      try { classroomRenderer.scene.onBeforeRenderObservable.remove(orbitObserver); } catch {}
    }
    orbitObserver = null;
    if (introRaf) cancelAnimationFrame(introRaf);
    introRaf = 0;
    try { classroomRenderer?.dispose?.(); } catch {}
    classroomRenderer = null;
  }

  function rankingRows(gs, includeCredits) {
    const winnerId = gs?.winnerId || "";
    return rankedPlayers(gs).map((player, index) => {
      const winner = winnerId && player.id === winnerId;
      if (includeCredits) {
        return `<tr class="${winner ? "winner" : ""}"><td>${winner ? "🏆" : index + 1}</td><td><strong>${escapeHtml(player.company || "—")}</strong></td><td>${moduleCount(player)}/10</td><td>${Number(player.graduates || 0)}</td><td>${Number(player.credits || 0)}</td></tr>`;
      }
      return `<div class="alba-rank-row ${winner ? "winner" : ""}"><div class="alba-rank-pos">${winner ? "🏆" : index + 1}</div><div class="alba-rank-company">${escapeHtml(player.company || "—")}</div><div class="alba-rank-metric">🛰️ <strong>${moduleCount(player)}/10</strong></div><div class="alba-rank-metric">🎓 <strong>${Number(player.graduates || 0)}</strong></div></div>`;
    }).join("");
  }

  function mountWinnerStation(gs, winner) {
    const host = document.getElementById("albaClassWinnerStation");
    if (!host) return;
    stopClassroomRenderer();
    if (!window.AlbaStation3D?.Station3DRenderer || !window.BABYLON) {
      host.innerHTML = `<div class="alba-class-station-fallback">🛰️</div>`;
      return;
    }
    try {
      classroomRenderer = new AlbaStation3D.Station3DRenderer(host, { onSelect: () => {} });
      classroomRenderer.init();
      classroomRenderer.update(gs, winner);
      const camera = classroomRenderer.camera;
      camera?.detachControl?.();
      if (camera) {
        const target = classroomRenderer.defaultTarget || new BABYLON.Vector3(0, .2, 0);
        camera.setTarget(target);
        camera.alpha = -Math.PI * .72;
        camera.beta = 1.02;
        const finalRadius = Math.min(31, Math.max(23, 19 + moduleCount(winner) * .65));
        const startRadius = Math.max(15, finalRadius * .72);
        camera.radius = reducedMotion ? finalRadius : startRadius;
        if (!reducedMotion) {
          const start = performance.now();
          const duration = 3600;
          const startAlpha = camera.alpha;
          const frame = now => {
            if (!classroomRenderer?.camera || gs !== gameState()) return;
            const t0 = Math.min(1, (now - start) / duration);
            const t = 1 - Math.pow(1 - t0, 3);
            camera.radius = startRadius + (finalRadius - startRadius) * t;
            camera.alpha = startAlpha + .18 * t;
            if (t0 < 1) introRaf = requestAnimationFrame(frame);
          };
          introRaf = requestAnimationFrame(frame);
        }
        if (!reducedMotion && classroomRenderer.scene) {
          orbitObserver = classroomRenderer.scene.onBeforeRenderObservable.add(() => {
            if (!classroomRenderer?.camera || document.hidden) return;
            const dt = Math.min(40, classroomRenderer.engine?.getDeltaTime?.() || 16);
            classroomRenderer.camera.alpha += dt * .0000075;
          });
        }
      }
      const intro = document.querySelector(".alba-stage-intro");
      if (intro) setTimeout(() => intro.classList.add("settled"), reducedMotion ? 450 : 3900);
    } catch (error) {
      console.warn("[AlbaSpace] Classroom winner station fallback", error);
      stopClassroomRenderer();
      host.innerHTML = `<div class="alba-class-station-fallback">🛰️</div>`;
    }
  }

  function renderClassroom(gs) {
    const winner = winnerPlayer(gs);
    const ranked = rankedPlayers(gs);
    const leader = winner || ranked[0];
    if (!winner) {
      stopClassroomRenderer();
      app.innerHTML = `<section class="alba-class-final alba-session-only">
        <div class="icon">🏁</div><div class="alba-class-kicker">${COPY.finale}</div><h1>${COPY.sessionComplete}</h1><p>${COPY.sessionSub}</p>
        ${leader ? `<div class="alba-ten-badge" style="max-width:520px;margin:18px auto 0">${COPY.leader}: ${escapeHtml(leader.company || "—")}</div>` : ""}
        <div class="alba-session-rank"><div class="alba-final-ranking"><h2>${COPY.finalRanking}</h2><div class="alba-rank-list">${rankingRows(gs, false)}</div></div></div>
      </section>`;
      return;
    }

    app.innerHTML = `<section class="alba-class-final">
      <header class="alba-class-final-head">
        <div><div class="alba-class-kicker">${COPY.finale} · ${COPY.winner}</div><h1>🏆 ${escapeHtml(winner.company || COPY.noCompany)}</h1><p>${COPY.firstComplete}</p></div>
        <div class="alba-ten-badge">${COPY.ten}</div>
      </header>
      <div class="alba-class-final-grid">
        <div class="alba-winner-stage">
          <div class="alba-stage-caption"><span>${COPY.winnerStation}</span><span>${COPY.stationComplete}</span></div>
          <div id="albaClassWinnerStation"></div>
          <div class="alba-stage-intro"><div class="alba-stage-intro-card"><div class="cup">🏆</div><strong>${escapeHtml(winner.company || COPY.noCompany)}</strong><span>${COPY.missionComplete} · ${COPY.ten}</span></div></div>
        </div>
        <aside class="alba-final-ranking"><h2>${COPY.finalRanking}</h2><div class="alba-rank-list">${rankingRows(gs, false)}</div></aside>
      </div>
      <div class="alba-class-final-footer"><span class="alba-class-final-pill">🛰️ ${moduleCount(winner)}/10</span><span class="alba-class-final-pill">🎓 ${Number(winner.graduates || 0)}</span><span class="alba-class-final-pill">Q ${Number(gs.round || 0)}</span></div>
    </section>`;
    requestAnimationFrame(() => mountWinnerStation(gs, winner));
  }

  function renderTeacher(gs) {
    stopClassroomRenderer();
    const winner = winnerPlayer(gs);
    const ranked = rankedPlayers(gs);
    const lead = winner || ranked[0];
    const classroomHref = `./classroom.html?room=${encodeURIComponent(gs.roomId || (typeof roomId !== "undefined" ? roomId : ""))}`;
    app.innerHTML = `<div class="alba-teacher-final">
      <section class="card alba-teacher-hero">
        <div class="phase">${COPY.teacherFinal}</div>
        <h1>${winner ? `🏆 ${escapeHtml(winner.company || COPY.noCompany)}` : `🏁 ${COPY.sessionComplete}`}</h1>
        <div class="alba-teacher-win">${winner ? `${COPY.teacherVictory} · ${COPY.ten}` : COPY.teacherSession}</div>
        ${!winner && lead ? `<p class="muted">${COPY.leader}: <strong>${escapeHtml(lead.company || "—")}</strong></p>` : `<p class="muted">${COPY.firstComplete}</p>`}
        <div class="alba-teacher-stats"><div class="alba-teacher-stat"><span>${COPY.players}</span><strong>${(gs.players || []).length}</strong></div><div class="alba-teacher-stat"><span>${COPY.round}</span><strong>${Number(gs.round || 0)}</strong></div><div class="alba-teacher-stat"><span>${COPY.duration}</span><strong>${elapsed(gs.startedAt)}</strong></div></div>
        <a class="btn primary alba-open-classroom" href="${classroomHref}" target="_blank" rel="noopener">${COPY.openClassroom}</a>
        <div class="alba-teacher-hint">${COPY.classroomHint}</div>
      </section>
      <section class="card"><div class="phase">${COPY.results}</div><table class="table alba-teacher-table"><thead><tr><th>#</th><th>${COPY.company}</th><th>${COPY.station}</th><th>🎓 ${COPY.graduates}</th><th>${COPY.credits}</th></tr></thead><tbody>${rankingRows(gs, true)}</tbody></table></section>
    </div>`;
  }

  function process() {
    queued = false;
    if (rendering) return;
    const gs = gameState();
    if (!gs || gs.phase !== "ENDGAME") {
      lastKey = "";
      if (classroomRenderer) stopClassroomRenderer();
      return;
    }
    const key = keyFor(gs);
    if (key === lastKey && app?.dataset.albaEndgameSurface === key) return;
    rendering = true;
    lastKey = key;
    if (app) app.dataset.albaEndgameSurface = key;
    try {
      if (SURFACE === "classroom") renderClassroom(gs);
      else renderTeacher(gs);
    } finally {
      rendering = false;
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(process);
  }

  if (app) new MutationObserver(queue).observe(app, { childList: true, subtree: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) queue(); });
  window.addEventListener("beforeunload", stopClassroomRenderer, { once: true });
  queue();

  window.AlbaClassroomTeacherEndgame = { version: "20260910-classfinal1", refresh: queue, surface: SURFACE };
})();
