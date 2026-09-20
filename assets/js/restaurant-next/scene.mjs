import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {CONFIG} from './config.mjs?v=0.1.0';
import {SurfaceTracker, PinchFilter, clamp, distance, gestureDelta} from './math.mjs?v=0.1.0';
import {RestaurantXR} from './xr-session.mjs?v=0.1.0';

export function disposeObject(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root?.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    for (const mat of Array.isArray(node.material) ? node.material : [node.material]) if (mat) {
      materials.add(mat);
      for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const texture of textures) { texture.dispose(); texture.source?.data?.close?.(); }
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
}

export class RestaurantScene {
  constructor({host, overlay, interaction, onState, onStats}) {
    Object.assign(this, {host, overlay, interaction, onState, onStats});
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG.pixelRatio));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.xr.enabled = true;
    this.draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/gltf/').setWorkerLimit(1);
    this.loader = new GLTFLoader().setDRACOLoader(this.draco);
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    room.dispose(); pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 30);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8476, 1));
    this.root = new THREE.Group(); this.root.visible = false; this.scene.add(this.root);
    const ring = new THREE.RingGeometry(0.065, 0.079, 48).rotateX(-Math.PI / 2);
    this.reticle = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({color: 0x79f0cd, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false}));
    this.reticle.visible = false; this.scene.add(this.reticle);
    this.grid = new THREE.GridHelper(0.3, 6, 0x79f0cd, 0x79f0cd);
    this.grid.material.transparent = true; this.grid.material.opacity = 0.25;
    this.reticle.add(this.grid);
    this.surface = new SurfaceTracker();
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.pointers = new Map(); this.previous = null; this.handPrevious = null;
    this.handFilters = new Map(); this.xrHandPrevious = null;
    this.mode = 'idle'; this.placed = false; this.ready = false; this.loading = 0;
    this.interactive = true; this.scale = 1; this.yaw = 0; this.hasPose = false;
    this.stats = {fps: 0, drawCalls: 0, triangles: 0, hands: 0, gesture: 'none', mode: '3d'};
    this.xr = new RestaurantXR({xr: navigator.xr, renderer: this.renderer, overlay,
      onFrame: (...args) => this.frame(...args), onState: state => this.xrState(state)});
    this.abort = new AbortController();
    const signal = this.abort.signal;
    overlay.addEventListener('beforexrselect', event => event.preventDefault(), {signal});
    interaction.addEventListener('pointerdown', event => this.pointerDown(event), {signal});
    interaction.addEventListener('pointermove', event => this.pointerMove(event), {signal});
    interaction.addEventListener('pointerup', event => this.pointerUp(event), {signal});
    interaction.addEventListener('pointercancel', event => this.pointerUp(event, true), {signal});
    interaction.addEventListener('lostpointercapture', event => this.pointerUp(event, true), {signal});
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }
  resize() {
    if (this.renderer.xr.isPresenting) return;
    const {width, height} = this.host.getBoundingClientRect();
    this.renderer.setSize(Math.max(1, width), Math.max(1, height));
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }
  async setDish(dish, onProgress = () => {}) {
    const token = ++this.loading;
    this.ready = false; this.root.visible = false; this.release();
    const gltf = await this.loader.loadAsync(dish.src, event => {
      if (token === this.loading) onProgress(event.total ? event.loaded / event.total : 0);
    });
    if (token !== this.loading) { disposeObject(gltf.scene); return false; }
    disposeObject(this.model); this.root.clear();
    this.model = new THREE.Group();
    const orientation = dish.orientation.split(/\s+/).map(v => parseFloat(v) * Math.PI / 180);
    // model-viewer orientation is roll (Z), pitch (X), yaw (Y).
    this.model.rotation.set(orientation[1], orientation[2], orientation[0], 'YXZ');
    this.model.scale.setScalar(dish.modelScale);
    this.model.add(gltf.scene);
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    if (![size.x, size.y, size.z].every(Number.isFinite) || size.length() === 0) {
      disposeObject(this.model); this.model = null; throw new Error('Empty model');
    }
    this.model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    this.radius = Math.max(size.x, size.y, size.z) / 2;
    this.root.add(this.model);
    this.renderer.toneMappingExposure = dish.exposure;
    this.dish = dish; this.ready = true;
    this.resetTransform(); this.root.visible = this.placed;
    if (this.mode === 'camera') this.framePreview();
    return true;
  }
  startAR() {
    this.mode = 'xr'; this.placed = false; this.root.visible = false;
    this.surface.reset(); this.hasPose = false; this.release();
    this.scanStart = performance.now();
    return this.xr.start().catch(error => { this.mode = 'idle'; throw error; });
  }
  xrState(state) {
    if (state === 'ended') {
      this.mode = 'idle'; this.placed = false; this.reticle.visible = false;
      this.root.visible = false; this.hasPose = false; this.release(); this.resize();
    }
    if (state === 'reset') this.rescan();
    if (state === 'interrupted') { this.surface.reset(); this.release(); this.hasPose = false; }
    this.onState(state);
  }
  frame(time, frame, reference, source) {
    const pose = frame.getViewerPose(reference);
    const tracked = Boolean(pose && !pose.emulatedPosition && frame.session.visibilityState !== 'hidden');
    if (tracked !== this.hasPose) { this.hasPose = tracked; this.release(); this.onState(tracked ? (this.placed ? 'placed' : 'scanning') : 'tracking-lost'); }
    if (!this.placed && tracked) {
      const hit = frame.getHitTestResults(source).map(hit => hit.getPose(reference)).find(p => p?.transform.matrix[5] >= Math.cos(Math.PI / 9));
      const wasReady = this.surface.ready;
      this.surface.update(hit?.transform.matrix, time);
      this.reticle.visible = Boolean(this.surface.position);
      if (this.surface.position) {
        this.reticle.position.copy(this.surface.position); this.reticle.position.y += 0.002;
        this.reticle.material.opacity = this.surface.ready ? 0.95 : 0.35;
      }
      if (this.surface.ready !== wasReady) this.onState(this.surface.ready ? 'found' : 'scanning');
      if (!this.surface.ready && time - this.scanStart > 15000) { this.scanStart = time; this.onState('scan-help'); }
    } else if (!tracked) { this.surface.reset(); this.reticle.visible = false; }
    this.root.visible = this.placed && this.ready && tracked;
    this.updateXRHands(frame, reference, tracked);
    this.renderer.render(this.scene, this.camera);
    this.measure(time);
  }
  place() {
    if (!this.ready || this.placed || !this.hasPose || !this.surface.ready) return false;
    this.root.position.copy(this.surface.position);
    this.plane.constant = -this.root.position.y;
    this.placed = true; this.root.visible = true; this.reticle.visible = false;
    this.release(); this.onState('placed');
    return true;
  }
  rescan() {
    this.placed = false; this.root.visible = false; this.surface.reset(); this.reticle.visible = false;
    this.release(); this.scanStart = performance.now(); this.onState('scanning');
  }
  resetTransform() { this.scale = 1; this.yaw = 0; this.applyTransform(); this.release(); }
  applyTransform() {
    this.scale = clamp(this.scale, CONFIG.minScale, CONFIG.maxScale);
    this.root.scale.setScalar(this.scale); this.root.rotation.y = this.yaw;
  }
  cameraForInput() {
    if (!this.renderer.xr.isPresenting) return this.camera;
    const camera = this.renderer.xr.getCamera();
    return camera.cameras[0] || camera;
  }
  rayAt(x, y) {
    const rect = this.interaction.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), this.cameraForInput());
  }
  hitsDish(x, y) {
    if (!this.placed || !this.ready || !this.interactive || !this.hasPose) return false;
    this.root.updateMatrixWorld(true); this.rayAt(x, y);
    return this.raycaster.intersectObject(this.root, true).length > 0;
  }
  worldAt(x, y) {
    this.rayAt(x, y);
    const result = this.raycaster.ray.intersectPlane(this.plane, new THREE.Vector3());
    return result && result.distanceTo(this.raycaster.ray.origin) < 5 ? result : null;
  }
  manipulate(previous, current) {
    if (!this.ready || !this.placed || !this.interactive || !this.hasPose) return;
    const delta = gestureDelta(previous, current);
    if (!delta) return;
    const center = points => ({x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length});
    const before = center(previous), after = center(current);
    const a = this.worldAt(before.x, before.y), b = this.worldAt(after.x, after.y);
    if (a && b && a.distanceTo(b) < 0.3) this.root.position.add(b.sub(a));
    this.scale *= delta.scale; this.yaw -= delta.angle; this.applyTransform();
  }
  pointerDown(event) {
    if (!this.interactive || !this.hasPose) return;
    if (this.pointers.size >= 2) return;
    if (this.placed && !this.pointers.size && !this.hitsDish(event.clientX, event.clientY)) return;
    event.preventDefault(); this.interaction.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, {id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY});
    this.hadMultiTouch ||= this.pointers.size > 1;
    this.previous = [...this.pointers.values()].map(p => ({...p}));
  }
  pointerMove(event) {
    const p = this.pointers.get(event.pointerId); if (!p) return;
    event.preventDefault(); p.x = event.clientX; p.y = event.clientY;
    const current = [...this.pointers.values()].map(p => ({...p}));
    this.manipulate(this.previous, current); this.previous = current;
  }
  pointerUp(event, cancelled = false) {
    const p = this.pointers.get(event.pointerId); if (!p) return;
    if (!cancelled && !this.hadMultiTouch && Math.hypot(event.clientX - p.startX, event.clientY - p.startY) < 12) this.place();
    this.pointers.delete(event.pointerId); this.previous = null;
    if (!this.pointers.size) this.hadMultiTouch = false;
  }
  release() { this.pointers.clear(); this.previous = null; this.handPrevious = null; this.xrHandPrevious = null; this.hadMultiTouch = false; }
  setInteractive(value) { this.interactive = value; this.release(); }
  startCamera() {
    if (this.xr.session || this.xr.pending) throw new Error('XR owns the camera');
    this.mode = 'camera'; this.hasPose = true; this.placed = true;
    this.root.position.set(0, 0, 0); this.plane.constant = 0;
    this.root.visible = this.ready; this.reticle.visible = false;
    this.resetTransform(); this.resize(); this.framePreview();
    this.renderer.setAnimationLoop(time => { this.renderer.render(this.scene, this.camera); this.measure(time); });
  }
  framePreview() {
    const d = Math.max(0.4, (this.radius || 0.2) * 4 / Math.min(1, this.camera.aspect));
    this.camera.position.set(0, d * 0.65, d);
    this.camera.lookAt(0, (this.radius || 0.2) * 0.35, 0); this.camera.updateMatrixWorld();
  }
  cameraHands(hands) {
    this.stats.hands = hands.length;
    const pressed = hands.filter(h => h.pressed).slice(0, 2).sort((a, b) => a.id - b.id);
    if (!this.handPrevious?.length && pressed.length && !this.hitsDish(pressed[0].x, pressed[0].y)) return;
    this.manipulate(this.handPrevious, pressed);
    this.handPrevious = pressed.length ? pressed.map(h => ({...h})) : null;
    this.stats.gesture = pressed.length > 1 ? 'two-hand scale / rotate' : pressed.length ? 'pinch / move' : 'none';
  }
  updateXRHands(frame, reference, tracked) {
    const hands = [];
    for (const source of frame.session.inputSources) {
      if (!source.hand) continue;
      const tip = frame.getJointPose(source.hand.get('index-finger-tip'), reference);
      const thumb = frame.getJointPose(source.hand.get('thumb-tip'), reference);
      if (!tip || !thumb || !tracked) continue;
      let filter = this.handFilters.get(source);
      if (!filter) { filter = new PinchFilter({close: 0.022, open: 0.032}); this.handFilters.set(source, filter); }
      hands.push({source, p: new THREE.Vector3().copy(tip.transform.position), pressed: filter.update(distance(tip.transform.position, thumb.transform.position))});
    }
    for (const source of this.handFilters.keys()) if (!hands.some(h => h.source === source)) this.handFilters.delete(source);
    if (this.mode !== 'xr') return;
    this.stats.hands = hands.length;
    this.stats.xrHands = [...frame.session.inputSources].some(s => Boolean(s.hand));
    const active = hands.filter(h => h.pressed);
    if (!this.interactive || !this.placed || !tracked || !this.ready || !active.length) { this.xrHandPrevious = null; this.stats.gesture = 'none'; return; }
    if (!this.xrHandPrevious) {
      const bounds = new THREE.Box3().setFromObject(this.root).expandByScalar(0.1);
      if (!active.some(h => bounds.containsPoint(h.p))) return;
    } else if (active.length === this.xrHandPrevious.length && active.every((h, i) => h.source === this.xrHandPrevious[i].source)) {
      const centroid = list => list.reduce((sum, h) => sum.add(h.p), new THREE.Vector3()).multiplyScalar(1 / list.length);
      const delta = centroid(active).sub(centroid(this.xrHandPrevious));
      if (delta.length() < 0.25) { delta.y = 0; this.root.position.add(delta); }
      if (active.length === 2) {
        const a = this.xrHandPrevious[1].p.clone().sub(this.xrHandPrevious[0].p), b = active[1].p.clone().sub(active[0].p);
        if (a.length() > 0.06) this.scale *= clamp(b.length() / a.length(), 0.8, 1.25);
        const difference = Math.atan2(b.z, b.x) - Math.atan2(a.z, a.x);
        this.yaw -= Math.atan2(Math.sin(difference), Math.cos(difference));
      }
      this.applyTransform();
    }
    this.xrHandPrevious = active;
    this.stats.gesture = active.length > 1 ? 'two-hand scale / rotate' : 'pinch / move';
  }
  measure(time) {
    this.frameCount = (this.frameCount || 0) + 1;
    this.statsStart ??= time;
    if (time - this.statsStart < 500) return;
    Object.assign(this.stats, {fps: Math.round(this.frameCount * 1000 / (time - this.statsStart)), drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures, mode: this.mode, scale: this.scale});
    this.frameCount = 0; this.statsStart = time; this.onStats({...this.stats});
  }
  async stop() {
    await this.xr.stop(); this.renderer.setAnimationLoop(null);
    this.mode = 'idle'; this.root.visible = false; this.reticle.visible = false; this.placed = false; this.release();
  }
  dispose() {
    ++this.loading; void this.stop(); this.abort.abort(); this.resizeObserver.disconnect();
    disposeObject(this.model); disposeObject(this.reticle); this.environment.dispose();
    this.draco.dispose();
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
