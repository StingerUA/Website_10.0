/* AlbaSpace Cadet Inspect — 3D cadet click, camera focus, detail card and Crew drawer sync. */
(function () {
  if (!window.AlbaStation3D || window.AlbaCadetInspectMode) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: {
      cadet: "Кадет", specialty: "Специализация", rank: "Ранг", progress: "Прогресс", module: "Модуль",
      close: "Закрыть", novice: "Новичок", explorer: "Исследователь", specialist: "Специалист", expert: "Эксперт", master: "Космический мастер"
    },
    tr: {
      cadet: "Öğrenci", specialty: "Uzmanlık", rank: "Seviye", progress: "İlerleme", module: "Modül",
      close: "Kapat", novice: "Başlangıç", explorer: "Araştırmacı", specialist: "Uzman", expert: "İleri uzman", master: "Uzay ustası"
    },
    en: {
      cadet: "Cadet", specialty: "Specialization", rank: "Rank", progress: "Progress", module: "Module",
      close: "Close", novice: "Novice", explorer: "Explorer", specialist: "Specialist", expert: "Expert", master: "Space master"
    }
  }[LOCALE];

  const TOPIC_COLORS = {
    PLANETS: "#b58cff",
    SATELLITES: "#66b7ff",
    TELESCOPES: "#71e0a1",
    ROVERS: "#ffad66",
    TURKISH_SATELLITES: "#ffd166"
  };
  const TOPIC_ICONS = {
    PLANETS: "🪐",
    SATELLITES: "🛰️",
    TELESCOPES: "🔭",
    ROVERS: "🛞",
    TURKISH_SATELLITES: "🇹🇷"
  };
  const MODULE_COPY = {
    ru: { COMMAND: "Командный модуль", SCIENCE: "Научный модуль", OPERATIONS: "Операционный модуль", SMALL: "Малый модуль" },
    tr: { COMMAND: "Komuta modülü", SCIENCE: "Bilim modülü", OPERATIONS: "Operasyon modülü", SMALL: "Küçük modül" },
    en: { COMMAND: "Command module", SCIENCE: "Science module", OPERATIONS: "Operations module", SMALL: "Small module" }
  }[LOCALE];

  let activeCadetId = null;
  let renderer = null;
  let savedView = null;
  let tweenToken = 0;
  let highlightLayer = null;
  let highlightedMeshes = [];

  const style = document.createElement("style");
  style.textContent = `
    .station-stage{position:relative}
    #albaCadetCard{position:absolute;top:76px;right:16px;z-index:9;width:min(300px,calc(100% - 32px));padding:14px;border-radius:16px;border:1px solid rgba(112,231,255,.28);background:linear-gradient(180deg,rgba(6,20,35,.97),rgba(3,12,23,.96));box-shadow:0 18px 44px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(10px)}
    #albaCadetCard .cadet-card-head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
    #albaCadetCard .cadet-name{font-size:1.08rem;font-weight:800;letter-spacing:.02em}
    #albaCadetCard .cadet-topic{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--muted,#9db1c1);font-size:.9rem}
    #albaCadetCard .cadet-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    #albaCadetCard .cadet-cell{padding:9px 10px;border-radius:11px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);min-width:0}
    #albaCadetCard .cadet-cell small{display:block;color:var(--muted,#9db1c1);margin-bottom:3px}
    #albaCadetCard .cadet-progress{display:flex;gap:5px;margin-top:7px}
    #albaCadetCard .cadet-progress i{display:block;width:23px;height:6px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.08)}
    #albaCadetCard .cadet-progress i.on{background:var(--cadet-accent,#72e8ff);box-shadow:0 0 10px color-mix(in srgb,var(--cadet-accent,#72e8ff) 65%,transparent)}
    #albaCadetCard .cadet-close{min-width:34px;padding:6px 9px}
    .drawer-row.cadet-row-focused{border-color:rgba(114,232,255,.5)!important;background:rgba(114,232,255,.09)!important;box-shadow:inset 3px 0 0 rgba(114,232,255,.85)}
    .station-viewport[data-cadet-focus="1"]{box-shadow:inset 0 0 0 1px rgba(114,232,255,.18),0 0 28px rgba(114,232,255,.05)}
    @media (max-width:780px){#albaCadetCard{top:68px;right:10px;width:min(280px,calc(100% - 20px))}}
  `;
  document.head.appendChild(style);

  function currentPlayer() {
    try { return typeof me === "function" ? me() : null; } catch { return null; }
  }
  function currentRenderer() {
    try { return stationRenderer || renderer || null; } catch { return renderer || null; }
  }
  function cadetById(id) {
    return (currentPlayer()?.cadets || []).find(cadet => cadet.id === id && cadet.status === "ACTIVE") || null;
  }
  function moduleById(id) {
    return (currentPlayer()?.modules || []).find(module => module.id === id) || null;
  }
  function topicLabel(cadet) {
    try { return AlbaSpace.TOPICS[cadet.topic]?.label || cadet.topic || COPY.cadet; } catch { return cadet.topic || COPY.cadet; }
  }
  function rankLabel(value) {
    const knowledge = Math.max(0, Math.min(4, Number(value || 0)));
    return [COPY.novice, COPY.explorer, COPY.specialist, COPY.expert, COPY.master][knowledge];
  }
  function moduleLabel(cadet) {
    const module = moduleById(cadet.moduleId);
    if (!module) return "—";
    if (module.type === "LARGE") return MODULE_COPY[module.role] || module.role || MODULE_COPY.COMMAND;
    return MODULE_COPY.SMALL;
  }
  function esc(value) {
    try { return AlbaGame.esc(String(value ?? "")); } catch { return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])); }
  }

  function captureView(targetRenderer) {
    return targetRenderer?.captureView?.() || null;
  }
  function tweenCamera(targetRenderer, destination, duration = 620) {
    if (!targetRenderer?.camera || !destination) return;
    const token = ++tweenToken;
    const camera = targetRenderer.camera;
    const start = captureView(targetRenderer);
    if (!start) return;
    const started = performance.now();
    const smooth = t => t * t * (3 - 2 * t);
    const frame = now => {
      if (token !== tweenToken || !targetRenderer.camera) return;
      const rawT = Math.min(1, (now - started) / duration);
      const t = smooth(rawT);
      camera.alpha = start.alpha + (destination.alpha - start.alpha) * t;
      camera.beta = start.beta + (destination.beta - start.beta) * t;
      camera.radius = start.radius + (destination.radius - start.radius) * t;
      camera.setTarget(new BABYLON.Vector3(
        start.target.x + (destination.target.x - start.target.x) * t,
        start.target.y + (destination.target.y - start.target.y) * t,
        start.target.z + (destination.target.z - start.target.z) * t
      ));
      if (rawT < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function removeHighlight() {
    if (highlightLayer) {
      for (const mesh of highlightedMeshes) {
        try { highlightLayer.removeMesh(mesh); } catch {}
      }
    }
    highlightedMeshes = [];
  }
  function ensureHighlight(targetRenderer) {
    if (!targetRenderer?.scene) return null;
    if (!highlightLayer || highlightLayer._scene !== targetRenderer.scene) {
      try { highlightLayer?.dispose(); } catch {}
      highlightLayer = new BABYLON.HighlightLayer("AlbaCadetInspectHighlight", targetRenderer.scene, { blurHorizontalSize: 1.1, blurVerticalSize: 1.1 });
      highlightLayer.innerGlow = false;
      highlightLayer.outerGlow = true;
    }
    return highlightLayer;
  }
  function highlightCadet(targetRenderer, cadet) {
    removeHighlight();
    const root = targetRenderer?.scene?.getTransformNodeByName(`Cadet_${cadet.id}`);
    if (!root) return null;
    const layer = ensureHighlight(targetRenderer);
    const color = BABYLON.Color3.FromHexString(TOPIC_COLORS[cadet.topic] || "#72e8ff");
    highlightedMeshes = root.getChildMeshes().filter(mesh => !String(mesh.name || "").startsWith("Label"));
    highlightedMeshes.forEach(mesh => { try { layer?.addMesh(mesh, color); } catch {} });
    return root;
  }

  function focusCadet(targetRenderer, cadet, animate = true) {
    const root = highlightCadet(targetRenderer, cadet);
    if (!root || !targetRenderer?.camera) return;
    if (!savedView) savedView = captureView(targetRenderer);
    const absolute = root.getAbsolutePosition ? root.getAbsolutePosition() : root.position;
    const destination = {
      alpha: targetRenderer.camera.alpha,
      beta: 0.94,
      radius: Math.max(6.2, Math.min(7.8, targetRenderer.camera.radius * 0.55)),
      target: { x: absolute.x, y: absolute.y + 0.12, z: absolute.z }
    };
    if (animate) tweenCamera(targetRenderer, destination, 620);
    else {
      targetRenderer.camera.setTarget(new BABYLON.Vector3(destination.target.x, destination.target.y, destination.target.z));
      targetRenderer.camera.radius = destination.radius;
    }
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.cadetFocus = "1";
  }

  function renderCard(cadet) {
    document.getElementById("albaCadetCard")?.remove();
    const stage = document.querySelector(".station-stage");
    if (!stage || !cadet) return;
    const knowledge = Math.max(0, Math.min(4, Number(cadet.knowledge || 0)));
    const accent = TOPIC_COLORS[cadet.topic] || "#72e8ff";
    const icon = TOPIC_ICONS[cadet.topic] || "👨‍🚀";
    const progress = Array.from({ length: 4 }, (_, index) => `<i class="${index < knowledge ? "on" : ""}"></i>`).join("");
    const card = document.createElement("div");
    card.id = "albaCadetCard";
    card.style.setProperty("--cadet-accent", accent);
    card.innerHTML = `
      <div class="cadet-card-head">
        <div><div class="cadet-name">${esc(cadet.name || COPY.cadet)}</div><div class="cadet-topic">${icon} ${esc(topicLabel(cadet))}</div></div>
        <button class="btn ghost compact cadet-close" type="button" aria-label="${COPY.close}" data-cadet-close>×</button>
      </div>
      <div class="cadet-grid">
        <div class="cadet-cell"><small>${COPY.rank}</small><strong>${esc(rankLabel(knowledge))}</strong></div>
        <div class="cadet-cell"><small>${COPY.module}</small><strong>${esc(moduleLabel(cadet))}</strong></div>
      </div>
      <div class="cadet-cell" style="margin-top:8px"><small>${COPY.progress}</small><strong>${knowledge}/4</strong><div class="cadet-progress">${progress}</div></div>`;
    stage.appendChild(card);
    card.querySelector("[data-cadet-close]")?.addEventListener("click", () => close(true));
  }

  function syncDrawer() {
    document.querySelectorAll("[data-cadet]").forEach(row => row.classList.toggle("cadet-row-focused", !!activeCadetId && row.dataset.cadet === activeCadetId));
  }

  function openCadet(cadetOrId, targetRenderer = null, options = {}) {
    const cadet = typeof cadetOrId === "string" ? cadetById(cadetOrId) : cadetOrId;
    if (!cadet || cadet.status !== "ACTIVE") return;
    if (window.AlbaStationBuildMode?.activeType) window.AlbaStationBuildMode.cancel?.(true);
    if (window.AlbaCrewSlotMode?.isActive?.()) window.AlbaCrewSlotMode.cancel?.();
    renderer = targetRenderer || currentRenderer();
    if (!renderer?.scene) return;
    activeCadetId = cadet.id;
    focusCadet(renderer, cadet, options.animate !== false);
    renderCard(cadet);
    syncDrawer();
  }

  function close(restore = true) {
    const targetRenderer = currentRenderer();
    activeCadetId = null;
    document.getElementById("albaCadetCard")?.remove();
    removeHighlight();
    document.querySelectorAll("[data-cadet]").forEach(row => row.classList.remove("cadet-row-focused"));
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.cadetFocus = "0";
    if (restore && savedView && targetRenderer?.camera) {
      const view = savedView;
      savedView = null;
      tweenCamera(targetRenderer, view, 620);
    } else savedView = null;
  }

  function rebindActive(targetRenderer) {
    if (!activeCadetId) return;
    const cadet = cadetById(activeCadetId);
    if (!cadet) {
      close(false);
      return;
    }
    renderer = targetRenderer;
    highlightCadet(targetRenderer, cadet);
    renderCard(cadet);
    syncDrawer();
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaCadetInspectPatched) {
    const originalCadet = proto.buildCadet;
    proto.buildCadet = function (module, local, cadet, slotId) {
      const result = originalCadet.call(this, module, local, cadet, slotId);
      const root = this.scene?.getTransformNodeByName(`Cadet_${cadet.id}`);
      root?.getChildMeshes().forEach(mesh => {
        if (String(mesh.name || "").startsWith("Label")) return;
        mesh.actionManager = new BABYLON.ActionManager(this.scene);
        mesh.actionManager.hoverCursor = "pointer";
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => openCadet(cadet, this)));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          if (!activeCadetId || activeCadetId !== cadet.id) mesh.scaling.scaleInPlace(1.04);
        }));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          if (!activeCadetId || activeCadetId !== cadet.id) mesh.scaling.scaleInPlace(1 / 1.04);
        }));
      });
      return result;
    };

    const originalUpdate = proto.update;
    proto.update = function (nextState, nextPlayer) {
      originalUpdate.call(this, nextState, nextPlayer);
      rebindActive(this);
    };
    proto.__albaCadetInspectPatched = true;
  }

  document.addEventListener("click", event => {
    const row = event.target.closest?.("[data-cadet]");
    if (row?.dataset.cadet) {
      event.preventDefault();
      const drawer = document.getElementById("drawer");
      drawer?.classList.add("hidden");
      openCadet(row.dataset.cadet, currentRenderer());
      return;
    }
    if (event.target.closest?.("[data-drawer]")) setTimeout(syncDrawer, 0);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeCadetId) close(true);
  });

  window.AlbaCadetInspectMode = {
    open: (cadetOrId, targetRenderer) => openCadet(cadetOrId, targetRenderer || currentRenderer()),
    close: () => close(true),
    syncDrawer,
    isActive: () => !!activeCadetId,
    get activeCadetId() { return activeCadetId; }
  };
})();
