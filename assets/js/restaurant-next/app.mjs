import {CONFIG, detectCapabilities} from './config.mjs?v=0.1.0';
import {categories, dishes} from './catalog.mjs?v=0.1.0';
import {localize} from './i18n.mjs?v=0.1.0';
import {checkSession, consumeToken, rememberReturn} from './auth.mjs?v=0.1.0';

const $ = id => document.getElementById(id);
const language = document.documentElement.lang;
const t = localize(language);
const app = $('next-app'), viewer = $('dish-viewer'), overlay = $('overlay');
let selected = dishes[0], category = categories[0].id, mode = 'preview';
let capabilities = {}, scene, scenePromise, handTracker, handBusy = false;
let loaded = false, authorized = false, preferNative = false, loadingTimer, modelRequest = 0, operation = 0;
let facingMode = /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'environment' : 'user';
const stats = {mode: '3d', fps: '—', hitTest: 'not tested', xrHands: 'not tested', hands: 0, gesture: 'none', scale: 1};
let sceneDishId = '', loadScenePromise;

for (const node of document.querySelectorAll('[data-copy]')) node.textContent = t[node.dataset.copy] || node.textContent;
$('login-link').addEventListener('click', rememberReturn);
$('lab-toggle').hidden = !CONFIG.lab || new URLSearchParams(location.search).get('lab') === '0';

