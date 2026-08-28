import * as THREE from "https://esm.sh/three@0.167.1";
import { GLTFLoader } from "https://esm.sh/three@0.167.1/examples/jsm/loaders/GLTFLoader.js";

(() => {
  const modelHost = document.getElementById("solarModel");
  const side = document.querySelector(".oa-solar-side");
  const system2d = modelHost?.querySelector(".oa-solar-system");
  if (!modelHost || !side || !system2d) return;

  // The old implementation created eight model-viewer elements inside the
  // Solar System widget. 3D overview rendering is now exclusively WebGL/Three.js.
  modelHost.querySelector(".oa-solar-model3d")?.remove();

  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const strings = {
    ru: {
      loading: "Загружаем 3D-планеты…",
      ready: "3D-сцена готова",
      partial: "Часть моделей заменена объёмными резервными сферами.",
      legend: "Диаметры планет показаны в правильном относительном масштабе. Орбитальные расстояния сжаты для обзора.",
      selected: "3D-модель выбранной планеты",
      interactive: "вращайте модель",
      narration: "Аудиогид",
      play: "Воспроизвести",
      pause: "Пауза",
      stop: "Стоп",
      idle: "Нажмите ▶, чтобы прослушать рассказ о планете",
      playing: "Воспроизводится",
      paused: "Пауза",
      stopped: "Остановлено",
      unavailable: "Аудиозапись недоступна"
    },
    en: {
      loading: "Loading 3D planets…",
      ready: "3D scene ready",
      partial: "Some models use volumetric fallback spheres.",
      legend: "Planet diameters use the correct relative scale. Orbital distances are compressed for overview.",
      selected: "Selected planet 3D model",
      interactive: "drag to rotate",
      narration: "Audio guide",
      play: "Play",
      pause: "Pause",
      stop: "Stop",
      idle: "Press ▶ to hear the planet narration",
      playing: "Playing",
      paused: "Paused",
      stopped: "Stopped",
      unavailable: "Audio track unavailable"
    },
    tr: {
      loading: "3D gezegenler yükleniyor…",
      ready: "3D sahne hazır",
      partial: "Bazı modeller hacimsel yedek kürelerle gösteriliyor.",
      legend: "Gezegen çapları doğru göreli ölçekte gösterilir. Yörünge uzaklıkları genel görünüm için sıkıştırılmıştır.",
      selected: "Seçili gezegenin 3D modeli",
      interactive: "döndürmek için sürükleyin",
      narration: "Sesli anlatım",
      play: "Oynat",
      pause: "Duraklat",
      stop: "Durdur",
      idle: "Gezegen anlatımını dinlemek için ▶ düğmesine basın",
      playing: "Oynatılıyor",
      paused: "Duraklatıldı",
      stopped: "Durduruldu",
      unavailable: "Ses kaydı kullanılamıyor"
    }
  };
  const t = strings[locale] || strings.ru;

  const planets = {
    mercury: { src: "/assets/models/mercury.glb", diameter: 4879, color: 0xb7a48e },
    venus: { src: "/assets/models/venus.glb", diameter: 12104, color: 0xd6a256 },
    earth: { src: "/assets/models/earth.glb", diameter: 12742, color: 0x4ec6e8 },
    mars: { src: "/assets/models/mars.glb", diameter: 6779, color: 0xe77f59 },
    jupiter: { src: "/assets/models/jupiter.glb", diameter: 139820, color: 0xd8a06f },
    saturn: { src: "/assets/models/saturn.glb", diameter: 116460, color: 0xe4cb8b },
    uranus: { src: "/assets/models/uranus.glb", diameter: 50724, color: 0x8ac9d4 },
    neptune: { src: "/assets/models/neptune.glb", diameter: 49244, color: 0x4e72de }
  };
  const keys = Object.keys(planets);
  const maxDiameter = planets.jupiter.diameter;
  const jupiterDisplayDiameter = 1.55;
  const atlasBodies = new Set(["venus", "mars", "moon"]);

  const stage = document.createElement("div");
  stage.className = "oa-solar-webgl";
  stage.setAttribute("aria-label", "Interactive 3D Solar System");
  stage.innerHTML = `
    <div class="oa-solar-webgl__loading" role="status">${t.loading}</div>
    <div class="oa-solar-webgl__labels" aria-hidden="false"></div>
    <div class="oa-solar-webgl__legend">${t.legend}</div>`;
  modelHost.append(stage);

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", "3D Solar System planets");
  stage.prepend(canvas);
  const labelHost = stage.querySelector(".oa-solar-webgl__labels");
  const loadingLabel = stage.querySelector(".oa-solar-webgl__loading");

  const labels = new Map();
  keys.forEach(key => {
    const original = system2d.querySelector(`[data-planet="${key}"]`);
    const label = document.createElement("button");
    label.type = "button";
    label.className = "oa-solar-webgl__label";
    label.dataset.planet = key;
    label.textContent = original?.getAttribute("aria-label") || key;
    label.addEventListener("click", () => selectPlanet(key));
    labelHost.append(label);
    labels.set(key, label);
  });

  const detail = document.createElement("section");
  detail.className = "oa-solar-selected-3d";
  detail.innerHTML = `
    <div class="oa-solar-selected-3d__heading">
      <small>${t.selected}</small><span>${t.interactive}</span>
    </div>
    <model-viewer id="solarPlanetViewer" loading="eager" camera-controls auto-rotate interaction-prompt="none" shadow-intensity="0.25" exposure="1" environment-image="neutral"></model-viewer>
    <div class="oa-solar-audio">
      <div class="oa-solar-audio__top">
        <span class="oa-solar-audio__title">${t.narration}</span>
        <span class="oa-solar-audio__time"><span data-audio-current>0:00</span> / <span data-audio-duration>—:——</span></span>
      </div>
      <div class="oa-solar-audio__controls">
        <button class="oa-solar-audio__button" type="button" data-audio-play aria-label="${t.play}" title="${t.play}">▶</button>
        <button class="oa-solar-audio__button" type="button" data-audio-stop aria-label="${t.stop}" title="${t.stop}">■</button>
        <input class="oa-solar-audio__progress" data-audio-progress type="range" min="0" max="1000" value="0" aria-label="Audio progress">
      </div>
      <p class="oa-solar-audio__status" data-audio-status>${t.idle}</p>
      <audio data-audio preload="metadata"></audio>
    </div>`;
  side.append(detail);

  const viewer = detail.querySelector("#solarPlanetViewer");
  const audio = detail.querySelector("[data-audio]");
  const playButton = detail.querySelector("[data-audio-play]");
  const stopButton = detail.querySelector("[data-audio-stop]");
  const progress = detail.querySelector("[data-audio-progress]");
  const currentTimeEl = detail.querySelector("[data-audio-current]");
  const durationEl = detail.querySelector("[data-audio-duration]");
  const audioStatus = detail.querySelector("[data-audio-status]");
  const audioTitle = detail.querySelector(".oa-solar-audio__title");

  function ensureModelViewer() {
    if (window.customElements?.get("model-viewer")) return;
    if (document.querySelector("script[data-solar-detail-model-viewer]")) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.0/model-viewer.min.js";
    script.crossOrigin = "anonymous";
    script.dataset.solarDetailModelViewer = "true";
    script.onerror = () => {
      const fallback = document.createElement("script");
      fallback.type = "module";
      fallback.src = "/assets/js/model-viewer.min.js";
      fallback.dataset.solarDetailModelViewer = "true";
      document.head.append(fallback);
    };
    document.head.append(script);
  }
  ensureModelViewer();

  function fmt(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "—:——";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  function audioBase() {
    if (locale === "en") return "/eng/assets/audio/pro/models/";
    if (locale === "ru" && location.pathname.startsWith("/rus/")) return "/rus/assets/audio/pro/models/";
    return "/assets/audio/pro/models/";
  }

  let currentPlanet = "earth";
  function resetAudio() {
    audio.pause();
    audio.currentTime = 0;
    progress.value = "0";
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "—:——";
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", t.play);
    audioStatus.className = "oa-solar-audio__status";
    audioStatus.textContent = t.idle;
  }

  function setAudioPlanet(key, name) {
    resetAudio();
    audio.src = `${audioBase()}${key}.mp3`;
    audioTitle.textContent = `${t.narration} · ${name}`;
    audio.load();
  }

  audio.addEventListener("loadedmetadata", () => { durationEl.textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    currentTimeEl.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener("play", () => {
    playButton.textContent = "❚❚";
    playButton.setAttribute("aria-label", t.pause);
    audioStatus.className = "oa-solar-audio__status is-playing";
    audioStatus.textContent = t.playing;
  });
  audio.addEventListener("pause", () => {
    if (audio.currentTime > 0 && !audio.ended) {
      playButton.textContent = "▶";
      playButton.setAttribute("aria-label", t.play);
      audioStatus.className = "oa-solar-audio__status";
      audioStatus.textContent = t.paused;
    }
  });
  audio.addEventListener("ended", () => {
    resetAudio();
    audioStatus.textContent = t.stopped;
  });
  audio.addEventListener("error", () => {
    playButton.textContent = "▶";
    audioStatus.className = "oa-solar-audio__status is-error";
    audioStatus.textContent = t.unavailable;
  });
  playButton.addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => {
      audioStatus.className = "oa-solar-audio__status is-error";
      audioStatus.textContent = t.unavailable;
    });
    else audio.pause();
  });
  stopButton.addEventListener("click", () => {
    resetAudio();
    audioStatus.textContent = t.stopped;
  });
  progress.addEventListener("input", () => {
    if (audio.duration) audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
  });

  // --- Three.js overview scene ------------------------------------------------
  let renderer;
  let scene;
  let camera;
  let root3d;
  let animationFrame = 0;
  let hasLoaded = false;
  let loadingPromise = null;
  let failedModels = 0;
  const planetNodes = new Map();
  const hitTargets = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const loader = new GLTFLoader();

  function buildRenderer() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(39, 1, 0.03, 60);
    camera.position.set(0, 10.4, 12.8);
    camera.lookAt(0, 0, 0);

    root3d = new THREE.Group();
    scene.add(root3d);
    scene.add(new THREE.HemisphereLight(0x9fdcf0, 0x0b1018, 1.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(-4, 7, 5);
    scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0x4bd8ff, 1.25);
    rim.position.set(8, 3, -8);
    scene.add(rim);

    // The Sun is deliberately compressed; the legend explicitly states that
    // orbital overview distances are compressed. Planet-to-planet diameters
    // remain physically proportional.
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 48, 32),
      new THREE.MeshStandardMaterial({ color: 0xffb44a, emissive: 0xff7a16, emissiveIntensity: 2.1, roughness: .62 })
    );
    sun.position.y = 0.02;
    root3d.add(sun);

    const glow = new THREE.PointLight(0xffa63c, 4.2, 14, 1.4);
    glow.position.set(0, 1, 0);
    root3d.add(glow);

    [1.35, 2.05, 2.75, 3.55, 4.55, 5.45, 6.25, 7.05].forEach(radius => {
      const points = [];
      for (let i = 0; i < 128; i += 1) {
        const a = (i / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0x345262, transparent: true, opacity: .34 }));
      root3d.add(line);
    });

    resizeRenderer();
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("pointerdown", beginDrag);
    window.addEventListener("resize", resizeRenderer, { passive: true });
  }

  function resizeRenderer() {
    if (!renderer || !camera) return;
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function makeFallback(key) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(.5, 32, 22),
      new THREE.MeshStandardMaterial({ color: planets[key].color, roughness: .72, metalness: .02 })
    );
  }

  function normalizePlanetObject(object, key) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const minBodyAxis = Math.max(.0001, Math.min(size.x || Infinity, size.y || Infinity, size.z || Infinity));
    const targetDiameter = (planets[key].diameter / maxDiameter) * jupiterDisplayDiameter;
    const content = new THREE.Group();
    object.position.sub(center);
    object.scale.setScalar(targetDiameter / minBodyAxis);
    content.add(object);
    return { content, targetDiameter };
  }

  async function loadPlanet(key) {
    let object;
    try {
      const gltf = await loader.loadAsync(planets[key].src);
      object = gltf.scene || gltf.scenes?.[0];
      if (!object) throw new Error("Empty GLB scene");
    } catch (error) {
      console.warn(`[Orbital Solar] ${key} GLB unavailable`, error);
      failedModels += 1;
      object = makeFallback(key);
    }

    const { content, targetDiameter } = normalizePlanetObject(object, key);
    const pivot = new THREE.Group();
    pivot.userData.planet = key;
    pivot.add(content);

    const hitRadius = Math.max(targetDiameter * .65, .25);
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(hitRadius, 16, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.userData.planet = key;
    pivot.add(hit);
    hitTargets.push(hit);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(targetDiameter * .65, .16), Math.max(targetDiameter * .76, .21), 40),
      new THREE.MeshBasicMaterial({ color: 0x55e6f3, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -.02;
    halo.visible = false;
    pivot.add(halo);
    pivot.userData.halo = halo;
    pivot.userData.spin = .00045 + Math.random() * .0005;
    pivot.userData.content = content;

    root3d.add(pivot);
    planetNodes.set(key, pivot);
    updatePlanetPosition(key, pivot);
  }

  function updatePlanetPosition(key, node) {
    const source = system2d.querySelector(`[data-planet="${key}"]`);
    if (!source) return;
    const style = getComputedStyle(source);
    const left = parseFloat(style.getPropertyValue("--left")) || 50;
    const top = parseFloat(style.getPropertyValue("--top")) || 50;
    const x = ((left - 50) / 50) * 7.05;
    const z = ((top - 50) / 50) * 7.05;
    node.position.set(x, .16, z);
  }

  async function ensure3dLoaded() {
    if (hasLoaded) return;
    if (loadingPromise) return loadingPromise;
    buildRenderer();
    loadingPromise = (async () => {
      // Stagger the requests slightly so first paint is not blocked by eight GLBs.
      for (let i = 0; i < keys.length; i += 1) {
        await loadPlanet(keys[i]);
        loadingLabel.textContent = `${t.loading} ${i + 1}/${keys.length}`;
      }
      hasLoaded = true;
      loadingLabel.textContent = failedModels ? t.partial : t.ready;
      loadingLabel.classList.add(failedModels ? "is-error" : "is-ready");
      syncSelectedPlanet();
      animate();
    })();
    return loadingPromise;
  }

  function activeKey() {
    return keys.find(key => system2d.querySelector(`[data-planet="${key}"]`)?.classList.contains("is-active")) || currentPlanet || "earth";
  }

  function planetName(key) {
    return system2d.querySelector(`[data-planet="${key}"]`)?.getAttribute("aria-label") || key;
  }

  function syncUrlForPlanet(key) {
    const url = new URL(location.href);
    const body = String(url.searchParams.get("body") || "").toLowerCase();
    if (atlasBodies.has(body)) return;
    url.searchParams.set("planet", key);
    history.replaceState(history.state, "", url);
  }

  function selectPlanet(key) {
    const original = system2d.querySelector(`[data-planet="${key}"]`);
    if (!original) return;
    original.click();
    syncUrlForPlanet(key);
    requestAnimationFrame(syncSelectedPlanet);
  }

  function syncSelectedPlanet() {
    const key = activeKey();
    if (!planets[key]) return;
    currentPlanet = key;
    const name = planetName(key);
    labels.forEach((label, labelKey) => label.classList.toggle("is-active", labelKey === key));
    planetNodes.forEach((node, nodeKey) => { if (node.userData.halo) node.userData.halo.visible = nodeKey === key; });
    if (viewer.getAttribute("src") !== planets[key].src) viewer.setAttribute("src", planets[key].src);
    viewer.setAttribute("alt", `${name} 3D`);
    if (!audio.src || !decodeURIComponent(audio.src).endsWith(`/${key}.mp3`)) setAudioPlanet(key, name);
  }

  function syncMode() {
    const is3d = modelHost.classList.contains("oa-solar-model--3d");
    side.classList.toggle("is-3d", is3d);
    if (is3d) {
      ensure3dLoaded().then(() => resizeRenderer()).catch(error => {
        console.error("[Orbital Solar] 3D initialization failed", error);
        loadingLabel.textContent = t.partial;
        loadingLabel.classList.add("is-error");
      });
      syncSelectedPlanet();
    } else {
      audio.pause();
    }
  }

  document.querySelectorAll("[data-model]").forEach(button => button.addEventListener("click", () => requestAnimationFrame(syncMode)));
  modelHost.addEventListener("click", event => {
    if (event.target.closest("[data-planet]")) requestAnimationFrame(syncSelectedPlanet);
  });

  const selectionObserver = new MutationObserver(() => syncSelectedPlanet());
  system2d.querySelectorAll("[data-planet]").forEach(button => selectionObserver.observe(button, { attributes: true, attributeFilter: ["class"] }));

  function onCanvasClick(event) {
    if (!camera || !renderer) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    const key = hit?.object?.userData?.planet;
    if (key) selectPlanet(key);
  }

  let dragging = false;
  let dragX = 0;
  let dragRotation = 0;
  function beginDrag(event) {
    if (!root3d || event.button !== 0) return;
    dragging = true;
    dragX = event.clientX;
    dragRotation = root3d.rotation.y;
    canvas.setPointerCapture?.(event.pointerId);
    const move = moveEvent => {
      if (!dragging) return;
      root3d.rotation.y = dragRotation + (moveEvent.clientX - dragX) * .006;
    };
    const end = () => {
      dragging = false;
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  const projected = new THREE.Vector3();
  function updateLabels() {
    if (!camera || !renderer) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    planetNodes.forEach((node, key) => {
      node.getWorldPosition(projected);
      projected.project(camera);
      const label = labels.get(key);
      if (!label) return;
      label.style.left = `${(projected.x * .5 + .5) * width}px`;
      label.style.top = `${(-projected.y * .5 + .5) * height}px`;
      label.style.display = projected.z > 1 ? "none" : "block";
    });
  }

  function animate() {
    cancelAnimationFrame(animationFrame);
    const frame = () => {
      animationFrame = requestAnimationFrame(frame);
      if (!renderer || !scene || !camera) return;
      planetNodes.forEach((node, key) => {
        updatePlanetPosition(key, node);
        const content = node.userData.content;
        if (content) content.rotation.y += node.userData.spin || .0006;
      });
      updateLabels();
      renderer.render(scene, camera);
    };
    frame();
  }

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
    selectionObserver.disconnect();
    audio.pause();
    renderer?.dispose();
  }, { once: true });

  syncSelectedPlanet();
  syncMode();
})();
