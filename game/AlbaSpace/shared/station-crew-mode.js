/* AlbaSpace Crew Slot Interaction — click a holographic CrewSlot and recruit into that exact place. */
(function () {
  if (!window.AlbaStation3D || window.AlbaCrewSlotMode) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: {
      title: "Принять кадета",
      choose: "Выбери специализацию для этого свободного места.",
      module: "Модуль",
      slot: "Место",
      cancel: "Отмена",
      recruiting: "Принимаем кадета…",
      unavailable: "Кадета можно принять только в фазе станции.",
      occupied: "Это место уже занято.",
      hint: "Нажми на голубой силуэт внутри станции, чтобы принять кадета именно в это место.",
      born: "Новый кадет прибыл на станцию"
    },
    tr: {
      title: "Öğrenci kabul et",
      choose: "Bu boş yer için uzmanlık seç.",
      module: "Modül",
      slot: "Yer",
      cancel: "İptal",
      recruiting: "Öğrenci kabul ediliyor…",
      unavailable: "Öğrenci yalnızca istasyon aşamasında kabul edilebilir.",
      occupied: "Bu yer artık dolu.",
      hint: "Öğrenciyi tam o yere kabul etmek için istasyondaki mavi holograma tıkla.",
      born: "Yeni öğrenci istasyona katıldı"
    },
    en: {
      title: "Recruit a cadet",
      choose: "Choose a specialization for this free place.",
      module: "Module",
      slot: "Place",
      cancel: "Cancel",
      recruiting: "Recruiting cadet…",
      unavailable: "Cadets can only be recruited during the station phase.",
      occupied: "This place is already occupied.",
      hint: "Click a blue hologram inside the station to recruit a cadet into that exact place.",
      born: "A new cadet joined the station"
    }
  }[LOCALE];

  const TOPICS = [
    ["PLANETS", "🪐"],
    ["SATELLITES", "🛰️"],
    ["TELESCOPES", "🔭"],
    ["ROVERS", "🛞"],
    ["TURKISH_SATELLITES", "🇹🇷"]
  ];
  const TOPIC_COLORS = {
    PLANETS: "#b58cff",
    SATELLITES: "#66b7ff",
    TELESCOPES: "#71e0a1",
    ROVERS: "#ffad66",
    TURKISH_SATELLITES: "#ffd166"
  };

  let activeSlot = null;
  let renderer = null;
  let savedView = null;
  let busy = false;
  let tweenToken = 0;
  let restoreTimer = 0;

  const style = document.createElement("style");
  style.textContent = `
    #albaCrewSlotPanel{margin:12px 0;padding:14px;border:1px solid rgba(111,232,255,.28);border-radius:16px;background:linear-gradient(180deg,rgba(7,21,37,.98),rgba(3,13,24,.96));box-shadow:0 18px 44px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)}
    #albaCrewSlotPanel .crew-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
    #albaCrewSlotPanel .crew-slot-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 12px}
    #albaCrewSlotPanel .crew-slot-meta span{padding:8px 10px;border-radius:10px;background:rgba(91,225,245,.07);border:1px solid rgba(91,225,245,.12);font-size:.82rem}
    #albaCrewSlotPanel .crew-topic-grid{display:grid;grid-template-columns:1fr;gap:7px}
    #albaCrewSlotPanel .crew-topic{display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding:10px 11px;border-radius:11px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);color:inherit;cursor:pointer}
    #albaCrewSlotPanel .crew-topic:hover{transform:translateX(2px);border-color:rgba(111,232,255,.36);background:rgba(111,232,255,.07)}
    #albaCrewSlotPanel .crew-topic[disabled]{opacity:.48;cursor:wait;transform:none}
    #albaCrewSlotPanel .crew-topic-icon{font-size:1.2rem;min-width:1.7rem}
    #albaCrewSlotPanel .crew-topic-name{flex:1;font-weight:700}
    #albaCrewSlotPanel .crew-dot{width:9px;height:9px;border-radius:50%;box-shadow:0 0 10px currentColor}
    .crew-slot-hint{margin-top:12px}
    .station-viewport[data-crew-select="1"]{box-shadow:inset 0 0 0 1px rgba(111,232,255,.2),0 0 30px rgba(111,232,255,.06)}
  `;
  document.head.appendChild(style);

  function currentState() {
    try { return typeof state !== "undefined" ? state : null; } catch { return null; }
  }
  function currentPlayer() {
    try { return typeof me === "function" ? me() : null; } catch { return null; }
  }
  function notify(message) {
    try { if (typeof toast === "function") toast(message); } catch {}
  }
  function moduleLabel(module) {
    if (!module) return "—";
    if (module.type === "LARGE") return module.role || `LARGE ${Number(module.spineIndex || 0) + 1}`;
    return module.visualVariant || "SMALL";
  }
  function topicLabel(key) {
    try { return AlbaSpace.TOPICS[key]?.label || key; } catch { return key; }
  }
  function isSlotFree(player, moduleId, slotId) {
    return !(player?.cadets || []).some(cadet => cadet.status === "ACTIVE" && cadet.moduleId === moduleId && cadet.slotId === slotId);
  }

  function tweenCamera(targetRenderer, destination, duration = 520) {
    if (!targetRenderer?.camera) return;
    const token = ++tweenToken;
    const camera = targetRenderer.camera;
    const start = targetRenderer.captureView?.();
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

  function focusSlot(targetRenderer, selection) {
    if (!targetRenderer?.camera || !selection?.module?.position) return;
    if (!savedView) savedView = targetRenderer.captureView?.() || null;
    const local = selection.local?.clone ? selection.local.clone() : new BABYLON.Vector3(0, 0, 0);
    const target = selection.module.position.add(local);
    tweenCamera(targetRenderer, {
      alpha: targetRenderer.camera.alpha,
      beta: 0.94,
      radius: Math.max(6.4, Math.min(8.2, targetRenderer.camera.radius * 0.58)),
      target: { x: target.x, y: target.y + 0.08, z: target.z }
    }, 540);
  }

  function restoreCamera(targetRenderer, delay = 0) {
    clearTimeout(restoreTimer);
    if (!savedView || !targetRenderer?.camera) return;
    const view = savedView;
    savedView = null;
    restoreTimer = setTimeout(() => tweenCamera(targetRenderer, view, 620), delay);
  }

  function decorateRecruitControls() {
    const controls = document.querySelector(".station-controls");
    if (!controls) return;
    const recruitButtons = [...controls.querySelectorAll(".recruit")];
    if (!recruitButtons.length) return;
    const grid = recruitButtons[0].closest(".grid");
    if (grid) grid.style.display = "none";
    const headings = [...controls.querySelectorAll("h2")];
    const heading = headings[headings.length - 1];
    if (heading) heading.style.display = "none";
    if (!controls.querySelector(".crew-slot-hint")) {
      const hint = document.createElement("div");
      hint.className = "notice crew-slot-hint";
      hint.innerHTML = `👨‍🚀 ${COPY.hint}`;
      if (grid) grid.before(hint);
      else controls.appendChild(hint);
    }
  }

  function removePanel() {
    document.getElementById("albaCrewSlotPanel")?.remove();
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.crewSelect = "0";
  }

  function renderPanel() {
    removePanel();
    if (!activeSlot) return;
    const controls = document.querySelector(".station-controls");
    if (!controls) return;
    const player = currentPlayer();
    if (!isSlotFree(player, activeSlot.moduleId, activeSlot.slotId)) {
      notify(COPY.occupied);
      cancelSlot(true);
      return;
    }

    const panel = document.createElement("div");
    panel.id = "albaCrewSlotPanel";
    panel.innerHTML = `
      <div class="crew-head">
        <strong>👨‍🚀 ${COPY.title}</strong>
        <button class="btn ghost compact" type="button" data-crew-cancel aria-label="${COPY.cancel}">×</button>
      </div>
      <p class="muted">${busy ? COPY.recruiting : COPY.choose}</p>
      <div class="crew-slot-meta">
        <span><strong>${COPY.module}</strong><br>${moduleLabel(activeSlot.module)}</span>
        <span><strong>${COPY.slot}</strong><br>${activeSlot.slotId}</span>
      </div>
      <div class="crew-topic-grid">
        ${TOPICS.map(([key, icon]) => `<button class="crew-topic" type="button" data-crew-topic="${key}" ${busy ? "disabled" : ""}><span class="crew-topic-icon">${icon}</span><span class="crew-topic-name">${topicLabel(key)}</span><span class="crew-dot" style="color:${TOPIC_COLORS[key]};background:${TOPIC_COLORS[key]}"></span></button>`).join("")}
      </div>
      <div style="margin-top:10px"><button class="btn ghost" type="button" data-crew-cancel ${busy ? "disabled" : ""}>${COPY.cancel}</button></div>`;

    const tabs = controls.querySelector(".control-tabs");
    if (tabs?.nextSibling) controls.insertBefore(panel, tabs.nextSibling);
    else controls.prepend(panel);
    panel.querySelectorAll("[data-crew-cancel]").forEach(button => button.addEventListener("click", () => cancelSlot(true)));
    panel.querySelectorAll("[data-crew-topic]").forEach(button => button.addEventListener("click", () => recruit(button.dataset.crewTopic)));
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.crewSelect = "1";
  }

  function openSlot(selection, targetRenderer) {
    const gameState = currentState();
    const player = currentPlayer();
    if (!gameState || gameState.phase !== "STATION" || gameState.presentationMode !== "3D") {
      notify(COPY.unavailable);
      return;
    }
    if (!isSlotFree(player, selection.moduleId, selection.slotId)) {
      notify(COPY.occupied);
      return;
    }
    if (window.AlbaStationBuildMode?.activeType) window.AlbaStationBuildMode.cancel?.(true);
    renderer = targetRenderer || renderer;
    activeSlot = selection;
    busy = false;
    focusSlot(renderer, selection);
    renderPanel();
  }

  function cancelSlot(restore = true) {
    const targetRenderer = renderer;
    activeSlot = null;
    busy = false;
    removePanel();
    if (restore) restoreCamera(targetRenderer);
    else savedView = null;
  }

  async function recruit(topic) {
    if (!activeSlot || busy) return;
    const player = currentPlayer();
    if (!isSlotFree(player, activeSlot.moduleId, activeSlot.slotId)) {
      notify(COPY.occupied);
      cancelSlot(true);
      return;
    }
    busy = true;
    renderPanel();
    const slot = { moduleId: activeSlot.moduleId, slotId: activeSlot.slotId };
    try {
      const response = await AlbaGame.command(roomId, "RECRUIT_CADET", { topic, moduleId: slot.moduleId, slotId: slot.slotId });
      activeSlot = null;
      busy = false;
      removePanel();
      if (typeof apply === "function") apply(response.state);
      notify(COPY.born);
      restoreCamera(stationRenderer || renderer, 1150);
    } catch (error) {
      busy = false;
      notify(error.message || String(error));
      renderPanel();
    }
  }

  function animateArrival(targetRenderer, cadet) {
    const node = targetRenderer?.scene?.getTransformNodeByName(`Cadet_${cadet.id}`);
    if (!node) return;
    const finalScale = node.scaling.clone();
    node.scaling.setAll(0.18);

    const color = TOPIC_COLORS[cadet.topic] || "#72e8ff";
    const rings = [0, 1].map(index => {
      const ring = BABYLON.MeshBuilder.CreateTorus(`RecruitRing_${cadet.id}_${index}`, { diameter: 0.68 + index * 0.18, thickness: 0.025, tessellation: 36 }, targetRenderer.scene);
      ring.parent = targetRenderer.stationRoot;
      ring.position.copyFrom(node.position);
      ring.rotation.x = Math.PI / 2;
      ring.position.y += index ? -0.28 : 0.28;
      const mat = new BABYLON.StandardMaterial(`RecruitMat_${cadet.id}_${index}`, targetRenderer.scene);
      mat.diffuseColor = BABYLON.Color3.FromHexString(color);
      mat.emissiveColor = BABYLON.Color3.FromHexString(color);
      mat.specularColor = BABYLON.Color3.Black();
      mat.alpha = 0.92;
      ring.material = mat;
      return ring;
    });

    const started = performance.now();
    const duration = 950;
    const frame = now => {
      if (!node || node.isDisposed?.()) return;
      const rawT = Math.min(1, (now - started) / duration);
      const t = 1 - Math.pow(1 - rawT, 3);
      const scale = 0.18 + 0.82 * t;
      node.scaling.set(finalScale.x * scale, finalScale.y * scale, finalScale.z * scale);
      rings.forEach((ring, index) => {
        if (!ring || ring.isDisposed?.()) return;
        ring.scaling.setAll(0.7 + t * 0.7);
        ring.position.y += (index ? 1 : -1) * 0.0025;
        if (ring.material) ring.material.alpha = 0.92 * (1 - rawT);
      });
      if (rawT < 1) requestAnimationFrame(frame);
      else rings.forEach(ring => { try { ring.material?.dispose(); ring.dispose(); } catch {} });
    };
    requestAnimationFrame(frame);
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaCrewSlotPatched) {
    const originalHologram = proto.buildHologram;
    proto.buildHologram = function (module, local, slotId) {
      const result = originalHologram.call(this, module, local, slotId);
      const holo = this.scene?.getMeshByName(`CrewSlot_${module.id}_${slotId}`);
      if (holo?.actionManager) {
        holo.actionManager.hoverCursor = "pointer";
        holo.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => openSlot({
          kind: "crew-slot",
          module,
          moduleId: module.id,
          slotId,
          local: local?.clone ? local.clone() : local
        }, this)));
        holo.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          if (holo.isDisposed?.()) return;
          holo.scaling.setAll(1.14);
          if (holo.material) holo.material.alpha = 0.46;
        }));
        holo.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          if (holo.isDisposed?.()) return;
          holo.scaling.setAll(1);
          if (holo.material) holo.material.alpha = 0.2;
        }));
      }
      return result;
    };

    const originalUpdate = proto.update;
    proto.update = function (nextState, nextPlayer) {
      const hadRendered = !!this.hasRendered;
      const previous = new Set((this.player?.cadets || []).filter(cadet => cadet.status === "ACTIVE").map(cadet => cadet.id));
      originalUpdate.call(this, nextState, nextPlayer);
      if (hadRendered) {
        for (const cadet of (nextPlayer?.cadets || []).filter(item => item.status === "ACTIVE")) {
          if (!previous.has(cadet.id)) animateArrival(this, cadet);
        }
      }
      renderer = this;
      decorateRecruitControls();
      if (activeSlot) renderPanel();
    };
    proto.__albaCrewSlotPatched = true;
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeSlot) cancelSlot(true);
  });

  const observer = new MutationObserver(() => decorateRecruitControls());
  const startObserver = () => {
    const app = document.getElementById("app");
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true });
    decorateRecruitControls();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  else startObserver();

  window.AlbaCrewSlotMode = {
    open: openSlot,
    cancel: () => cancelSlot(true),
    isActive: () => !!activeSlot
  };
})();
