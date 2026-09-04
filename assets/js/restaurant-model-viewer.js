// Load the full restaurant menu engine in the browser without making this
// adapter an ES-module-only file. The repository CI validates this file with
// `node --check`, while the page itself still loads it with type="module".
void import('./restaurant-model-viewer-core.js?v=restaurant-scale-fix-2');

const viewer = document.querySelector('#mobile-model-viewer');
const DEFAULT_CAMERA_ORBIT = '25deg 68deg auto';

const MODEL_SCALE_RULES = [
  ['turkish-lentil-soup.glb', 5],
  ['realistic-yogurt-drink.glb', 0.5],
  ['realistic-coffee-cup.glb', 0.5],
  ['realistic-strawberry-lemonade.glb', 0.5]
];

function currentModelScale() {
  if (!viewer) return 1;
  const src = viewer.getAttribute('src') || viewer.src || '';
  const rule = MODEL_SCALE_RULES.find(([filename]) => src.includes(filename));
  return rule ? rule[1] : 1;
}

function applyPhysicalScale() {
  if (!viewer) return;
  const scale = currentModelScale();
  const vector = `${scale} ${scale} ${scale}`;

  // Native AR must respect the authored/model-viewer scale instead of
  // normalising it back through the default resizable AR behaviour.
  viewer.setAttribute('ar-scale', 'fixed');
  viewer.setAttribute('scale', vector);
  viewer.scale = vector;
  viewer.dataset.appliedDishScale = String(scale);
}

function resetPreviewFraming() {
  if (!viewer) return;
  viewer.setAttribute('camera-orbit', DEFAULT_CAMERA_ORBIT);
}

function applyVisiblePreviewScale() {
  if (!viewer) return;
  const scale = currentModelScale();
  applyPhysicalScale();
  resetPreviewFraming();

  // model-viewer intentionally auto-frames different model scales so a 5x
  // model looks nearly identical in the normal 3D preview. Counter that
  // auto-framing here so the requested 5x / 0.5x difference is also visible
  // before entering AR.
  if (scale === 1 || typeof viewer.getCameraOrbit !== 'function') return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const orbit = viewer.getCameraOrbit();
      const autoRadius = Number(orbit?.radius);
      if (!Number.isFinite(autoRadius) || autoRadius <= 0) return;
      const radius = autoRadius / scale;
      viewer.setAttribute('camera-orbit', `25deg 68deg ${radius}m`);
    });
  });
}

if (viewer) {
  viewer.setAttribute('ar-scale', 'fixed');

  new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.attributeName === 'src')) return;
    resetPreviewFraming();
    applyPhysicalScale();
  }).observe(viewer, {attributes: true, attributeFilter: ['src']});

  viewer.addEventListener('load', applyVisiblePreviewScale);
  viewer.addEventListener('ar-status', (event) => {
    if (event.detail?.status === 'session-started') applyPhysicalScale();
  });

  applyPhysicalScale();
}
