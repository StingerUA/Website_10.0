/* AlbaSpace Station Phase UX — structured Recruit/Build flow over the existing authoritative game state. */
(function () {
  if (window.AlbaStationPhaseUI) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: {
      title: "ФАЗА СТАНЦИИ",
      subtitle: "Выбери действие. Можно принять кадета, построить модуль или просто ждать следующий вопрос.",
      recruit: "Принять кадета",
      recruitShort: "RECRUIT",
      recruitHint: "Нажми на голубой голографический CrewSlot внутри станции, затем выбери специализацию.",
      recruitNoSeats: "Свободных мест нет. Сначала построй модуль или дождись выпуска кадета.",
      build: "Построить модуль",
      buildShort: "BUILD",
      buildHint: "Выбери SMALL или LARGE, затем укажи светящийся docking port прямо на станции.",
      buildDone: "Модуль уже построен в этом раунде",
      buildDoneHint: "Следующий модуль можно будет построить после следующего вопроса.",
      waiting: "Учитель запустит следующий вопрос",
      freeSeats: "Свободно мест",
      modules: "Модулей",
      round: "Раунд",
      back: "← Выбор действия",
      moduleSuccess: "Модуль пристыкован",
      moduleSuccessSub: "Станция стала больше. В этом раунде строительство завершено.",
      recruitSuccess: "Кадет принят",
      recruitSuccessSub: "Новое место в экипаже успешно занято.",
      nextQuestion: "НОВЫЙ ВОПРОС",
      nextQuestionSub: "Возвращаемся к учебной миссии",
      builtBadge: "✓ построено",
      availableBadge: "доступно",
      noSeatsBadge: "нет мест",
      overview: "Действия станции"
    },
    tr: {
      title: "İSTASYON AŞAMASI",
      subtitle: "Bir işlem seç. Öğrenci kabul edebilir, modül inşa edebilir veya sonraki soruyu bekleyebilirsin.",
      recruit: "Öğrenci kabul et",
      recruitShort: "RECRUIT",
      recruitHint: "İstasyondaki mavi holografik CrewSlot'a tıkla, sonra uzmanlığı seç.",
      recruitNoSeats: "Boş yer yok. Önce modül inşa et veya bir öğrencinin mezun olmasını bekle.",
      build: "Modül inşa et",
      buildShort: "BUILD",
      buildHint: "SMALL veya LARGE seç, ardından istasyondaki parlayan docking portu belirle.",
      buildDone: "Bu turda modül zaten inşa edildi",
      buildDoneHint: "Bir sonraki modül, sonraki sorudan sonra inşa edilebilir.",
      waiting: "Öğretmen sonraki soruyu başlatacak",
      freeSeats: "Boş yer",
      modules: "Modül",
      round: "Tur",
      back: "← İşlem seçimine dön",
      moduleSuccess: "Modül kenetlendi",
      moduleSuccessSub: "İstasyon büyüdü. Bu turdaki inşa hakkın kullanıldı.",
      recruitSuccess: "Öğrenci kabul edildi",
      recruitSuccessSub: "Mürettebattaki boş yer başarıyla dolduruldu.",
      nextQuestion: "YENİ SORU",
      nextQuestionSub: "Eğitim görevine dönüyoruz",
      builtBadge: "✓ inşa edildi",
      availableBadge: "kullanılabilir",
      noSeatsBadge: "yer yok",
      overview: "İstasyon işlemleri"
    },
    en: {
      title: "STATION PHASE",
      subtitle: "Choose an action. Recruit a cadet, build a module, or simply wait for the next question.",
      recruit: "Recruit a cadet",
      recruitShort: "RECRUIT",
      recruitHint: "Click a blue holographic CrewSlot inside the station, then choose a specialization.",
      recruitNoSeats: "No free places. Build a module first or wait for a cadet to graduate.",
      build: "Build a module",
      buildShort: "BUILD",
      buildHint: "Choose SMALL or LARGE, then select a glowing docking port directly on the station.",
      buildDone: "A module has already been built this round",
      buildDoneHint: "You can build the next module after the next question.",
      waiting: "The teacher will start the next question",
      freeSeats: "Free places",
      modules: "Modules",
      round: "Round",
      back: "← Choose another action",
      moduleSuccess: "Module docked",
      moduleSuccessSub: "Your station is larger. Building is complete for this round.",
      recruitSuccess: "Cadet recruited",
      recruitSuccessSub: "A free crew place has been filled successfully.",
      nextQuestion: "NEW QUESTION",
      nextQuestionSub: "Returning to the learning mission",
      builtBadge: "✓ built",
      availableBadge: "available",
      noSeatsBadge: "no places",
      overview: "Station actions"
    }
  }[LOCALE];

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  let selectedMode = "overview";
  let selectedRound = null;
  let lastPhase = null;
  let lastRound = null;
  let lastModuleCount = null;
  let lastActiveCadets = null;
  let mutationQueued = false;
  let slotPulseScene = null;
  let slotPulseObserver = null;

  const style = document.createElement("style");
  style.id = "alba-station-phase-ui-style";
  style.textContent = `
    .station-controls[data-station-phase-ui="1"]{position:relative;overflow:visible}
    .station-phase-hub{margin:10px 0 14px;padding:14px;border-radius:16px;border:1px solid rgba(104,226,255,.22);background:linear-gradient(180deg,rgba(8,24,40,.82),rgba(4,14,26,.78));box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
    .station-phase-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .station-phase-kicker{font-size:.74rem;letter-spacing:.16em;color:#85ecff;font-weight:800}
    .station-phase-head strong{display:block;margin-top:4px;font-size:1rem}
    .station-phase-stats{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
    .station-phase-stat{padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);font-size:.74rem;white-space:nowrap}
    .station-phase-subtitle{margin:10px 0 12px;color:var(--muted,#9db1c1);font-size:.86rem;line-height:1.45}
    .station-action-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .station-action-switch button{position:relative;min-height:72px;padding:11px;border-radius:13px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);color:inherit;text-align:left;cursor:pointer;transition:border-color .18s ease,background .18s ease,transform .18s ease}
    .station-action-switch button:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(112,230,255,.35);background:rgba(112,230,255,.06)}
    .station-action-switch button.active{border-color:rgba(112,230,255,.52);background:linear-gradient(180deg,rgba(88,218,244,.12),rgba(88,218,244,.055));box-shadow:inset 0 0 0 1px rgba(88,218,244,.06)}
    .station-action-switch button:disabled{opacity:.56;cursor:not-allowed;transform:none}
    .station-action-icon{font-size:1.2rem;display:block;margin-bottom:4px}.station-action-name{font-weight:800}.station-action-meta{display:block;margin-top:3px;font-size:.72rem;color:var(--muted,#9db1c1)}
    .station-action-badge{position:absolute;right:8px;top:8px;padding:3px 6px;border-radius:999px;font-size:.64rem;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.22)}
    .station-action-section{margin-top:10px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.075);background:rgba(255,255,255,.025)}
    .station-controls[data-station-action="overview"] .station-action-section{display:none}
    .station-controls[data-station-action="recruit"] .station-action-section[data-station-section="build"]{display:none}
    .station-controls[data-station-action="build"] .station-action-section[data-station-section="recruit"]{display:none}
    .station-action-callout{margin:0 0 10px;padding:10px 11px;border-radius:11px;background:rgba(104,226,255,.055);border:1px solid rgba(104,226,255,.12);font-size:.84rem;line-height:1.45}
    .station-action-back{display:inline-flex;margin-bottom:9px;padding:0;border:0;background:transparent;color:#8defff;cursor:pointer;font:inherit;font-size:.78rem}
    .station-build-locked{margin:9px 0 0;padding:10px 11px;border-radius:11px;border:1px solid rgba(113,224,161,.22);background:rgba(113,224,161,.07);font-size:.82rem;line-height:1.4}
    .station-build-locked strong{color:#8ef0b7}
    .station-wait-note{margin-top:10px;text-align:center;font-size:.76rem;color:var(--muted,#9db1c1)}
    .station-action-flash{position:absolute;left:50%;top:50%;z-index:30;transform:translate(-50%,-50%);width:min(360px,calc(100% - 32px));padding:18px;border-radius:18px;border:1px solid rgba(126,237,255,.34);background:rgba(4,16,29,.94);box-shadow:0 24px 65px rgba(0,0,0,.48),0 0 42px rgba(91,225,245,.09);backdrop-filter:blur(12px);text-align:center;pointer-events:none;animation:albaActionFlash 1.55s ease both}
    .station-action-flash .icon{font-size:2rem}.station-action-flash strong{display:block;margin-top:5px;font-size:1.08rem}.station-action-flash span{display:block;margin-top:5px;color:var(--muted,#a5b9c7);font-size:.82rem;line-height:1.4}
    .station-next-question-transition{position:absolute;inset:0;z-index:28;display:grid;place-items:center;border-radius:inherit;background:radial-gradient(circle at 50% 48%,rgba(19,70,93,.68),rgba(2,8,17,.93) 68%);backdrop-filter:blur(4px);pointer-events:none;animation:albaQuestionTransition 1.15s ease both}
    .station-next-question-transition>div{text-align:center;padding:20px}.station-next-question-transition .q-icon{font-size:2.1rem}.station-next-question-transition strong{display:block;margin-top:7px;letter-spacing:.13em;color:#9af2ff}.station-next-question-transition span{display:block;margin-top:6px;color:#c0d1dc;font-size:.84rem}
    .station-next-question-transition i{display:block;width:150px;height:2px;margin:14px auto 0;border-radius:999px;background:linear-gradient(90deg,transparent,#80efff,transparent);animation:albaQuestionLine .9s ease both}
    .station-viewport[data-station-action="recruit"]{box-shadow:inset 0 0 0 1px rgba(112,232,255,.2),0 0 34px rgba(112,232,255,.055)}
    .station-viewport[data-station-action="build"]{box-shadow:inset 0 0 0 1px rgba(255,209,102,.16),0 0 34px rgba(255,209,102,.04)}
    @keyframes albaActionFlash{0%{opacity:0;transform:translate(-50%,-46%) scale(.96)}14%,75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-54%) scale(.985)}}
    @keyframes albaQuestionTransition{0%{opacity:0}16%,74%{opacity:1}100%{opacity:0}}
    @keyframes albaQuestionLine{0%{transform:scaleX(0);opacity:0}35%{opacity:1}100%{transform:scaleX(1);opacity:.35}}
    @media (max-width:780px){.station-phase-head{display:block}.station-phase-stats{justify-content:flex-start;margin-top:8px}.station-action-switch{grid-template-columns:1fr}.station-action-switch button{min-height:62px}}
    @media (prefers-reduced-motion:reduce){.station-action-switch button{transition:none}.station-action-flash,.station-next-question-transition,.station-next-question-transition i{animation:none!important}}
  `;
  document.head.appendChild(style);

  function currentState() {
    try { return typeof state !== "undefined" ? state : null; } catch { return null; }
  }
  function currentPlayer() {
    try { return typeof me === "function" ? me() : null; } catch { return null; }
  }
  function currentRenderer() {
    try { return typeof stationRenderer !== "undefined" ? stationRenderer : null; } catch { return null; }
  }
  function freeSeats(player) {
    try { return AlbaSpace.freeSeats(player); } catch {
      const active = (player?.cadets || []).filter(cadet => cadet.status === "ACTIVE").length;
      return Math.max(0, Number(player?.seatCapacity || 0) - active);
    }
  }
  function moduleCount(player) { return Number(player?.small || 0) + Number(player?.large || 0); }
  function activeCadetCount(player) { return (player?.cadets || []).filter(cadet => cadet.status === "ACTIVE").length; }
  function moduleBuiltThisRound(gameState, player) {
    return Number(gameState?.round || 0) > 0 && Number(player?.moduleBoughtRound || 0) === Number(gameState.round);
  }

  function stopSlotPulse() {
    if (slotPulseScene && slotPulseObserver) {
      try { slotPulseScene.onBeforeRenderObservable.remove(slotPulseObserver); } catch {}
    }
    if (slotPulseScene) {
      slotPulseScene.meshes.filter(mesh => mesh?.metadata?.kind === "crew-slot").forEach(mesh => {
        const base = mesh.metadata?.__stationPhaseBase;
        if (!base || mesh.isDisposed?.()) return;
        mesh.scaling.copyFrom(base.scaling);
        if (mesh.material) mesh.material.alpha = base.alpha;
        delete mesh.metadata.__stationPhaseBase;
      });
    }
    slotPulseScene = null;
    slotPulseObserver = null;
  }

  function startSlotPulse() {
    stopSlotPulse();
    const renderer = currentRenderer();
    const scene = renderer?.scene;
    if (!scene || selectedMode !== "recruit") return;
    const slots = scene.meshes.filter(mesh => mesh?.metadata?.kind === "crew-slot" && !mesh.isDisposed?.());
    slots.forEach(mesh => {
      mesh.metadata.__stationPhaseBase = { scaling: mesh.scaling.clone(), alpha: Number(mesh.material?.alpha ?? 0.2) };
      if (prefersReducedMotion) {
        mesh.scaling.scaleInPlace(1.1);
        if (mesh.material) mesh.material.alpha = Math.max(mesh.material.alpha || 0, 0.42);
      }
    });
    if (prefersReducedMotion || !slots.length) return;
    slotPulseScene = scene;
    slotPulseObserver = scene.onBeforeRenderObservable.add(() => {
      const time = performance.now() * 0.0022;
      slots.forEach((mesh, index) => {
        if (mesh.isDisposed?.()) return;
        const base = mesh.metadata?.__stationPhaseBase;
        if (!base) return;
        const wave = (Math.sin(time + index * 0.72) + 1) * 0.5;
        const scale = 1.04 + wave * 0.12;
        mesh.scaling.set(base.scaling.x * scale, base.scaling.y * scale, base.scaling.z * scale);
        if (mesh.material) mesh.material.alpha = Math.max(base.alpha, 0.28 + wave * 0.25);
      });
    });
  }

  function setViewportMode(mode) {
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.stationAction = mode || "overview";
    if (mode === "recruit") startSlotPulse();
    else stopSlotPulse();
  }

  function selectAction(mode, options = {}) {
    const gameState = currentState();
    const player = currentPlayer();
    if (!gameState || gameState.phase !== "STATION" || !player) return;
    if (!['overview','recruit','build'].includes(mode)) mode = 'overview';
    if (mode === "build" && moduleBuiltThisRound(gameState, player)) mode = "overview";
    if (mode === "recruit" && freeSeats(player) <= 0) mode = "overview";

    if (!options.passive) {
      if (mode !== "build" && window.AlbaStationBuildMode?.activeType) window.AlbaStationBuildMode.cancel?.(true);
      if (mode !== "recruit" && window.AlbaCrewSlotMode?.isActive?.()) window.AlbaCrewSlotMode.cancel?.();
      try { window.AlbaCadetInspectMode?.close?.(true); } catch {}
    }

    selectedMode = mode;
    selectedRound = Number(gameState.round || 0);
    const controls = document.querySelector(".station-controls");
    if (controls) {
      controls.dataset.stationAction = selectedMode;
      controls.querySelectorAll("[data-station-action-switch]").forEach(button => button.classList.toggle("active", button.dataset.stationActionSwitch === selectedMode));
    }
    setViewportMode(selectedMode);
  }

  function wrapSections(controls) {
    if (controls.querySelector('[data-station-section="build"]')) return;
    const directHeadings = [...controls.children].filter(node => node.tagName === "H2");
    if (directHeadings.length < 2) return;
    const buildHeading = directHeadings[0];
    const recruitHeading = directHeadings[directHeadings.length - 1];

    const buildNodes = [buildHeading];
    let cursor = buildHeading.nextElementSibling;
    while (cursor && cursor !== recruitHeading && !cursor.classList.contains("sep")) {
      const next = cursor.nextElementSibling;
      if (!cursor.id || !["drawer","albaBuildPanel","albaCrewSlotPanel"].includes(cursor.id)) buildNodes.push(cursor);
      cursor = next;
    }

    const recruitNodes = [];
    const separator = recruitHeading.previousElementSibling;
    if (separator?.classList.contains("sep")) recruitNodes.push(separator);
    recruitNodes.push(recruitHeading);
    cursor = recruitHeading.nextElementSibling;
    while (cursor) {
      const next = cursor.nextElementSibling;
      if (cursor.id === "albaBuildPanel" || cursor.id === "albaCrewSlotPanel") break;
      recruitNodes.push(cursor);
      cursor = next;
    }

    const buildWrap = document.createElement("div");
    buildWrap.className = "station-action-section";
    buildWrap.dataset.stationSection = "build";
    buildHeading.before(buildWrap);
    buildNodes.forEach(node => buildWrap.appendChild(node));
    const buildCallout = document.createElement("div");
    buildCallout.className = "station-action-callout";
    buildCallout.innerHTML = `🛠 ${COPY.buildHint}`;
    buildWrap.prepend(buildCallout);
    const buildBack = document.createElement("button");
    buildBack.type = "button"; buildBack.className = "station-action-back"; buildBack.textContent = COPY.back; buildBack.dataset.stationBack = "1";
    buildWrap.prepend(buildBack);

    const recruitWrap = document.createElement("div");
    recruitWrap.className = "station-action-section";
    recruitWrap.dataset.stationSection = "recruit";
    const firstRecruit = recruitNodes[0] || recruitHeading;
    firstRecruit.before(recruitWrap);
    recruitNodes.forEach(node => recruitWrap.appendChild(node));
    const recruitCallout = document.createElement("div");
    recruitCallout.className = "station-action-callout";
    recruitCallout.innerHTML = `👨‍🚀 ${freeSeats(currentPlayer()) > 0 ? COPY.recruitHint : COPY.recruitNoSeats}`;
    recruitWrap.prepend(recruitCallout);
    const recruitBack = document.createElement("button");
    recruitBack.type = "button"; recruitBack.className = "station-action-back"; recruitBack.textContent = COPY.back; recruitBack.dataset.stationBack = "1";
    recruitWrap.prepend(recruitBack);
  }

  function buildHub(controls, gameState, player) {
    controls.querySelector(".station-phase-hub")?.remove();
    const free = freeSeats(player);
    const modules = moduleCount(player);
    const built = moduleBuiltThisRound(gameState, player);
    const hub = document.createElement("div");
    hub.className = "station-phase-hub";
    hub.innerHTML = `
      <div class="station-phase-head">
        <div><span class="station-phase-kicker">${COPY.title}</span><strong>${COPY.overview}</strong></div>
        <div class="station-phase-stats"><span class="station-phase-stat">${COPY.round} ${Number(gameState.round || 0)}</span><span class="station-phase-stat">${COPY.modules} ${modules}/10</span><span class="station-phase-stat">${COPY.freeSeats} ${free}</span></div>
      </div>
      <p class="station-phase-subtitle">${COPY.subtitle}</p>
      <div class="station-action-switch">
        <button type="button" data-station-action-switch="recruit" ${free <= 0 ? "disabled" : ""}>
          <span class="station-action-badge">${free > 0 ? COPY.availableBadge : COPY.noSeatsBadge}</span>
          <span class="station-action-icon">👨‍🚀</span><span class="station-action-name">${COPY.recruit}</span><span class="station-action-meta">${COPY.recruitShort} · ${COPY.freeSeats}: ${free}</span>
        </button>
        <button type="button" data-station-action-switch="build" ${built ? "disabled" : ""}>
          <span class="station-action-badge">${built ? COPY.builtBadge : COPY.availableBadge}</span>
          <span class="station-action-icon">🛠</span><span class="station-action-name">${COPY.build}</span><span class="station-action-meta">${COPY.buildShort} · SMALL / LARGE</span>
        </button>
      </div>
      <div class="station-wait-note">◌ ${COPY.waiting}</div>`;
    const drawer = controls.querySelector("#drawer");
    if (drawer) drawer.after(hub);
    else controls.querySelector(".control-tabs")?.after(hub);
    hub.querySelectorAll("[data-station-action-switch]").forEach(button => button.addEventListener("click", () => selectAction(button.dataset.stationActionSwitch)));
  }

  function lockBuildControls(controls, gameState, player) {
    const build = controls.querySelector('[data-station-section="build"]');
    if (!build) return;
    build.querySelector(".station-build-locked")?.remove();
    const locked = moduleBuiltThisRound(gameState, player);
    build.querySelectorAll("#small,#large").forEach(button => {
      if (locked) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      }
    });
    if (locked) {
      const note = document.createElement("div");
      note.className = "station-build-locked";
      note.innerHTML = `<strong>✓ ${COPY.buildDone}</strong><br><span>${COPY.buildDoneHint}</span>`;
      build.appendChild(note);
    }
  }

  function decorateStationControls() {
    const gameState = currentState();
    const player = currentPlayer();
    const controls = document.querySelector(".station-controls");
    if (!gameState || gameState.phase !== "STATION" || !player || !controls) return;
    if (controls.dataset.stationPhaseUi === "1") {
      if (document.getElementById("albaBuildPanel")) selectAction("build", { passive: true });
      else if (document.getElementById("albaCrewSlotPanel")) selectAction("recruit", { passive: true });
      return;
    }

    controls.dataset.stationPhaseUi = "1";
    wrapSections(controls);
    buildHub(controls, gameState, player);
    lockBuildControls(controls, gameState, player);
    controls.querySelectorAll("[data-station-back]").forEach(button => button.addEventListener("click", () => selectAction("overview")));

    if (selectedRound !== Number(gameState.round || 0)) {
      selectedRound = Number(gameState.round || 0);
      selectedMode = "overview";
    }
    if (moduleBuiltThisRound(gameState, player) && selectedMode === "build") selectedMode = "overview";
    if (freeSeats(player) <= 0 && selectedMode === "recruit") selectedMode = "overview";
    selectAction(selectedMode, { passive: true });
  }

  function flashAction(type) {
    const stage = document.querySelector(".station-stage");
    if (!stage) return;
    stage.querySelector(".station-action-flash")?.remove();
    const flash = document.createElement("div");
    flash.className = "station-action-flash";
    if (type === "module") flash.innerHTML = `<div class="icon">🛰️</div><strong>${COPY.moduleSuccess}</strong><span>${COPY.moduleSuccessSub}</span>`;
    else flash.innerHTML = `<div class="icon">👨‍🚀</div><strong>${COPY.recruitSuccess}</strong><span>${COPY.recruitSuccessSub}</span>`;
    stage.appendChild(flash);
    setTimeout(() => flash.remove(), prefersReducedMotion ? 850 : 1650);
  }

  function showNextQuestionTransition() {
    const stage = document.querySelector(".station-stage");
    if (!stage || stage.querySelector(".station-next-question-transition")) return;
    const overlay = document.createElement("div");
    overlay.className = "station-next-question-transition";
    overlay.innerHTML = `<div><div class="q-icon">✦</div><strong>${COPY.nextQuestion}</strong><span>${COPY.nextQuestionSub}</span><i></i></div>`;
    stage.appendChild(overlay);
    setTimeout(() => overlay.remove(), prefersReducedMotion ? 650 : 1200);
  }

  function detectStateChanges() {
    const gameState = currentState();
    const player = currentPlayer();
    if (!gameState || !player) return;
    const phase = String(gameState.phase || "");
    const round = Number(gameState.round || 0);
    const modules = moduleCount(player);
    const active = activeCadetCount(player);

    if (lastPhase === "STATION" && phase === "QUESTION") setTimeout(showNextQuestionTransition, 0);

    if (phase === "STATION") {
      if (lastRound === round) {
        if (lastModuleCount !== null && modules > lastModuleCount) setTimeout(() => flashAction("module"), 40);
        if (lastActiveCadets !== null && active > lastActiveCadets) setTimeout(() => flashAction("recruit"), 40);
      }
      lastRound = round;
      lastModuleCount = modules;
      lastActiveCadets = active;
    } else if (phase !== "RESULT") {
      lastModuleCount = modules;
      lastActiveCadets = active;
    }

    if (lastPhase !== phase) {
      if (phase !== "STATION") stopSlotPulse();
      lastPhase = phase;
    }
  }

  function processUi() {
    mutationQueued = false;
    detectStateChanges();
    decorateStationControls();
  }

  function queueUi() {
    if (mutationQueued) return;
    mutationQueued = true;
    requestAnimationFrame(processUi);
  }

  const app = document.getElementById("app");
  if (app) {
    const observer = new MutationObserver(queueUi);
    observer.observe(app, { childList: true, subtree: true });
  }
  document.addEventListener("click", event => {
    if (event.target.closest?.("#small,#large")) {
      const gameState = currentState();
      if (gameState?.phase === "STATION") selectAction("build", { passive: true });
    }
  }, true);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) queueUi(); });
  queueUi();

  window.AlbaStationPhaseUI = {
    version: "20260909-stationphase1",
    selectAction,
    refresh: queueUi,
    get mode() { return selectedMode; }
  };
})();
