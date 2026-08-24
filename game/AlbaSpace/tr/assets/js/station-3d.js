/* AlbaSpace Station3DRenderer — presentation only. The backend remains the source of truth. */
(function () {
  const TOPIC = {
    PLANETS: { color: "#b58cff", icon: "✦", label: "Gezegenler" },
    SATELLITES: { color: "#66b7ff", icon: "◈", label: "Uydular" },
    TELESCOPES: { color: "#71e0a1", icon: "◉", label: "Teleskoplar" },
    ROVERS: { color: "#ffad66", icon: "◌", label: "Mars araçları" },
    TURKISH_SATELLITES: { color: "#ffd166", icon: "★", label: "Türk uyduları" }
  };
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
      this.lastFocus = null;
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
        this.canvas.addEventListener("contextmenu", e => e.preventDefault());
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true }, false);
        this.engine.setHardwareScalingLevel(Math.min(2, 1 / Math.min(devicePixelRatio || 1, 1.5)));
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = BABYLON.Color4.FromHexString("#020712ff");
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.018;
        this.camera = new BABYLON.ArcRotateCamera("StationCamera", -Math.PI / 3, 1.05, 15, BABYLON.Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 9;
        this.camera.upperRadiusLimit = 23;
        this.camera.wheelPrecision = 70;
        this.camera.panningSensibility = 0;
        this.camera.attachControl(this.canvas, true);
        const hemi = new BABYLON.HemisphericLight("soft-space-light", new BABYLON.Vector3(0.2, 1, -0.3), this.scene);
        hemi.intensity = 0.86;
        const rim = new BABYLON.PointLight("cyan-rim", new BABYLON.Vector3(-3, 5, -5), this.scene);
        rim.diffuse = BABYLON.Color3.FromHexString("#68dfff"); rim.intensity = 55; rim.range = 18;
        const warm = new BABYLON.PointLight("earth-light", new BABYLON.Vector3(4, -5, 4), this.scene);
        warm.diffuse = BABYLON.Color3.FromHexString("#ffbd77"); warm.intensity = 20; warm.range = 15;
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

    update(state, player) {
      this.state = state; this.player = player;
      if (!this.init()) return;
      if (this.stationRoot) this.stationRoot.dispose(false, true);
      this.stationRoot = new BABYLON.TransformNode("StationRoot", this.scene);
      const modules = this.buildModules(player);
      modules.forEach(module => this.buildModule(module));
      this.buildSolarArrays(modules.length);
      this.buildCrew(player, modules);
      if (DEBUG) this.buildDebug(modules);
      this.camera.target = new BABYLON.Vector3(0, 0.35, 0);
      this.camera.radius = state.phase === "ENDGAME" ? 19 : state.phase === "QUESTION" || state.phase === "RESULT" ? 15.5 : Math.min(17, 12.2 + modules.length * 0.45);
      this.host.dataset.phase = state.phase;
      this.host.dataset.moduleCount = String(modules.length);
    }

    buildModules(player) {
      const large = Math.min(3, Number(player?.large || 1));
      const small = Math.min(7, Number(player?.small || 0));
      const out = [];
      const largeNames = ["COMMAND", "SCIENCE", "OPERATIONS"];
      for (let i = 0; i < large; i++) out.push({ id: `LARGE-${i + 1}`, type: "LARGE", name: largeNames[i], position: new BABYLON.Vector3((i - 1) * 3.4, 0, 0), depth: 0 });
      for (let i = 0; i < small; i++) {
        const parent = Math.min(2, Math.floor(i / 3));
        const side = i % 2 ? 1 : -1;
        const row = Math.floor(i / 2);
        out.push({ id: `SMALL-${i + 1}`, type: "SMALL", name: "SMALL", position: new BABYLON.Vector3((parent - 1) * 3.4 + (row % 2) * 0.55, side * (2.05 + Math.floor(i / 4) * 0.22), 0.05), depth: 1, side });
      }
      return out;
    }

    buildModule(meta) {
      const root = new BABYLON.TransformNode(meta.id, this.scene); root.parent = this.stationRoot; root.position = meta.position;
      const shell = BABYLON.MeshBuilder.CreateCylinder(meta.id + "_CutawayShell", { diameter: meta.type === "LARGE" ? 2.45 : 1.78, height: meta.type === "LARGE" ? 3.15 : 2.25, tessellation: 20 }, this.scene);
      shell.rotation.z = Math.PI / 2; shell.parent = root; shell.material = this.material(meta.type === "LARGE" ? "#d8e3ed" : "#aebdca", 0.96);
      const interior = BABYLON.MeshBuilder.CreateCylinder(meta.id + "_Interior", { diameter: meta.type === "LARGE" ? 1.98 : 1.35, height: meta.type === "LARGE" ? 3.0 : 2.15, tessellation: 20 }, this.scene);
      interior.rotation.z = Math.PI / 2; interior.parent = root; interior.material = this.material("#152b43", 1);
      const cut = BABYLON.MeshBuilder.CreateBox(meta.id + "_Cutaway", { width: meta.type === "LARGE" ? 2.1 : 1.55, height: 1.15, depth: 2.3 }, this.scene);
      cut.position.z = -0.72; cut.parent = root; cut.material = this.material("#061221", 1);
      const ring = BABYLON.MeshBuilder.CreateTorus(meta.id + "_DockRing", { diameter: meta.type === "LARGE" ? 2.55 : 1.86, thickness: 0.08, tessellation: 20 }, this.scene);
      ring.rotation.y = Math.PI / 2; ring.parent = root; ring.material = this.material("#5cc9d8", 0.82, true);
      const innerLight = BABYLON.MeshBuilder.CreateBox(meta.id + "_InteriorLight", { width: meta.type === "LARGE" ? 2.1 : 1.5, height: 0.035, depth: 0.035 }, this.scene);
      innerLight.position.set(0, 0.45, -0.85); innerLight.parent = root; innerLight.material = this.material("#a9f4ff", 0.95, true);
      if (meta.type === "LARGE") {
        ["AxialPort_A", "AxialPort_B"].forEach((name, index) => this.anchor(root, name, new BABYLON.Vector3(index ? 1.75 : -1.75, 0, 0), "#63e7ff"));
        [1, 2, 3, 4].forEach((n, index) => this.anchor(root, `RadialPort_0${n}`, new BABYLON.Vector3((index - 1.5) * 0.55, index % 2 ? 1.32 : -1.32, 0), "#63e7ff"));
        this.label(root, meta.name, new BABYLON.Vector3(0, 1.55, 0));
      } else {
        this.anchor(root, "PrimaryPort", new BABYLON.Vector3(0, 1.0, 0), "#63e7ff");
        this.anchor(root, "ExtensionPort", new BABYLON.Vector3(0, -1.0, 0), "#63e7ff");
      }
      return root;
    }

    buildCrew(player, modules) {
      const cadets = (player?.cadets || []).filter(c => c.status === "ACTIVE");
      const slots = [];
      modules.forEach(m => { const count = m.type === "LARGE" ? 3 : 2; for (let i = 0; i < count; i++) slots.push({ module: m, index: i }); });
      slots.forEach((slot, index) => {
        const cadet = cadets[index];
        const local = new BABYLON.Vector3((slot.index - 1) * 0.62, (slot.index % 2 ? 0.22 : -0.18), -1.0);
        if (cadet) this.buildCadet(slot.module, local, cadet);
        else this.buildHologram(slot.module, local, slot.index);
      });
    }

    buildCadet(module, local, cadet) {
      const root = new BABYLON.TransformNode(`Cadet_${cadet.id}`, this.scene); root.parent = this.stationRoot; root.position = module.position.add(local);
      const body = BABYLON.MeshBuilder.CreateCapsule(`CadetBody_${cadet.id}`, { height: 0.72, radius: 0.18, subdivisions: 3 }, this.scene); body.parent = root; body.material = this.material("#e9f1f5", 1);
      const head = BABYLON.MeshBuilder.CreateSphere(`CadetHead_${cadet.id}`, { diameter: 0.32, segments: 12 }, this.scene); head.position.y = 0.45; head.parent = root; head.material = this.material("#e5ad8a", 1);
      const patch = BABYLON.MeshBuilder.CreatePlane(`Patch_${cadet.id}`, { width: 0.14, height: 0.14 }, this.scene); patch.position.set(0.19, 0.05, -0.18); patch.parent = root; patch.material = this.material(TOPIC[cadet.topic]?.color || "#6ee7ff", 1, true);
      root.metadata = { kind: "cadet", id: cadet.id, cadet };
      root.getChildMeshes().forEach(mesh => { mesh.actionManager = new BABYLON.ActionManager(this.scene); mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => this.onSelect({ kind: "cadet", cadet, module }))); });
      this.label(root, cadet.name || TOPIC[cadet.topic]?.label || "Öğrenci", new BABYLON.Vector3(0, 0.83, 0));
    }

    buildHologram(module, local, index) {
      const holo = BABYLON.MeshBuilder.CreateCapsule(`CrewSlot_${module.id}_${index + 1}`, { height: 0.82, radius: 0.2, subdivisions: 3 }, this.scene); holo.position = module.position.add(local); holo.parent = this.stationRoot; holo.material = this.material("#72e8ff", 0.22, true); holo.metadata = { kind: "crew-slot", module };
      if (DEBUG) this.label(holo, `CrewSlot_0${index + 1}`, new BABYLON.Vector3(0, 0.7, 0));
    }

    buildSolarArrays(count) {
      const arrays = Math.min(3, Math.ceil(count / 3));
      for (let i = 0; i < arrays; i++) {
        const panel = BABYLON.MeshBuilder.CreateBox(`SolarArray_${i + 1}`, { width: 2.4, height: 0.06, depth: 0.7 }, this.scene); panel.position.set((i - 1) * 3.1, 0, 2.25); panel.parent = this.stationRoot; panel.material = this.material("#1c4d72", 0.9, true);
        for (let x = -1; x <= 1; x++) { const line = BABYLON.MeshBuilder.CreateBox(`SolarLine_${i}_${x}`, { width: 0.035, height: 0.07, depth: 0.74 }, this.scene); line.position.set(x * 0.78, 0, 0); line.parent = panel; line.material = this.material("#a9f4ff", 0.6, true); }
      }
    }

    createBackground() {
      const earth = BABYLON.MeshBuilder.CreateSphere("Earth", { diameter: 12, segments: 24 }, this.scene); earth.position.set(4, -7.5, 4); earth.material = this.material("#123c68", 0.9, true);
      const atmosphere = BABYLON.MeshBuilder.CreateSphere("EarthAtmosphere", { diameter: 12.3, segments: 24 }, this.scene); atmosphere.position = earth.position; atmosphere.material = this.material("#287da2", 0.12, true);
      for (let i = 0; i < 50; i++) { const star = BABYLON.MeshBuilder.CreateSphere(`Star_${i}`, { diameter: 0.025 + (i % 3) * 0.012, segments: 4 }, this.scene); star.position = new BABYLON.Vector3(((i * 37) % 20) - 10, ((i * 17) % 12) - 4, ((i * 29) % 16) - 8); star.material = this.material("#d6f6ff", 0.78, true); }
    }

    buildDebug(modules) { modules.forEach(m => { this.label(this.stationRoot, `${m.id} · depth ${m.depth}`, m.position.add(new BABYLON.Vector3(0, -1.55, 0))); }); }
    anchor(parent, name, position, color) { const a = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 0.13, segments: 6 }, this.scene); a.position = position; a.parent = parent; a.material = this.material(color, 0.72, true); if (DEBUG) this.label(parent, name, position.add(new BABYLON.Vector3(0, 0.15, 0))); }
    label(parent, text, position) { const plane = BABYLON.MeshBuilder.CreatePlane(`Label_${text}_${Math.random()}`, { width: 1.5, height: 0.28 }, this.scene); plane.position = position; plane.parent = parent; plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; const texture = new BABYLON.DynamicTexture(`LabelTexture_${Math.random()}`, { width: 512, height: 96 }, this.scene, true); texture.hasAlpha = true; texture.drawText(text, 12, 62, "bold 34px Arial", "#dffaff", "transparent", true); const material = new BABYLON.StandardMaterial("LabelMaterial", this.scene); material.diffuseTexture = texture; material.emissiveColor = BABYLON.Color3.FromHexString("#76eaff"); material.opacityTexture = texture; material.backFaceCulling = false; plane.material = material; }
    material(hex, alpha = 1, emissive = false) { const m = new BABYLON.StandardMaterial(`mat_${hex}_${alpha}_${emissive}`, this.scene); m.diffuseColor = BABYLON.Color3.FromHexString(hex); m.specularColor = BABYLON.Color3.Black(); m.alpha = alpha; if (emissive) m.emissiveColor = BABYLON.Color3.FromHexString(hex); return m; }
    resetView() { if (!this.camera) return; this.camera.alpha = -Math.PI / 3; this.camera.beta = 1.05; this.camera.radius = 15; this.camera.target = new BABYLON.Vector3(0, 0.35, 0); }
    showFallback() { this.host?.querySelector("canvas")?.classList.add("hidden"); this.host?.querySelector(".station-fallback")?.classList.remove("hidden"); }
    dispose() { window.removeEventListener("resize", this.resize); document.removeEventListener("visibilitychange", this.visibility); this.engine?.stopRenderLoop(); this.scene?.dispose(); this.engine?.dispose(); this.ready = false; }
  }

  window.StationAssetRegistry = StationAssetRegistry;
  window.AlbaStation3D = { Station3DRenderer, StationAssetRegistry };
})();

window.addEventListener("beforeunload", () => window.AlbaStationRenderer?.dispose());