function status(title, detail = '', busy = false) {
  $('status-title').textContent = title; $('status-detail').textContent = detail;
  $('status').dataset.busy = String(busy);
}
function setMode(next) {
  mode = next; app.dataset.mode = next;
  $('scene-host').hidden = next === 'preview'; viewer.hidden = next !== 'preview';
  $('camera-video').hidden = next !== 'camera'; $('interaction').hidden = next === 'preview';
  $('exit').hidden = next === 'preview'; $('start-ar').hidden = next !== 'preview';
  $('hands-toggle').hidden = next === 'xr'; $('camera-note').hidden = next !== 'camera';
  $('camera-flip').hidden = next !== 'camera'; $('manipulation').hidden = next === 'preview';
  $('rescan').hidden = next !== 'xr'; $('place').hidden = true;
  $('hands-toggle').textContent = next === 'camera' ? t.stopHands : t.hands;
  stats.mode = next === 'preview' ? '3d' : next;
  refreshButtons();
}
function refreshButtons() {
  $('start-ar').disabled = !loaded || !authorized || handBusy;
  $('hands-toggle').disabled = !loaded || !authorized || handBusy || !capabilities.camera;
  $('start-ar').textContent = preferNative && viewer.canActivateAR ? t.native : t.start;
}
function menu(open) {
  $('menu-panel').hidden = !open; $('menu-toggle').setAttribute('aria-expanded', String(open));
  scene?.setInteractive(!open);
  if (open) $('menu-close').focus(); else $('menu-toggle').focus({preventScroll: true});
}
function renderMenu() {
  $('categories').replaceChildren(...categories.map(c => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = c.label[language] || c.label.tr;
    b.setAttribute('aria-pressed', String(category === c.id));
    b.onclick = () => { category = c.id; renderMenu(); }; return b;
  }));
  $('dishes').replaceChildren(...dishes.filter(d => d.category === category).map(d => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dish';
    b.setAttribute('aria-pressed', String(d.id === selected.id));
    const img = document.createElement('img'); img.src = d.poster; img.alt = ''; img.loading = 'lazy'; img.width = 80; img.height = 80;
    const description = d.copy[language] || d.copy.tr;
    const text = document.createElement('span'), name = document.createElement('strong'), small = document.createElement('small');
    name.textContent = description.name; small.textContent = description.description; text.append(name, small);
    const price = document.createElement('span'); price.className = 'price'; price.textContent = d.price;
    b.append(img, text, price); b.onclick = () => {
      menu(false);
      // Setting the same src does not emit another model-viewer load event.
      if (d.id !== selected.id || !loaded) void selectDish(d);
    }; return b;
  }));
}
function showDishInfo() {
  const copy = selected.copy[language] || selected.copy.tr;
  $('dish-name').textContent = copy.name; $('dish-description').textContent = copy.description;
  $('dish-price').textContent = selected.price;
  viewer.alt = copy.alt; viewer.poster = selected.poster; viewer.exposure = selected.exposure;
  viewer.orientation = selected.orientation;
  viewer.scale = `${selected.modelScale} ${selected.modelScale} ${selected.modelScale}`;
  viewer.cameraOrbit = '25deg 68deg auto';
}
async function selectDish(dish, retry = false) {
  const request = ++modelRequest; selected = dish; loaded = false;
  stats.scale = 1; showDishInfo(); renderMenu(); refreshButtons();
  $('retry').hidden = true; $('load-progress').hidden = false; $('load-progress').value = 0;
  status(t.loading, '', true);
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => { if (request === modelRequest && !loaded) modelError(); }, 45000);
  if (mode !== 'preview' && scene) {
    try {
      sceneDishId = '';
      const ready = await scene.setDish(dish, p => { $('load-progress').value = p; });
      if (request !== modelRequest || !ready) return;
      sceneDishId = dish.id; modelReady();
    } catch (error) { if (request === modelRequest) modelError(error); }
  } else {
    viewer.src = dish.src + (retry ? `&retry=${Date.now()}` : '');
  }
}
function modelReady() {
  clearTimeout(loadingTimer); loaded = true; $('load-progress').hidden = true; $('retry').hidden = true;
  refreshButtons();
  if (mode === 'camera') status(t.preview, t.cameraHint);
  else if (mode === 'xr') status(scene?.placed ? t.placed : t.scan, scene?.placed ? t.controls : '');
  else status(t.preview, t.previewDetail);
}
function modelError(error) {
  clearTimeout(loadingTimer); loaded = false; $('load-progress').hidden = true; $('retry').hidden = false;
  status(t.modelError); refreshButtons();
  if (error) console.warn('Restaurant Next model load:', error.message);
}
async function ensureScene() {
  if (!scenePromise) scenePromise = import('./scene.mjs?v=0.1.0').then(({RestaurantScene}) => {
    scene = new RestaurantScene({host: $('scene-host'), overlay, interaction: $('interaction'), onState: onSceneState, onStats: data => {
      Object.assign(stats, data);
      if (document.activeElement !== $('scale')) $('scale').value = scene.scale;
      if (document.activeElement !== $('rotation')) $('rotation').value = Math.atan2(Math.sin(scene.yaw), Math.cos(scene.yaw)) * 180 / Math.PI;
    }});
    return scene;
  }).catch(error => { scenePromise = null; throw error; });
  return scenePromise;
}
async function prepareScene() {
  await ensureScene();
  if (sceneDishId === selected.id && scene.ready) return;
  const dish = selected;
  if (!loadScenePromise || loadScenePromise.id !== dish.id) {
    const promise = scene.setDish(dish).then(ready => {
      if (ready && selected.id === dish.id) sceneDishId = dish.id;
    }).finally(() => {
      // Reuse an in-flight request only. Camera-mode menu changes can replace
      // the scene after a previous preparation has already finished.
      if (loadScenePromise?.promise === promise) loadScenePromise = null;
    });
    loadScenePromise = {id: dish.id, promise};
  }
  await loadScenePromise.promise;
  if (sceneDishId !== selected.id) throw new Error('Selection changed');
}
function onSceneState(state) {
  if (state === 'started') { setMode('xr'); stats.hitTest = true; status(t.scan); }
  if (state === 'ended') { if (mode === 'xr') void exitMode(); return; }
  if (state === 'tracking-lost' || state === 'interrupted') { $('place').hidden = true; status(t.lost, t.lostDetail); }
  if (state === 'scanning' || state === 'reset') { $('place').hidden = true; status(t.scan); }
  if (state === 'found') { $('place').hidden = false; status(t.found, t.foundDetail); }
  if (state === 'placed') { $('place').hidden = true; status(t.placed, t.controls); }
  if (state === 'scan-help') status(t.scan, t.timeout);
}
function nativeFallback() {
  preferNative = true; refreshButtons();
  status(t.fallback, viewer.canActivateAR ? t.fallbackNative : t.fallbackDetail);
}
function startAR() {
  if (!loaded || !authorized || mode !== 'preview' || handBusy) return;
  menu(false);
  if (!capabilities.immersive || preferNative) {
    if (viewer.canActivateAR) {
      status(t.preparing);
      // Call directly inside the click; native viewers also require activation.
      void Promise.resolve(viewer.activateAR()).catch(nativeFallback);
    } else nativeFallback();
    return;
  }
  if (!scene?.ready || sceneDishId !== selected.id) {
    $('start-ar').disabled = true; status(t.preparing, '', true);
    void prepareScene().then(() => { refreshButtons(); status(t.preview, t.start); }).catch(nativeFallback);
    return;
  }
  const op = ++operation;
  $('start-ar').disabled = true; $('hands-toggle').disabled = true; status(t.preparing, '', true);
  void scene.startAR().catch(error => {
    if (op !== operation) return;
    console.warn('Restaurant Next AR:', error.name);
    setMode('preview'); nativeFallback();
  });
}
async function exitMode() {
  ++operation; handBusy = false;
  handTracker?.stop();
  // Change mode before awaiting session.end to avoid an end-event recursion.
  setMode('preview');
  await scene?.stop();
  $('cursors').replaceChildren();
  showDishInfo();
  // The inline viewer stays mounted but does not load other dishes during XR.
  if (viewer.src.split('?')[0].endsWith(selected.src.split('?')[0]) && viewer.loaded) modelReady();
  else await selectDish(selected);
}
async function startHands() {
  if (mode === 'camera' || handBusy) { await exitMode(); return; }
  if (!authorized || !loaded || mode === 'xr') return;
  const op = ++operation; handBusy = true; refreshButtons();
  $('exit').hidden = false; status(t.cameraPreparing, t.privacy, true);
  try {
    await prepareScene();
    if (op !== operation) return;
    const {CameraHands} = await import('./hands.mjs?v=0.1.0');
    if (op !== operation) return;
    handTracker ||= new CameraHands({video: $('camera-video'), bounds: $('interaction'),
      onHands: hands => { scene?.cameraHands(hands); drawCursors(hands); },
      onStats: data => Object.assign(stats, data),
      onError: error => { console.warn('Restaurant Next hands:', error.message); void exitMode().then(() => status(t.cameraError)); },
    });
    setMode('camera'); scene.startCamera();
    const ready = await handTracker.start(facingMode);
    if (op !== operation || !ready) return;
    handBusy = false; refreshButtons(); status(t.preview, t.cameraHint);
  } catch (error) {
    if (op !== operation) return;
    await exitMode(); status(t.cameraError); console.warn('Restaurant Next camera:', error.message);
  }
}
function drawCursors(hands) {
  $('cursors').replaceChildren(...hands.map(hand => {
    const cursor = document.createElement('span'); cursor.className = 'hand-cursor' + (hand.pressed ? ' pressed' : '');
    cursor.style.transform = `translate(${hand.x}px, ${hand.y}px)`; return cursor;
  }));
}
function renderLab() {
  if ($('lab-panel').hidden) return;
  const data = {WebXR: Boolean(capabilities.immersive), 'Hit test': stats.hitTest,
    'XR hand input': stats.xrHands, 'Camera hands': Boolean(handTracker?.running),
    'AR mode': stats.mode, FPS: mode === 'preview' ? 'viewer controlled' : stats.fps,
    'Detected hands': stats.hands, Gesture: stats.gesture, Dish: selected.id,
    'Authored scale': selected.modelScale, 'User scale': Number(stats.scale || 1).toFixed(2),
    'Draw calls': stats.drawCalls ?? '—', Triangles: stats.triangles ?? '—',
    Textures: stats.textures ?? '—', 'Inference ms': stats.inferenceMs ?? '—'};
  $('lab-values').replaceChildren(...Object.entries(data).flatMap(([key, value]) => {
    const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = String(value); return [dt, dd];
  }));
}
$('menu-toggle').onclick = () => menu($('menu-panel').hidden);
$('menu-close').onclick = () => menu(false);
$('start-ar').onclick = startAR;
$('place').onclick = () => scene?.place();
$('rescan').onclick = () => scene?.rescan();
$('reset').onclick = () => scene?.resetTransform();
$('exit').onclick = () => void exitMode();
$('hands-toggle').onclick = () => void startHands();
$('camera-flip').onclick = async () => { await exitMode(); facingMode = facingMode === 'user' ? 'environment' : 'user'; await startHands(); };
$('retry').onclick = () => void selectDish(selected, true);
$('lab-toggle').onclick = () => { $('lab-panel').hidden = !$('lab-panel').hidden; $('lab-toggle').setAttribute('aria-expanded', String(!$('lab-panel').hidden)); renderLab(); };
$('scale').oninput = event => { if (scene) { scene.scale = Number(event.target.value); scene.applyTransform(); } };
$('rotation').oninput = event => { if (scene) { scene.yaw = Number(event.target.value) * Math.PI / 180; scene.applyTransform(); } };
viewer.addEventListener('progress', event => { if (mode === 'preview') $('load-progress').value = event.detail.totalProgress; });
viewer.addEventListener('load', () => {
  if (mode !== 'preview') return;
  modelReady();
  // Preserve the smaller drink framing from the existing restaurant.
  if (selected.modelScale !== 1) requestAnimationFrame(() => {
    const orbit = viewer.getCameraOrbit(); viewer.cameraOrbit = `25deg 68deg ${orbit.radius / selected.modelScale}m`;
  });
  // Prepare local module/GLB before the click without requesting camera access.
  if (capabilities.immersive) void prepareScene().catch(() => {});
});
viewer.addEventListener('error', event => { if (mode === 'preview') modelError(event.detail); });
viewer.addEventListener('ar-status', event => { if (event.detail.status === 'failed') nativeFallback(); else if (event.detail.status === 'not-presenting' && loaded) status(t.preview, t.previewDetail); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('menu-panel').hidden) menu(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && (mode === 'camera' || handBusy)) void exitMode(); });
window.addEventListener('pagehide', () => { ++operation; clearTimeout(loadingTimer); handTracker?.stop(); void scene?.stop(); });
const labTimer = CONFIG.lab && setInterval(renderLab, 500);
window.addEventListener('pagehide', () => clearInterval(labTimer), {once: true});

async function initialize() {
  renderMenu();
  authorized = document.documentElement.dataset.authMode === 'guest' || await checkSession();
  if (!authorized) { $('auth-text').textContent = t.authRequired; $('login-link').hidden = false; return; }
  try { consumeToken(); } catch { /* guest/private browsing */ }
  $('auth-gate').hidden = true; app.inert = false;
  capabilities = await detectCapabilities(); refreshButtons();
  await Promise.race([customElements.whenDefined('model-viewer'), new Promise((_, reject) => setTimeout(() => reject(new Error('Viewer unavailable')), 15000))]);
  await selectDish(selected);
}
void initialize().catch(modelError);
