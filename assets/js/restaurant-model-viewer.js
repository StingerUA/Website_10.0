// Authentication compatibility for the restaurant page.
// Quick Uzaydash accounts intentionally have no email address, while the
// legacy restaurant gate used `user.email` as its logged-in flag. Keep the
// backend user intact everywhere else and only provide this page with a stable
// compatibility identity for /me.
const AUTH_API = 'https://api.albaspace.com.tr';
const AUTH_TOKEN_KEY = 'albaspace_access_token';
const AUTH_FRAGMENT_KEYS = ['access_token', AUTH_TOKEN_KEY];

function consumeRestaurantAuthToken() {
  const hash = window.location.hash.replace(/^#/, '');
  const parts = hash ? hash.split('&') : [];
  const tokenPart = parts.find((part) => AUTH_FRAGMENT_KEYS.some((key) => part.startsWith(`${key}=`)));
  if (!tokenPart) return;
  const eq = tokenPart.indexOf('=');
  const token = decodeURIComponent(eq >= 0 ? tokenPart.slice(eq + 1) : '');
  if (token) {
    try { localStorage.setItem(AUTH_TOKEN_KEY, token); } catch (error) {}
  }
  const rest = parts.filter((part) => !AUTH_FRAGMENT_KEYS.some((key) => part.startsWith(`${key}=`)));
  history.replaceState({}, document.title, location.pathname + location.search + (rest.length ? `#${rest.join('&')}` : ''));
}

consumeRestaurantAuthToken();

const nativeFetch = window.fetch.bind(window);
window.fetch = async function restaurantAuthCompatibleFetch(input, init) {
  const response = await nativeFetch(input, init);
  let requestUrl = '';
  try {
    requestUrl = typeof input === 'string' ? input : (input && input.url) || String(input || '');
  } catch (error) {}

  if (!response.ok || requestUrl !== `${AUTH_API}/me`) return response;

  try {
    const user = await response.clone().json();
    if (user && !user.email && (user.id || user.name || user.google_id)) {
      const compatibilityIdentity = user.quick_username || user.name || `user-${user.id || 'quick'}`;
      return new Response(JSON.stringify({ ...user, email: compatibilityIdentity }), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
  } catch (error) {}

  return response;
};

// Load the full restaurant menu engine in the browser without making this
// adapter an ES-module-only file. The repository CI validates this file with
// `node --check`, while the page itself still loads it with type="module".
void import('./restaurant-model-viewer-core.js?v=restaurant-posters-soup-5');

const viewer = document.querySelector('#mobile-model-viewer');
const DEFAULT_CAMERA_ORBIT = '25deg 68deg auto';

const MODEL_SCALE_RULES = [
  ['realistic-soup.glb', 1],
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
