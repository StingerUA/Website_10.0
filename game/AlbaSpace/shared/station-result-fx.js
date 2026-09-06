/* AlbaSpace Result FX — knowledge pulses and graduation presentation only. Backend remains authoritative. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationResultFX) return;

  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: { knowledge: "Знания", graduation: "Подготовка завершена", coins: "ALBA Coins", graduate: "Выпуск" },
    tr: { knowledge: "Bilgi", graduation: "Eğitim tamamlandı", coins: "ALBA Coins", graduate: "Mezuniyet" },
    en: { knowledge: "Knowledge", graduation: "Training complete", coins: "ALBA Coins", graduate: "Graduation" }
  }[LOCALE];

  const TOPIC_COLORS = {
    PLANETS: "#b58cff",
    SATELLITES: "#66b7ff",
    TELESCOPES: "#71e0a1",
    ROVERS: "#ffad66",
    TURKISH_SATELLITES: "#ffd166"
  };

  const PLAYED = new Set();
  const MAX_SEQUENCE_MS = 3900;
  const KNOWLEDGE_STEP_MS = 620;
  const GRADUATION_MS = 1450;

  const style = document.createElement("style");
  style.textContent = `
    #albaResultFxBanner{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:12;min-width:220px;max-width:min(480px,calc(100% - 28px));padding:10px 14px;border-radius:14px;border:1px solid rgba(114,232,255,.28);background:rgba(4,15,28,.94);box-shadow:0 14px 38px rgba(0,0,0,.34);text-align:center;pointer-events:none;backdrop-filter:blur(9px)}
    #albaResultFxBanner strong{display:block;font-size:1rem;letter-spacing:.02em}
    #albaResultFxBanner span{display:block;margin-top:3px;color:var(--muted,#9db1c1);font-size:.84rem}
    .station-viewport[data-result-fx="1"]{box-shadow:inset 0 0 0 1px rgba(114,232,255,.18),0 0 32px rgba(114,232,255,.06)}
  `;
  document.head.appendChild(style);

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const now = () => performance.now();

  function resultItem(state, player) {
    return state?.results?.items?.find(item => item.playerId === player?.id) || null;
  }

  function sequenceKey(state, player) {
    return `${state?.roomId || "room"}:${state?.round || 0}:${state?.results?.questionId || state?.currentQuestion?.id || "q"}:${player?.id || "player"}`;
  }

  function setBusy(value) {
    const viewport = document.querySelector(".station-viewport");
    if (viewport) viewport.dataset.resultFx = value ? "1" : "0";
  }

  function banner(title, subtitle = "") {
    document.getElementById("albaResultFxBanner")?.remove();
    const stage = document.querySelector(".station-stage");
    if (!stage) return;
    const node = document.createElement("div");
    node.id = "albaResultFxBanner";
    node.innerHTML = `<strong>${String(title)}</strong>${subtitle ? `<span>${String(subtitle)}</span>` : ""}`;
    stage.appendChild(node);
  }

  function clearBanner() {
    document.getElementById("albaResultFxBanner")?.remove();
  }

  function materialColor(cadet) {
    return BABYLON.Color3.FromHexString(TOPIC_COLORS[cadet?.topic] || "#72e8ff");
  }

  function cadetNode(renderer, cadetId) {
    return renderer?.scene?.getTransformNodeByName(`Cadet_${cadetId}`) || null;
  }

  function addGlow(renderer, cadet) {
    const root = cadetNode(renderer, cadet.id);
    if (!root) return () => {};
    let layer;
    try {
      layer = new BABYLON.HighlightLayer(`ResultFX_${cadet.id}_${Date.now()}`, renderer.scene, { blurHorizontalSize: 1.15, blurVerticalSize: 1.15 });
      layer.innerGlow = false;
      const color = materialColor(cadet);
      root.getChildMeshes().filter(mesh => !String(mesh.name || "").startsWith("Label")).forEach(mesh => layer.addMesh(mesh, color));
    } catch {}
    return () => { try { layer?.dispose(); } catch {} };
  }

  function createPulse(renderer, cadet, text) {
    const root = cadetNode(renderer, cadet.id);
    if (!root) return null;
    const plane = BABYLON.MeshBuilder.CreatePlane(`KnowledgePulse_${cadet.id}_${Date.now()}`, { width: 1.25, height: 0.46 }, renderer.scene);
    plane.parent = renderer.stationRoot;
    const pos = root.getAbsolutePosition ? root.getAbsolutePosition() : root.position;
    plane.position.copyFrom(pos);
    plane.position.y += 0.92;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    const tex = new BABYLON.DynamicTexture(`KnowledgePulseTex_${cadet.id}_${Date.now()}`, { width: 512, height: 192 }, renderer.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 512, 192);
    ctx.fillStyle = "rgba(3,14,26,.82)";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(10, 20, 492, 150, 32);
    else ctx.rect(10, 20, 492, 150);
    ctx.fill();
    ctx.strokeStyle = TOPIC_COLORS[cadet.topic] || "#72e8ff";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "#eefbff";
    ctx.font = "700 56px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 96);
    tex.update();
    const mat = new BABYLON.StandardMaterial(`KnowledgePulseMat_${cadet.id}_${Date.now()}`, renderer.scene);
    mat.diffuseTexture = tex;
    mat.opacityTexture = tex;
    mat.emissiveColor = BABYLON.Color3.White();
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    plane.material = mat;
    return { plane, mat, tex };
  }

  async function animateKnowledge(renderer, previousPlayer, change) {
    const cadet = (previousPlayer?.cadets || []).find(item => item.id === change.cadetId);
    if (!cadet) return;
    const amount = Math.max(0, Number(change.after || 0) - Number(change.before || 0));
    if (!amount) return;
    const cleanupGlow = addGlow(renderer, cadet);
    banner(`🧠 +${amount} ${COPY.knowledge}`, `${change.before}/4 → ${change.after}/4`);
    const pulse = createPulse(renderer, cadet, `🧠 +${amount}   ${change.after}/4`);
    const root = cadetNode(renderer, cadet.id);
    const start = now();
    while (now() - start < KNOWLEDGE_STEP_MS) {
      const t = Math.min(1, (now() - start) / KNOWLEDGE_STEP_MS);
      if (root && !root.isDisposed?.()) {
        const s = 1 + Math.sin(t * Math.PI) * 0.09;
        root.scaling.setAll(s);
      }
      if (pulse?.plane && !pulse.plane.isDisposed?.()) {
        pulse.plane.position.y += 0.004;
        if (pulse.mat) pulse.mat.alpha = Math.max(0, 1 - t * 0.85);
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    if (root && !root.isDisposed?.()) root.scaling.setAll(1);
    try { pulse?.plane?.dispose(); pulse?.mat?.dispose(); pulse?.tex?.dispose(); } catch {}
    cleanupGlow();
  }

  function graduationTarget(renderer, cadet, grad) {
    const root = cadetNode(renderer, cadet.id);
    const start = root?.getAbsolutePosition ? root.getAbsolutePosition().clone() : root?.position?.clone?.() || BABYLON.Vector3.Zero();
    const moduleRoot = renderer?.scene?.getTransformNodeByName(grad.moduleId || cadet.moduleId);
    if (!moduleRoot) return start.add(new BABYLON.Vector3(0, 0.25, -1.4));
    const modulePos = moduleRoot.getAbsolutePosition ? moduleRoot.getAbsolutePosition() : moduleRoot.position;
    const outward = start.subtract(modulePos);
    if (outward.lengthSquared() < 0.01) outward.set(0, 0, -1);
    outward.normalize();
    return modulePos.add(outward.scale(1.55)).add(new BABYLON.Vector3(0, 0.12, -0.28));
  }

  async function animateGraduation(renderer, previousPlayer, grad) {
    const cadet = (previousPlayer?.cadets || []).find(item => item.id === grad.cadetId);
    const root = cadet && cadetNode(renderer, cadet.id);
    if (!cadet || !root) return;
    const cleanupGlow = addGlow(renderer, cadet);
    banner(`🎓 ${COPY.graduation}`, `${cadet.name || COPY.graduate} · +${grad.reward || 350} ${COPY.coins}`);
    const start = root.position.clone();
    const absoluteTarget = graduationTarget(renderer, cadet, grad);
    const parentAbsolute = renderer.stationRoot?.getAbsolutePosition?.() || BABYLON.Vector3.Zero();
    const target = absoluteTarget.subtract(parentAbsolute);
    const started = now();
    while (now() - started < GRADUATION_MS) {
      const rawT = Math.min(1, (now() - started) / GRADUATION_MS);
      const t = rawT * rawT * (3 - 2 * rawT);
      root.position = BABYLON.Vector3.Lerp(start, target, t);
      const scale = 1 - Math.max(0, rawT - 0.62) / 0.38 * 0.82;
      root.scaling.setAll(Math.max(0.18, scale));
      root.rotation.z += 0.0035;
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    cleanupGlow();
  }

  async function playSequence(renderer, previousPlayer, nextState, nextPlayer, item, originalUpdate) {
    const started = now();
    setBusy(true);
    try {
      window.AlbaCadetInspectMode?.close?.(false);
      const grads = new Map((item.grads || []).map(grad => [grad.cadetId, grad]));
      const changes = Array.isArray(item.changes) ? item.changes : [];
      for (const change of changes) {
        if (now() - started > MAX_SEQUENCE_MS - 600) break;
        await animateKnowledge(renderer, previousPlayer, change);
        const grad = grads.get(change.cadetId);
        if (grad && now() - started < MAX_SEQUENCE_MS - 700) await animateGraduation(renderer, previousPlayer, grad);
      }
      for (const grad of item.grads || []) {
        if (changes.some(change => change.cadetId === grad.cadetId)) continue;
        if (now() - started > MAX_SEQUENCE_MS - 700) break;
        await animateGraduation(renderer, previousPlayer, grad);
      }
      const remaining = MAX_SEQUENCE_MS - (now() - started);
      if (remaining > 250 && ((item.changes || []).length || (item.grads || []).length)) await wait(Math.min(260, remaining));
    } finally {
      clearBanner();
      setBusy(false);
      originalUpdate.call(renderer, nextState, nextPlayer);
    }
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaResultFxPatched) {
    const originalUpdate = proto.update;
    proto.update = function (nextState, nextPlayer) {
      const previousState = this.state;
      const previousPlayer = this.player ? structuredClone(this.player) : null;
      const item = resultItem(nextState, nextPlayer);
      const key = sequenceKey(nextState, nextPlayer);
      const shouldPlay = !!(
        this.hasRendered &&
        previousState?.phase === "QUESTION" &&
        nextState?.phase === "RESULT" &&
        item &&
        ((item.changes || []).length || (item.grads || []).length) &&
        !PLAYED.has(key)
      );
      if (!shouldPlay) return originalUpdate.call(this, nextState, nextPlayer);
      PLAYED.add(key);
      playSequence(this, previousPlayer, nextState, nextPlayer, item, originalUpdate).catch(() => {
        clearBanner();
        setBusy(false);
        try { originalUpdate.call(this, nextState, nextPlayer); } catch {}
      });
    };
    proto.__albaResultFxPatched = true;
  }

  window.AlbaStationResultFX = {
    played: PLAYED,
    maxSequenceMs: MAX_SEQUENCE_MS
  };
})();
