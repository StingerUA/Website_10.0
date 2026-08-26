/* AlbaSpace Station3DRenderer — presentation only. The backend remains the source of truth. */
(function () {
  const TOPIC = {
    PLANETS: { color: "#b58cff", icon: "✦", label: "Gezegenler" },
    SATELLITES: { color: "#66b7ff", icon: "◈", label: "Uydular" },
    TELESCOPES: { color: "#71e0a1", icon: "◉", label: "Teleskoplar" },
    ROVERS: { color: "#ffad66", icon: "◌", label: "Mars araçları" },
    TURKISH_SATELLITES: { color: "#ffd166", icon: "★", label: "Türk uyduları" }
  };
  const MODULE_ACCENT = { COMMAND: "#73e8ff", SCIENCE: "#b58cff", OPERATIONS: "#71e0a1", SMALL: "#ffd166" };
  const DEBUG = new URLSearchParams(location.search).has("debug3d");
  const StationAssetRegistry = {
    large: { COMMAND: "large-command.glb", SCIENCE: "large-science.glb", OPERATIONS: "large-operations.glb" },
    small: { NAVIGATION: "small-navigation.glb", OBSERVATION: "small-observation.glb", COMMUNICATIONS: "small-communications.glb", GENERAL: "small-general.glb" },
    crew: "cadet-01.glb",
    environment: { earth: "earth.glb", solarArray: "solar-array.glb", dockingRing: "docking-ring.glb" }
  };

  class Station3DRenderer {
    constructor(host, options = {}) {
      this.host = host;
      this.onSelect = options.onSelect || (() => {});
      this.onError = options.onError || (() => {});
      this.engine = null;
      this.scene = null;
      this.camera = null;
      this.stationRoot = null;
      this.ready = false;
      this.state = null;
      this.player = null;
      this.hidden = false;
      this.resize = () => this.engine?.resize();
      this.visibility = () => {
        this.hidden = document.hidden;
        if (this.engine) this.engine.setHardwareScalingLevel(document.hidden ? 2.4 : Math.min(2, 1 / Math.min(devicePixelRatio || 1, 1.5)));
      };
    }

    init() {
      if (this.ready) return true;
      if (!window.BABYLON || !this.host) {
        this.onError(new Error("Babylon.js yüklenemedi"));
        return false;
      }
      try {
        this.host.innerHTML = "<canvas class=\"station-canvas\" aria-label=\"3D uzay istasyonu\"></canvas><div class=\"station-fallback hidden\">Bu cihazda 3D modu kullanılamıyor.<br><button class=\"btn ghost\" data-reset-3d>Tekrar dene</button></div>";
        this.canvas = this.host.querySelector("canvas");
        this.canvas.addEventListener("contextmenu", event => event.preventDefault());
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true }, false);
        this.engine.setHardwareScalingLevel(Math.min(2, 1 / Math.min(devicePixelRatio || 1, 1.5)));
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = BABYLON.Color4.FromHexString("#020712ff");
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.014;
        this.camera = new BABYLON.ArcRotateCamera("StationCamera", -Math.PI / 3, 1.05, 14.5, new BABYLON.Vector3(0, 0.2, 0), this.scene);
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 24;
        this.camera.wheelPrecision = 70;
        this.camera.panningSensibility = 0;
        this.camera.attachControl(this.canvas, true);
        const hemi = new BABYLON.HemisphericLight("soft-space-light", new BABYLON.Vector3(0.2, 1, -0.3), this.scene);
        hemi.intensity = 0.28;
        const rim = new BABYLON.PointLight("cyan-rim", new BABYLON.Vector3(-3, 5, -5), this.scene);
        rim.diffuse = BABYLON.Color3.FromHexString("#68dfff"); rim.intensity = 3; rim.range = 18;
        const warm = new BABYLON.PointLight("earth-light", new BABYLON.Vector3(4, -5, 4), this.scene);
        warm.diffuse = BABYLON.Color3.FromHexString("#ffbd77"); warm.intensity = 1.5; warm.range = 15;
        this.createBackground();
        this.engine.runRenderLoop(() => { if (!this.hidden) this.scene.render(); });
        window.addEventListener("resize", this.resize);
        document.addEventListener("visibilitychange", this.visibility);
        this.host.querySelector("[data-reset-3d]").onclick = () => this.resetView();
        this.ready = true;
        return true;
      } catch (error) {
        this.onError(error);
        this.showFallback();
        return false;
      }
    }

    captureView() {
      if (!this.camera) return null;
      const target = this.camera.target || BABYLON.Vector3.Zero();
      return { alpha: this.camera.alpha, beta: this.camera.beta, radius: this.camera.radius, target: { x: target.x, y: target.y, z: target.z } };
    }

    restoreView(view) {
      if (!this.camera || !view) return;
      this.camera.setTarget(new BABYLON.Vector3(view.target.x, view.target.y, view.target.z));
      this.camera.alpha = view.alpha;
      this.camera.beta = view.beta;
      this.camera.radius = Math.max(this.camera.lowerRadiusLimit, Math.min(this.camera.upperRadiusLimit, view.radius));
    }

    update(state, player) {
      this.state = state; this.player = player;
      if (!this.init()) return;
      const savedView = this.hasRendered ? this.captureView() : null;
      this.stationRoot?.dispose(false, true);
      this.stationRoot = new BABYLON.TransformNode("StationRoot", this.scene);
      const modules = this.buildModules(player);
      modules.forEach(module => this.buildModule(module));
      this.buildSolarArrays(modules.length);
      this.buildCrew(player, modules);
      if (DEBUG) this.buildDebug(modules);
      if (savedView) this.restoreView(savedView);
      else {
        this.camera.setTarget(new BABYLON.Vector3(0, 0.2, 0));
        this.camera.radius = state.phase === "ENDGAME" ? 20 : Math.min(23, 12 + modules.length * 1.05);
      }
      this.moduleCount = modules.length;
      this.hasRendered = true;
      this.host.dataset.phase = state.phase;
      this.host.dataset.moduleCount = String(modules.length);
    }

    buildModules(player) {
      const large = Math.min(3, Number(player?.large || 1));
      const small = Math.min(7, Number(player?.small || 0));
      const out = [];
      const largeX = large === 1 ? [0] : large === 2 ? [-1.8, 1.8] : [-3.6, 0, 3.6];
      const smallSlots = large === 1 ? [
        { x: 0, y: -2.25 }, { x: 0, y: 2.25 }, { x: 2.75, y: 0 }, { x: -2.75, y: 0 },
        { x: 2.75, y: -2.25 }, { x: 2.75, y: 2.25 }, { x: -2.75, y: 2.25 }
      ] : large === 2 ? [
        { x: -4.55, y: 0 }, { x: 4.55, y: 0 }, { x: -4.55, y: -2.25 }, { x: 0, y: -2.25 },
        { x: 4.55, y: -2.25 }, { x: -4.55, y: 2.25 }, { x: 0, y: 2.25 }
      ] : [
        { x: 6.35, y: 0 }, { x: -6.35, y: 0 }, { x: -3.6, y: -2.25 }, { x: 0, y: -2.25 },
        { x: 3.6, y: -2.25 }, { x: -3.6, y: 2.25 }, { x: 0, y: 2.25 }
      ];
      const largeNames = ["COMMAND", "SCIENCE", "OPERATIONS"];
      largeX.forEach((x, index) => out.push({ id: `LARGE-${index + 1}`, type: "LARGE", name: largeNames[index], position: new BABYLON.Vector3(x, 0, 0) }));
      for (let i = 0; i < small; i++) {
        const slot = smallSlots[i];
        out.push({ id: `SMALL-${i + 1}`, type: "SMALL", name: "SMALL", position: new BABYLON.Vector3(slot.x, slot.y, 0.05), side: slot.x < 0 ? -1 : 1 });
      }
      return out;
    }
    buildModule(meta) {
      const root = new BABYLON.TransformNode(meta.id, this.scene); root.parent = this.stationRoot; root.position = meta.position;
      const isLarge = meta.type === "LARGE";
      const length = isLarge ? 3.05 : 2.2;
      const diameter = isLarge ? 2.35 : 1.72;
      const radius = diameter / 2;
      const accent = MODULE_ACCENT[meta.name] || MODULE_ACCENT.SMALL;
      const shellMat = this.material(isLarge ? "#718898" : "#5e7484", 0.94);
      const innerMat = this.material("#061524", 1);
      const accentMat = this.material(accent, 0.9, true);

      // Open cutaway shell: back wall and floor remain, while the front/top are framed only.
      const back = BABYLON.MeshBuilder.CreateBox(meta.id + "_InteriorBack", { width: length * 0.9, height: diameter * 0.76, depth: 0.12 }, this.scene);
      back.position.set(0, 0.03, diameter * 0.34); back.parent = root; back.material = innerMat;
      const floor = BABYLON.MeshBuilder.CreateBox(meta.id + "_OpenFloor", { width: length * 0.94, height: 0.14, depth: diameter * 0.72 }, this.scene);
      floor.position.set(0, -radius + 0.08, 0.02); floor.parent = root; floor.material = shellMat;
      const left = BABYLON.MeshBuilder.CreateBox(meta.id + "_LeftFrame", { width: 0.16, height: diameter * 0.82, depth: diameter * 0.74 }, this.scene);
      left.position.set(-length * 0.45, 0.03, -0.02); left.parent = root; left.material = shellMat;
      const right = left.clone(meta.id + "_RightFrame"); right.position.x = length * 0.45; right.parent = root;
      const top = BABYLON.MeshBuilder.CreateBox(meta.id + "_TopFrame", { width: length * 0.92, height: 0.16, depth: diameter * 0.74 }, this.scene);
      top.position.set(0, radius - 0.08, -0.02); top.parent = root; top.material = shellMat;
      const frontRail = BABYLON.MeshBuilder.CreateBox(meta.id + "_CutawayRail", { width: length * 0.92, height: 0.08, depth: 0.08 }, this.scene);
      frontRail.position.set(0, -radius + 0.4, -diameter * 0.4); frontRail.parent = root; frontRail.material = accentMat;
      this.buildInterior(meta, root, length, diameter, accent, accentMat);

      if (isLarge) {
        ["AxialPort_A", "AxialPort_B"].forEach((name, index) => this.anchor(root, name, new BABYLON.Vector3(index ? length * 0.57 : -length * 0.57, 0, 0), "#63e7ff"));
        [1, 2, 3, 4].forEach((n, index) => this.anchor(root, `RadialPort_0${n}`, new BABYLON.Vector3((index - 1.5) * 0.55, index % 2 ? radius : -radius, 0), "#63e7ff"));
        this.label(root, meta.name, new BABYLON.Vector3(0, 0.72, -diameter * 0.46));
      } else {
        this.anchor(root, "PrimaryPort", new BABYLON.Vector3(0, radius, 0), "#63e7ff");
        this.anchor(root, "ExtensionPort", new BABYLON.Vector3(0, -radius, 0), "#63e7ff");
      }
      return root;
    }

    buildInterior(meta, root, length, diameter, accent, accentMat) {
      const consoleMat = this.material("#123148", 1);
      const console = BABYLON.MeshBuilder.CreateBox(meta.id + "_Console", { width: Math.min(0.95, length * 0.34), height: 0.26, depth: 0.42 }, this.scene);
      console.position.set(0, -diameter * 0.22, -diameter * 0.18); console.parent = root; console.material = consoleMat;
      const core = BABYLON.MeshBuilder.CreateSphere(meta.id + "_InteriorCore", { diameter: Math.min(0.42, diameter * 0.24), segments: 12 }, this.scene);
      core.position.set(0, 0.25, -diameter * 0.2); core.parent = root; core.material = accentMat;
      const light = BABYLON.MeshBuilder.CreateBox(meta.id + "_InteriorLight", { width: length * 0.62, height: 0.035, depth: 0.035 }, this.scene);
      light.position.set(0, diameter * 0.22, -diameter * 0.39); light.parent = root; light.material = this.material("#2d8794", 0.34, true);
      [-1, 1].forEach(side => {
        const rack = BABYLON.MeshBuilder.CreateBox(`${meta.id}_Rack_${side}`, { width: 0.12, height: diameter * 0.42, depth: 0.22 }, this.scene);
        rack.position.set(side * length * 0.29, -diameter * 0.04, diameter * 0.12); rack.parent = root; rack.material = this.material(accent, 0.7, true);
      });
    }

    buildCrew(player, modules) {
      const cadets = (player?.cadets || []).filter(cadet => cadet.status === "ACTIVE");
      const slots = [];
      modules.forEach(module => { const count = module.type === "LARGE" ? 3 : 2; for (let i = 0; i < count; i++) slots.push({ module, index: i }); });
      slots.forEach((slot, index) => {
        const cadet = cadets[index];
        // Keep crew inside the open cutaway instead of in front of the shell.
        const local = new BABYLON.Vector3((slot.index - 1) * 0.55, slot.index % 2 ? 0.2 : -0.08, -0.28);
        if (cadet) this.buildCadet(slot.module, local, cadet);
        else this.buildHologram(slot.module, local, slot.index);
      });
    }

    buildCadet(module, local, cadet) {
      const root = new BABYLON.TransformNode(`Cadet_${cadet.id}`, this.scene); root.parent = this.stationRoot; root.position = module.position.add(local);
      const topicColor = TOPIC[cadet.topic]?.color || "#6ee7ff";
      const body = BABYLON.MeshBuilder.CreateCapsule(`CadetBody_${cadet.id}`, { height: 0.62, radius: 0.16, subdivisions: 3 }, this.scene); body.parent = root; body.material = this.material("#697783", 1);
      const head = BABYLON.MeshBuilder.CreateSphere(`CadetHead_${cadet.id}`, { diameter: 0.27, segments: 12 }, this.scene); head.position.y = 0.35; head.parent = root; head.material = this.material("#c68f73", 1);
      const helmet = BABYLON.MeshBuilder.CreateSphere(`CadetHelmet_${cadet.id}`, { diameter: 0.36, segments: 12 }, this.scene); helmet.position.y = 0.42; helmet.parent = root; helmet.material = this.material(topicColor, 1, true);
      const visor = BABYLON.MeshBuilder.CreateSphere(`CadetVisor_${cadet.id}`, { diameter: 0.17, segments: 10 }, this.scene); visor.position.set(0, 0.43, -0.16); visor.scaling.set(1.2, 0.58, 0.32); visor.parent = root; visor.material = this.material("#071321", 1);
      const patch = BABYLON.MeshBuilder.CreateBox(`Patch_${cadet.id}`, { width: 0.18, height: 0.18, depth: 0.04 }, this.scene); patch.position.set(0.17, 0.04, -0.18); patch.parent = root; patch.material = this.material(topicColor, 1, true);
      root.metadata = { kind: "cadet", id: cadet.id, cadet };
      root.getChildMeshes().forEach(mesh => { mesh.actionManager = new BABYLON.ActionManager(this.scene); mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => this.onSelect({ kind: "cadet", cadet, module }))); });
      this.label(root, cadet.name || TOPIC[cadet.topic]?.label || "Кадет", new BABYLON.Vector3(0, 0.82, 0));
    }

    buildHologram(module, local, index) {
      const holo = BABYLON.MeshBuilder.CreateCapsule(`CrewSlot_${module.id}_${index + 1}`, { height: 0.7, radius: 0.17, subdivisions: 3 }, this.scene); holo.position = module.position.add(local); holo.parent = this.stationRoot; holo.material = this.material("#72e8ff", 0.2, true); holo.metadata = { kind: "crew-slot", module };
      if (DEBUG) this.label(holo, `CrewSlot_0${index + 1}`, new BABYLON.Vector3(0, 0.62, 0));
    }

    buildSolarArrays(count) {
      const arrays = Math.min(3, Math.ceil(count / 3));
      for (let i = 0; i < arrays; i++) {
        const panel = BABYLON.MeshBuilder.CreateBox(`SolarArray_${i + 1}`, { width: 2.4, height: 0.06, depth: 0.7 }, this.scene); panel.position.set(8.4 + i * 2.9, 3.8, 1.1); panel.parent = this.stationRoot; panel.material = this.material("#1c4d72", 0.9, true);
        for (let x = -1; x <= 1; x++) { const line = BABYLON.MeshBuilder.CreateBox(`SolarLine_${i}_${x}`, { width: 0.035, height: 0.07, depth: 0.74 }, this.scene); line.position.set(x * 0.78, 0, 0); line.parent = panel; line.material = this.material("#a9f4ff", 0.6, true); }
      }
    }

    createBackground() {
      const earth = BABYLON.MeshBuilder.CreateSphere("Earth", { diameter: 9.5, segments: 24 }, this.scene); earth.position.set(5.4, -8.4, 6.5); earth.material = this.material("#123c68", 0.9, true);
      const atmosphere = BABYLON.MeshBuilder.CreateSphere("EarthAtmosphere", { diameter: 9.8, segments: 24 }, this.scene); atmosphere.position = earth.position; atmosphere.material = this.material("#287da2", 0.12, true);
      for (let i = 0; i < 50; i++) { const star = BABYLON.MeshBuilder.CreateSphere(`Star_${i}`, { diameter: 0.025 + (i % 3) * 0.012, segments: 4 }, this.scene); star.position = new BABYLON.Vector3(((i * 37) % 20) - 10, ((i * 17) % 12) - 4, ((i * 29) % 16) - 8); star.material = this.material("#d6f6ff", 0.78, true); }
    }

    buildDebug(modules) { modules.forEach(module => this.label(this.stationRoot, `${module.id} · depth ${module.depth || 0}`, module.position.add(new BABYLON.Vector3(0, -1.55, 0)))); }
    anchor(parent, name, position, color) { const anchor = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 0.13, segments: 6 }, this.scene); anchor.position = position; anchor.parent = parent; anchor.material = this.material(color, 0.72, true); if (DEBUG) this.label(parent, name, position.add(new BABYLON.Vector3(0, 0.15, 0))); }
    label(parent, text, position) {
      const safeText = String(text || "").slice(0, 22);
      const key = safeText.replace(/[^a-z0-9]/gi, "_");
      const plate = BABYLON.MeshBuilder.CreateBox(`LabelPlate_${key}_${Math.random()}`, { width: 3.05, height: 0.62, depth: 0.08 }, this.scene);
      plate.position = position.clone ? position.clone() : new BABYLON.Vector3(position.x, position.y, position.z); plate.parent = parent; plate.material = this.material("#5fe2f3", 0.94, false);
      const plane = BABYLON.MeshBuilder.CreatePlane(`Label_${key}_${Math.random()}`, { width: 3.0, height: 0.56 }, this.scene);
      plane.position = new BABYLON.Vector3(position.x, position.y, position.z - 0.06); plane.parent = parent; plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      const texture = new BABYLON.DynamicTexture(`LabelTexture_${Math.random()}`, { width: 1024, height: 192 }, this.scene, true); texture.hasAlpha = true;
      texture.drawText(safeText, 28, 132, "bold 60px Arial", "#020914", "#5fe2f3", true);
      const material = new BABYLON.StandardMaterial(`LabelMaterial_${Math.random()}`, this.scene); material.diffuseTexture = texture; material.emissiveColor = BABYLON.Color3.FromHexString("#1b6e7a"); material.opacityTexture = texture; material.backFaceCulling = false; plane.material = material;
    }
    material(hex, alpha = 1, emissive = false) { const material = new BABYLON.StandardMaterial(`mat_${hex}_${alpha}_${emissive}_${Math.random()}`, this.scene); material.diffuseColor = BABYLON.Color3.FromHexString(hex); material.specularColor = BABYLON.Color3.Black(); material.alpha = alpha; if (emissive) material.emissiveColor = BABYLON.Color3.FromHexString(hex); return material; }
    resetView() { if (!this.camera) return; this.camera.setTarget(new BABYLON.Vector3(0, 0.2, 0)); this.camera.alpha = -Math.PI / 3; this.camera.beta = 1.05; this.camera.radius = this.state?.phase === "ENDGAME" ? 20 : Math.min(23, 12 + (this.moduleCount || 1) * 1.05); }
    showFallback() { this.host?.querySelector("canvas")?.classList.add("hidden"); this.host?.querySelector(".station-fallback")?.classList.remove("hidden"); }
    dispose() { window.removeEventListener("resize", this.resize); document.removeEventListener("visibilitychange", this.visibility); this.engine?.stopRenderLoop(); this.scene?.dispose(); this.engine?.dispose(); this.ready = false; }
  }

  window.StationAssetRegistry = StationAssetRegistry;
  window.AlbaStation3D = { Station3DRenderer, StationAssetRegistry };
})();
