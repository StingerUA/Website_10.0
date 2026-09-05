/* AlbaSpace Build Mode — client-side placement UX over the authoritative backend topology. */
(function () {
  if (!window.AlbaStation3D || !window.BABYLON) return;

  const langRaw = String(document.documentElement.lang || "ru").toLowerCase();
  const LANG = langRaw.startsWith("tr") ? "tr" : langRaw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: {
      title: "BUILD MODE",
      choose: "Выбери светящийся стыковочный порт на станции.",
      selected: "Точка выбрана",
      buildHere: "Построить здесь",
      cancel: "Отмена",
      noPorts: "Сейчас нет доступных точек стыковки для этого модуля.",
      alreadyBuilt: "В этом раунде модуль уже построен.",
      insufficient: "Недостаточно ALBA Coins.",
      maxed: "Достигнут максимум модулей этого типа.",
      unavailable: "Build Mode доступен в 3D-режиме станции.",
      building: "Стыковка модуля…",
      hintLarge: "LARGE строится только в конец центральной оси L-L-L.",
      hintSmall: "SMALL можно пристыковать к LARGE или продлить ветку до L-S-S.",
      selectedPort: "порт"
    },
    tr: {
      title: "BUILD MODE",
      choose: "İstasyondaki parlayan bağlantı noktasını seç.",
      selected: "Bağlantı noktası seçildi",
      buildHere: "Buraya inşa et",
      cancel: "İptal",
      noPorts: "Bu modül için kullanılabilir bağlantı noktası yok.",
      alreadyBuilt: "Bu turda zaten bir modül inşa edildi.",
      insufficient: "Yeterli ALBA Coins yok.",
      maxed: "Bu modül türü için maksimum sayıya ulaşıldı.",
      unavailable: "Build Mode istasyonun 3D modunda kullanılabilir.",
      building: "Modül kenetleniyor…",
      hintLarge: "LARGE yalnızca L-L-L merkezi omurgasının sonuna eklenebilir.",
      hintSmall: "SMALL, LARGE modülüne veya L-S-S derinliğine kadar bir SMALL koluna bağlanabilir.",
      selectedPort: "bağlantı"
    },
    en: {
      title: "BUILD MODE",
      choose: "Choose a glowing docking port on the station.",
      selected: "Docking point selected",
      buildHere: "Build here",
      cancel: "Cancel",
      noPorts: "There are no available docking points for this module right now.",
      alreadyBuilt: "A module has already been built this round.",
      insufficient: "Not enough ALBA Coins.",
      maxed: "Maximum number of this module type reached.",
      unavailable: "Build Mode is available in the station's 3D mode.",
      building: "Docking module…",
      hintLarge: "LARGE can only extend the end of the central L-L-L spine.",
      hintSmall: "SMALL can dock to a LARGE or extend a branch up to L-S-S.",
      selectedPort: "port"
    }
  }[LANG];

  const LARGE_RADIAL_PORTS = ["RadialPort_01", "RadialPort_02", "RadialPort_03", "RadialPort_04"];
  const PORT_NAMES = new Set(["AxialPort_A", "AxialPort_B", ...LARGE_RADIAL_PORTS, "PrimaryPort", "ExtensionPort"]);
  const DEBUG = new URLSearchParams(location.search).has("debug3d");
  const VALID_COLOR = "#62ecff";
  const SELECTED_COLOR = "#ffd166";

  let activeType = null;
  let selectedPlacement = null;
  let renderer = null;
  let savedView = null;
  let busy = false;
  let cameraTweenToken = 0;

  const style = document.createElement("style");
  style.id = "alba-build-mode-style";
  style.textContent = `
    #albaBuildPanel{margin:12px 0 16px;padding:14px;border:1px solid rgba(98,236,255,.36);border-radius:14px;background:linear-gradient(180deg,rgba(7,27,43,.96),rgba(3,13,25,.95));box-shadow:0 0 34px rgba(98,236,255,.08)}
    #albaBuildPanel .build-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
    #albaBuildPanel .build-title{letter-spacing:.12em;color:#8ef3ff}
    #albaBuildPanel .build-type{display:inline-block;margin-left:7px;padding:2px 7px;border-radius:999px;background:rgba(98,236,255,.12);font-size:.8em}
    #albaBuildPanel .build-choice{margin:10px 0;padding:10px;border-radius:10px;background:rgba(255,209,102,.08);border:1px solid rgba(255,209,102,.28)}
    #albaBuildPanel .build-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    #albaBuildPanel button[disabled]{opacity:.55;cursor:wait}
    .station-viewport[data-build-mode="1"]{box-shadow:inset 0 0 0 1px rgba(98,236,255,.22),0 0 36px rgba(98,236,255,.08)}
  `;
  document.head.appendChild(style);

  function currentState() {
    try { return typeof state !== "undefined" ? state : null; } catch { return null; }
  }

  function currentPlayer() {
    try { return typeof me === "function" ? me() : null; } catch { return null; }
  }

  function moduleCounts(player) {
    const modules = Array.isArray(player?.modules) ? player.modules : [];
    return {
      large: modules.filter(module => module.type === "LARGE").length,
      small: modules.filter(module => module.type === "SMALL").length
    };
  }

  function occupiedSet(player) {
    return new Set((player?.modules || [])
      .filter(module => module.parentModuleId && module.parentPort)
      .map(module => `${module.parentModuleId}:${module.parentPort}`));
  }

  function validPlacements(player, type) {
    const modules = Array.isArray(player?.modules) ? player.modules : [];
    const occupied = occupiedSet(player);
    const placements = [];

    if (type === "LARGE") {
      const larges = modules
        .filter(module => module.type === "LARGE")
        .sort((a, b) => Number(a.spineIndex || 0) - Number(b.spineIndex || 0));
      const last = larges[larges.length - 1];
      if (last && larges.length < 3 && !occupied.has(`${last.id}:AxialPort_B`)) {
        placements.push({ moduleId: last.id, port: "AxialPort_B", module: last });
      }
      return placements;
    }

    if (type !== "SMALL") return placements;
    for (const module of modules.filter(item => item.type === "LARGE")) {
      for (const port of LARGE_RADIAL_PORTS) {
        if (!occupied.has(`${module.id}:${port}`)) placements.push({ moduleId: module.id, port, module });
      }
    }
    for (const module of modules.filter(item => item.type === "SMALL" && Number(item.branchDepth) === 1)) {
      if (!occupied.has(`${module.id}:ExtensionPort`)) placements.push({ moduleId: module.id, port: "ExtensionPort", module });
    }
    return placements;
  }

  function portKey(moduleId, port) { return `${moduleId}:${port}`; }

  function portMeshes(targetRenderer) {
    if (!targetRenderer?.scene) return [];
    return targetRenderer.scene.meshes.filter(mesh => PORT_NAMES.has(mesh.name) && mesh.parent?.metadata?.kind === "module");
  }

  function paintPort(mesh, color, selected) {
    mesh.isVisible = true;
    mesh.isPickable = true;
    mesh.scaling.setAll(selected ? 5.2 : 4.1);
    mesh.renderingGroupId = 3;
    if (mesh.material) {
      mesh.material.alpha = selected ? 1 : 0.92;
      mesh.material.diffuseColor = BABYLON.Color3.FromHexString(color);
      mesh.material.emissiveColor = BABYLON.Color3.FromHexString(color);
    }
  }

  function resetPorts(targetRenderer) {
    for (const mesh of portMeshes(targetRenderer)) {
      mesh.isVisible = DEBUG;
      mesh.isPickable = false;
      mesh.scaling.setAll(1);
      mesh.actionManager = null;
      if (mesh.material) mesh.material.alpha = DEBUG ? 0.72 : 0.18;
    }
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.buildMode = "0";
  }

  function selectPort(placement) {
    if (!activeType || busy) return;
    selectedPlacement = placement;
    refreshRenderer(renderer);
  }

  function configurePorts(targetRenderer) {
    resetPorts(targetRenderer);
    if (!activeType) return;
    const player = currentPlayer();
    if (!player) return;

    const valid = new Map(validPlacements(player, activeType).map(item => [portKey(item.moduleId, item.port), item]));
    for (const mesh of portMeshes(targetRenderer)) {
      const module = mesh.parent?.metadata?.module;
      if (!module) continue;
      const key = portKey(module.id, mesh.name);
      const placement = valid.get(key);
      if (!placement) {
        mesh.isVisible = false;
        continue;
      }

      const selected = selectedPlacement && key === portKey(selectedPlacement.moduleId, selectedPlacement.port);
      paintPort(mesh, selected ? SELECTED_COLOR : VALID_COLOR, selected);
      mesh.actionManager = new BABYLON.ActionManager(targetRenderer.scene);
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => selectPort(placement)
      ));
    }
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.buildMode = "1";
  }

  function stationLabel(module) {
    if (!module) return "—";
    if (module.type === "LARGE") return module.role || `LARGE ${Number(module.spineIndex || 0) + 1}`;
    return module.visualVariant || "SMALL";
  }

  function renderPanel() {
    document.getElementById("albaBuildPanel")?.remove();
    if (!activeType) return;
    const controls = document.querySelector(".station-controls");
    if (!controls) return;

    const player = currentPlayer();
    const valid = validPlacements(player, activeType);
    const panel = document.createElement("div");
    panel.id = "albaBuildPanel";
    const hint = activeType === "LARGE" ? COPY.hintLarge : COPY.hintSmall;
    const selectedHtml = selectedPlacement ? `
      <div class="build-choice">
        <strong>✓ ${COPY.selected}</strong><br>
        <span class="muted">${stationLabel(selectedPlacement.module)} · ${COPY.selectedPort}: ${selectedPlacement.port}</span>
      </div>` : "";
    panel.innerHTML = `
      <div class="build-head">
        <strong class="build-title">🛠 ${COPY.title}<span class="build-type">${activeType}</span></strong>
        <button class="btn ghost compact" data-build-cancel aria-label="${COPY.cancel}">×</button>
      </div>
      <p class="muted">${valid.length ? COPY.choose : COPY.noPorts}</p>
      <p class="muted small-note">${hint}</p>
      ${selectedHtml}
      <div class="build-actions">
        <button class="btn ghost" data-build-cancel>${COPY.cancel}</button>
        <button class="btn primary" data-build-confirm ${!selectedPlacement || busy ? "disabled" : ""}>${busy ? COPY.building : COPY.buildHere}</button>
      </div>`;
    const tabs = controls.querySelector(".control-tabs");
    if (tabs?.nextSibling) controls.insertBefore(panel, tabs.nextSibling);
    else controls.prepend(panel);
    panel.querySelectorAll("[data-build-cancel]").forEach(button => button.addEventListener("click", () => cancelBuild(true)));
    panel.querySelector("[data-build-confirm]")?.addEventListener("click", commitBuild);
  }

  function cameraTarget(targetRenderer) {
    try {
      const modules = targetRenderer.buildModules(currentPlayer());
      return targetRenderer.stationCenter(modules);
    } catch {
      return targetRenderer.defaultTarget || new BABYLON.Vector3(0, 0.2, 0);
    }
  }

  function tweenCamera(targetRenderer, destination, duration = 650) {
    if (!targetRenderer?.camera) return;
    const token = ++cameraTweenToken;
    const camera = targetRenderer.camera;
    const start = targetRenderer.captureView();
    if (!start) return;
    const startTime = performance.now();
    const smooth = t => t * t * (3 - 2 * t);
    function frame(now) {
      if (token !== cameraTweenToken || !targetRenderer.camera) return;
      const raw = Math.min(1, (now - startTime) / duration);
      const t = smooth(raw);
      camera.alpha = start.alpha + (destination.alpha - start.alpha) * t;
      camera.beta = start.beta + (destination.beta - start.beta) * t;
      camera.radius = start.radius + (destination.radius - start.radius) * t;
      camera.setTarget(new BABYLON.Vector3(
        start.target.x + (destination.target.x - start.target.x) * t,
        start.target.y + (destination.target.y - start.target.y) * t,
        start.target.z + (destination.target.z - start.target.z) * t
      ));
      if (raw < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function enterBuildCamera(targetRenderer) {
    if (!targetRenderer?.camera) return;
    savedView = targetRenderer.captureView();
    const target = cameraTarget(targetRenderer);
    const count = currentPlayer()?.modules?.length || 2;
    tweenCamera(targetRenderer, {
      alpha: -Math.PI / 2.75,
      beta: 0.62,
      radius: Math.min(27, Math.max(18, 13 + count * 1.25)),
      target: { x: target.x, y: target.y, z: target.z }
    });
  }

  function restoreCamera(targetRenderer) {
    if (!savedView || !targetRenderer?.camera) return;
    tweenCamera(targetRenderer, savedView, 600);
    savedView = null;
  }

  function canBegin(type) {
    const gameState = currentState();
    const player = currentPlayer();
    if (!gameState || !player || gameState.phase !== "STATION" || gameState.presentationMode !== "3D" || !stationRenderer?.ready) {
      try { toast(COPY.unavailable); } catch {}
      return false;
    }
    const counts = moduleCounts(player);
    const max = type === "LARGE" ? 3 : 7;
    const count = type === "LARGE" ? counts.large : counts.small;
    const price = type === "LARGE" ? Number(AlbaSpace.ECON.large) : Number(AlbaSpace.ECON.small);
    if (count >= max) { try { toast(COPY.maxed); } catch {} return false; }
    if (Number(player.credits || 0) < price) { try { toast(COPY.insufficient); } catch {} return false; }
    if (gameState.round > 0 && Number(player.moduleBoughtRound) === Number(gameState.round)) {
      try { toast(COPY.alreadyBuilt); } catch {}
      return false;
    }
    if (!validPlacements(player, type).length) { try { toast(COPY.noPorts); } catch {} return false; }
    return true;
  }

  function beginBuild(type) {
    type = String(type || "").toUpperCase();
    if (!canBegin(type)) return;
    activeType = type;
    selectedPlacement = null;
    busy = false;
    renderer = stationRenderer;
    enterBuildCamera(renderer);
    refreshRenderer(renderer);
  }

  function cancelBuild(restore = true) {
    if (!activeType && !selectedPlacement) return;
    const targetRenderer = renderer;
    activeType = null;
    selectedPlacement = null;
    busy = false;
    resetPorts(targetRenderer);
    document.getElementById("albaBuildPanel")?.remove();
    if (restore) restoreCamera(targetRenderer);
    else savedView = null;
  }

  async function commitBuild() {
    if (!activeType || !selectedPlacement || busy) return;
    busy = true;
    renderPanel();
    const type = activeType;
    const placement = { ...selectedPlacement };
    try {
      const response = await AlbaGame.command(roomId, "BUY_MODULE", {
        type,
        parentModuleId: placement.moduleId,
        parentPort: placement.port
      });
      activeType = null;
      selectedPlacement = null;
      busy = false;
      savedView = null;
      apply(response.state);
    } catch (error) {
      busy = false;
      try { toast(error.message); } catch {}
      renderPanel();
      refreshRenderer(renderer);
    }
  }

  function animateDock(targetRenderer, moduleId, player) {
    const node = targetRenderer?.scene?.getTransformNodeByName(moduleId);
    if (!node) return;
    let meta = null;
    try { meta = targetRenderer.buildModules(player).find(module => module.id === moduleId) || null; } catch {}
    if (!meta?.position) return;
    const target = meta.position.clone();
    let offset;
    if (meta.type === "LARGE") offset = new BABYLON.Vector3(4.5, 0, 0);
    else if (meta.branchVector?.lengthSquared?.() > 0) offset = meta.branchVector.clone().normalize().scale(4.2);
    else offset = new BABYLON.Vector3(0, -4.2, 0);
    const start = target.add(offset);
    node.position.copyFrom(start);
    node.scaling.setAll(0.72);
    const startTime = performance.now();
    const duration = 1350;
    function frame(now) {
      if (!node || node.isDisposed?.()) return;
      const raw = Math.min(1, (now - startTime) / duration);
      const t = 1 - Math.pow(1 - raw, 3);
      node.position = BABYLON.Vector3.Lerp(start, target, t);
      node.scaling.setAll(0.72 + 0.28 * t);
      if (raw < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function refreshRenderer(targetRenderer) {
    renderer = targetRenderer || renderer;
    const gameState = currentState();
    if (!renderer?.scene) return;
    if (activeType && (!gameState || gameState.phase !== "STATION" || gameState.presentationMode !== "3D")) {
      cancelBuild(false);
      return;
    }
    configurePorts(renderer);
    renderPanel();
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaBuildModePatched) {
    const originalUpdate = proto.update;
    proto.update = function (nextState, nextPlayer) {
      const hadRendered = !!this.hasRendered;
      const previousIds = new Set((this.player?.modules || []).map(module => module.id));
      originalUpdate.call(this, nextState, nextPlayer);
      if (hadRendered) {
        for (const module of nextPlayer?.modules || []) {
          if (!previousIds.has(module.id)) animateDock(this, module.id, nextPlayer);
        }
      }
      refreshRenderer(this);
    };
    proto.__albaBuildModePatched = true;
  }

  document.addEventListener("click", event => {
    const button = event.target.closest?.("#small,#large");
    if (!button || button.disabled) return;
    const gameState = currentState();
    if (gameState?.phase !== "STATION" || gameState?.presentationMode !== "3D") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    beginBuild(button.id === "large" ? "LARGE" : "SMALL");
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeType) cancelBuild(true);
  });

  window.AlbaStationBuildMode = {
    begin: beginBuild,
    cancel: cancelBuild,
    refreshRenderer,
    validPlacements: (player, type) => validPlacements(player, String(type || "").toUpperCase()),
    get activeType() { return activeType; },
    get selectedPlacement() { return selectedPlacement; }
  };
})();
