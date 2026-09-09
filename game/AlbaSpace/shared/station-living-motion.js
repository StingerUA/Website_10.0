/* AlbaSpace living motion: subtle camera breathing, Earth parallax, solar/antenna tracking and zero-g cadet drift. Presentation only. */
(function () {
  if (!window.AlbaStation3D || window.AlbaStationLivingMotion || !window.BABYLON) return;

  const REDUCED = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
  const cadetBase = new WeakMap();
  const solarBase = new WeakMap();
  const antennaBase = new WeakMap();
  const earthBase = new WeakMap();

  function hash(value) {
    let h = 2166136261;
    for (const ch of String(value || "")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  function modeSignature(renderer) {
    const viewport = document.querySelector(".station-viewport");
    const phase = String(renderer?.state?.phase || "");
    return [
      viewport?.dataset.buildMode === "1" ? "build" : "",
      viewport?.dataset.crewSelect === "1" ? "crew" : "",
      viewport?.dataset.cadetFocus === "1" ? "cadet" : "",
      phase === "RESULT" ? "result" : "",
      phase === "ENDGAME" ? "end" : ""
    ].filter(Boolean).join("|") || "idle";
  }

  function activeInteraction(renderer) {
    const sig = modeSignature(renderer);
    return sig !== "idle" || performance.now() - (renderer.__albaLastCameraInput || 0) < 2600;
  }

  function installInputTracking(renderer) {
    if (!renderer.canvas || renderer.__albaLivingInputInstalled) return;
    const mark = () => { renderer.__albaLastCameraInput = performance.now(); };
    ["pointerdown", "wheel", "touchstart"].forEach(type => renderer.canvas.addEventListener(type, mark, { passive: true }));
    renderer.__albaLivingInputInstalled = true;
    if (renderer.camera) {
      renderer.camera.inertia = 0.88;
      renderer.camera.wheelPrecision = 90;
      renderer.camera.pinchPrecision = 95;
      renderer.camera.useNaturalPinchZoom = true;
    }
  }

  function cameraFrame(renderer, seconds) {
    const camera = renderer.camera;
    if (!camera) return;
    const state = renderer.__albaLivingState;
    const target = camera.target || BABYLON.Vector3.Zero();

    // Remove the previous additive offset first, preserving camera changes made by build/inspect tweens or user input.
    target.subtractInPlace(state.cameraOffset);
    camera.radius -= state.radiusOffset;
    camera.fov -= state.fovOffset;
    state.cameraOffset.set(0, 0, 0);
    state.radiusOffset = 0;
    state.fovOffset = 0;

    const signature = modeSignature(renderer);
    if (signature !== state.lastMode) {
      state.lastMode = signature;
      state.modeChangedAt = performance.now();
    }

    if (!REDUCED && !activeInteraction(renderer) && !document.hidden) {
      const x = Math.sin(seconds * 0.34) * 0.028;
      const y = Math.sin(seconds * 0.27 + 1.2) * 0.018;
      const z = Math.cos(seconds * 0.22) * 0.018;
      state.cameraOffset.set(x, y, z);
      state.radiusOffset = Math.sin(seconds * 0.3 + 0.5) * 0.055;
    }

    const sinceMode = performance.now() - state.modeChangedAt;
    if (!REDUCED && sinceMode < 900) {
      const t = Math.max(0, Math.min(1, sinceMode / 900));
      const pulse = Math.sin(Math.PI * t);
      state.fovOffset = signature === "idle" ? 0.012 * pulse : -0.022 * pulse;
    }

    target.addInPlace(state.cameraOffset);
    camera.setTarget(target);
    camera.radius += state.radiusOffset;
    camera.fov += state.fovOffset;
  }

  function earthFrame(renderer, seconds) {
    const scene = renderer.scene;
    if (!scene || REDUCED) return;
    const nodes = ["Earth", "EarthClouds", "EarthAtmosphere"].map(name => scene.getMeshByName(name)).filter(Boolean);
    const dx = Math.sin(seconds * 0.055) * 0.16;
    const dy = Math.cos(seconds * 0.047 + 0.7) * 0.08;
    const dz = Math.sin(seconds * 0.039 + 1.1) * 0.11;
    nodes.forEach(node => {
      if (!earthBase.has(node)) earthBase.set(node, node.position.clone());
      const base = earthBase.get(node);
      node.position.set(base.x + dx, base.y + dy, base.z + dz);
    });
  }

  function solarFrame(renderer, seconds) {
    if (REDUCED) return;
    for (const node of renderer.__albaLivingSolar || []) {
      if (node.isDisposed?.()) continue;
      if (!solarBase.has(node)) solarBase.set(node, { y: node.rotation.y, z: node.rotation.z });
      const base = solarBase.get(node);
      const seed = hash(node.name);
      node.rotation.y = base.y + Math.sin(seconds * (0.018 + seed * 0.006) + seed * 5.7) * 0.055;
      node.rotation.z = base.z + Math.sin(seconds * 0.013 + seed * 8.1) * 0.012;
    }
  }

  function antennaFrame(renderer, seconds) {
    if (REDUCED) return;
    for (const mesh of renderer.__albaLivingAntennas || []) {
      if (mesh.isDisposed?.()) continue;
      if (!antennaBase.has(mesh)) {
        antennaBase.set(mesh, mesh.rotationQuaternion?.clone() || BABYLON.Quaternion.FromEulerAngles(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z));
      }
      const base = antennaBase.get(mesh);
      const seed = hash(mesh.name);
      const yaw = Math.sin(seconds * (0.035 + seed * 0.01) + seed * 4) * 0.035;
      const pitch = Math.cos(seconds * 0.027 + seed * 5) * 0.018;
      const delta = BABYLON.Quaternion.RotationYawPitchRoll(yaw, pitch, 0);
      mesh.rotationQuaternion = base.multiply(delta);
    }
  }

  function cadetFrame(renderer, seconds) {
    const phase = String(renderer?.state?.phase || "");
    const freeze = REDUCED || phase === "RESULT" || phase === "ENDGAME";
    for (const root of renderer.__albaLivingCadets || []) {
      if (root.isDisposed?.()) continue;
      if (!cadetBase.has(root)) cadetBase.set(root, { position: root.position.clone(), z: root.rotation.z });
      const base = cadetBase.get(root);
      if (freeze) {
        root.position.copyFrom(base.position);
        root.rotation.z = base.z;
        continue;
      }
      const seed = hash(root.name);
      const speed = 0.52 + seed * 0.18;
      const amp = 0.018 + seed * 0.016;
      root.position.x = base.position.x + Math.sin(seconds * speed + seed * 8.7) * amp * 0.55;
      root.position.y = base.position.y + Math.sin(seconds * speed * 0.82 + seed * 5.1) * amp;
      root.position.z = base.position.z + Math.cos(seconds * speed * 0.67 + seed * 6.3) * amp * 0.6;
      root.rotation.z = base.z + Math.sin(seconds * speed * 0.58 + seed * 7.4) * 0.018;
    }
  }

  function collect(renderer) {
    const scene = renderer.scene;
    if (!scene) return;
    renderer.__albaLivingSolar = scene.transformNodes.filter(node => /^SolarRotaryPivot_/.test(node.name || ""));
    renderer.__albaLivingCadets = scene.transformNodes.filter(node => /^Cadet_/.test(node.name || ""));
    renderer.__albaLivingAntennas = scene.meshes.filter(mesh => /^(HighGainAntenna|TrackingAntenna)_(Dish|DishRim)$/.test(mesh.name || ""));
  }

  function install(renderer) {
    if (!renderer.scene || renderer.__albaLivingState) return;
    renderer.__albaLivingState = {
      cameraOffset: BABYLON.Vector3.Zero(), radiusOffset: 0, fovOffset: 0,
      lastMode: "idle", modeChangedAt: performance.now()
    };
    renderer.__albaLastCameraInput = performance.now();
    installInputTracking(renderer);
    renderer.__albaLivingObserver = renderer.scene.onBeforeRenderObservable.add(() => {
      if (renderer.hidden || !renderer.ready) return;
      const seconds = performance.now() / 1000;
      cameraFrame(renderer, seconds);
      earthFrame(renderer, seconds);
      solarFrame(renderer, seconds);
      antennaFrame(renderer, seconds);
      cadetFrame(renderer, seconds);
    });
  }

  const proto = window.AlbaStation3D.Station3DRenderer.prototype;
  if (!proto.__albaLivingMotionPatched) {
    const originalUpdate = proto.update;
    proto.update = function (nextState, nextPlayer) {
      originalUpdate.call(this, nextState, nextPlayer);
      install(this);
      collect(this);
    };

    const originalDispose = proto.dispose;
    proto.dispose = function () {
      if (this.__albaLivingObserver && this.scene) {
        try { this.scene.onBeforeRenderObservable.remove(this.__albaLivingObserver); } catch {}
      }
      originalDispose.call(this);
    };
    proto.__albaLivingMotionPatched = true;
  }

  window.AlbaStationLivingMotion = {
    version: "20260909-living1",
    reducedMotion: REDUCED
  };
})();
