const PAGE_LANGUAGE = document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'tr';
const AUTH_MODE = document.documentElement.dataset.authMode || 'required';
const IS_GUEST_MODE = AUTH_MODE === 'guest';
const IS_DESKTOP_SCENE = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
document.documentElement.classList.toggle('is-desktop-scene', IS_DESKTOP_SCENE);

const MENU_TR = {
  meat: {
    label: 'ET YEMEKLERİ',
    items: [
      {
        src: '/assets/models/restaurant/realistic-steak-board.glb?v=anchor-2',
        alt: 'Biberiye, kuşkonmaz ve sarımsaklı ahşap tahtada gerçekçi steak 3D modeli',
        name: 'Alba Reserve Steak',
        description: 'Biberiye, kuşkonmaz ve fırınlanmış sarımsaklı premium steak.',
        price: '₺ 620'
      },
      {
        src: '/assets/models/restaurant/realistic-steak-slices.glb?v=anchor-2',
        alt: 'Sebzeli gerçekçi kızarmış steak dilimleri 3D modeli',
        name: 'Izgara Steak Dilimleri',
        description: 'Sebze garnitürlü, dışı kızarmış ve içi pembe steak dilimleri.',
        price: '₺ 590'
      },
      {
        src: '/assets/models/restaurant/realistic-grilled-steak.glb?v=anchor-2',
        alt: 'Biber, lavaş ve yeşillikli ahşap tahtada gerçekçi steak 3D modeli',
        name: 'Izgara Steak Tahtası',
        description: 'Biber, lavaş ve taze yeşilliklerle servis edilen steak.',
        price: '₺ 640'
      }
    ]
  },
  dessert: {
    label: 'TATLILAR',
    items: [
      {
        src: '/assets/models/restaurant/realistic-dessert-cake.glb?v=anchor-2',
        alt: 'Beyaz glazür ve kirazlı gerçekçi katlı pasta 3D modeli',
        name: 'Alba Kirazlı Pasta',
        description: 'Beyaz glazür ve kirazlarla süslenmiş katlı pandispanya.',
        price: '₺ 260'
      },
      {
        src: '/assets/models/restaurant/realistic-fruit-dessert.glb?v=anchor-2',
        alt: 'Kavun, dondurma, meyve, krema ve naneli gerçekçi kup tatlı 3D modeli',
        name: 'Meyveli Kup',
        description: 'Kavun, dondurma, meyveler, krema ve nane ile hazırlanan kup.',
        price: '₺ 280'
      },
      {
        src: '/assets/models/restaurant/realistic-layered-dessert-cup.glb?v=anchor-2',
        alt: 'Kremalı orman meyveli katlı tatlı kupu 3D modeli',
        name: 'Orman Meyveli Kup',
        description: 'Krema, orman meyveleri ve ahşap kaşıkla servis edilen katlı tatlı.',
        price: '₺ 240'
      }
    ]
  },
  soup: {
    label: 'ÇORBALAR',
    items: [
      {
        src: '/assets/models/restaurant/realistic-soup.glb?v=anchor-2',
        alt: 'Seramik kasede gerçekçi çorba 3D modeli',
        name: 'Seramik Kasede Çorba',
        description: 'Detaylı seramik kasede sıcak çorba.',
        price: '₺ 190'
      }
    ]
  },
  drink: {
    label: 'İÇECEKLER',
    items: [
      {
        src: '/assets/models/restaurant/realistic-yogurt-drink.glb?v=anchor-2',
        alt: 'Çilekli yoğurt içeceği şişesi gerçekçi 3D modeli',
        name: 'Çilekli Yoğurt',
        description: 'Soğuk çilekli yoğurt içeceği.',
        price: '₺ 145'
      },
      {
        src: '/assets/models/restaurant/realistic-coffee-cup.glb?v=anchor-2',
        alt: 'Kapaklı kahve bardağı gerçekçi 3D modeli',
        name: 'Alba Kahve',
        description: 'Kapaklı detaylı bardakta aromatik kahve.',
        price: '₺ 135'
      },
      {
        src: '/assets/models/restaurant/realistic-strawberry-lemonade.glb?v=anchor-2',
        alt: 'Limon ve naneli çilekli limonata gerçekçi 3D modeli',
        name: 'Çilekli Limonata',
        description: 'Limon, nane ve çilek katmanlarıyla serinletici limonata.',
        price: '₺ 155'
      }
    ]
  }
};

const MENU_RU = {
  meat: {
    label: 'МЯСНЫЕ БЛЮДА',
    items: [
      {
        src: '/assets/models/restaurant/realistic-steak-board.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель стейка на деревянной доске с розмарином, спаржей и чесноком',
        name: 'Фирменный стейк Alba',
        description: 'Премиальный стейк с розмарином, спаржей и запечённым чесноком.',
        price: '₺ 620'
      },
      {
        src: '/assets/models/restaurant/realistic-steak-slices.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель обжаренных ломтиков стейка с овощами',
        name: 'Ломтики стейка на гриле',
        description: 'Обжаренные ломтики стейка с розовой серединой и овощным гарниром.',
        price: '₺ 590'
      },
      {
        src: '/assets/models/restaurant/realistic-grilled-steak.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель стейка на доске с перцем, лавашом и зеленью',
        name: 'Стейк на доске',
        description: 'Стейк с перцем, лавашом и свежей зеленью.',
        price: '₺ 640'
      }
    ]
  },
  dessert: {
    label: 'ДЕСЕРТЫ',
    items: [
      {
        src: '/assets/models/restaurant/realistic-dessert-cake.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель слоёного торта с белой глазурью и вишней',
        name: 'Вишнёвый торт Alba',
        description: 'Слоёный бисквит с белой глазурью и вишней.',
        price: '₺ 260'
      },
      {
        src: '/assets/models/restaurant/realistic-fruit-dessert.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель фруктового десерта с дыней, мороженым, сливками и мятой',
        name: 'Фруктовый десерт',
        description: 'Дыня, мороженое, фрукты, сливки и свежая мята.',
        price: '₺ 280'
      },
      {
        src: '/assets/models/restaurant/realistic-layered-dessert-cup.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель слоёного десерта со сливками и лесными ягодами',
        name: 'Десерт с лесными ягодами',
        description: 'Слоёный десерт со сливками, лесными ягодами и деревянной ложкой.',
        price: '₺ 240'
      }
    ]
  },
  soup: {
    label: 'СУПЫ',
    items: [
      {
        src: '/assets/models/restaurant/realistic-soup.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель супа в керамической миске',
        name: 'Суп в керамической миске',
        description: 'Горячий суп в детализированной керамической миске.',
        price: '₺ 190'
      }
    ]
  },
  drink: {
    label: 'НАПИТКИ',
    items: [
      {
        src: '/assets/models/restaurant/realistic-yogurt-drink.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель бутылки клубничного йогуртового напитка',
        name: 'Клубничный йогурт',
        description: 'Охлаждённый клубничный йогуртовый напиток.',
        price: '₺ 145'
      },
      {
        src: '/assets/models/restaurant/realistic-coffee-cup.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель стакана кофе с крышкой',
        name: 'Кофе Alba',
        description: 'Ароматный кофе в детализированном стакане с крышкой.',
        price: '₺ 135'
      },
      {
        src: '/assets/models/restaurant/realistic-strawberry-lemonade.glb?v=anchor-2',
        alt: 'Реалистичная 3D-модель клубничного лимонада с лимоном и мятой',
        name: 'Клубничный лимонад',
        description: 'Освежающий лимонад с лимоном, мятой и клубникой.',
        price: '₺ 155'
      }
    ]
  }
};

const COPY = {
  tr: {
    catalogLoading: 'Yemek kataloğu yükleniyor',
    selectedPreparing: 'Seçtiğiniz yemek görsel işaretçiye hazırlanıyor',
    tableFound: 'Masa bulundu',
    dishAnchored: 'Yemek masa yüzeyine bağlandı',
    tableSearching: 'Masa aranıyor',
    showCapturedSurface: 'Fotoğrafını çektiğiniz yüzeyi kamerada gösterin',
    dishLoadError: 'Yemek yüklenemedi',
    checkConnection: 'Lütfen internet bağlantınızı kontrol edin',
    anchorFoundPreparing: 'Görsel bulundu, model hazırlanıyor',
    firstDishPreparing: 'İlk yemek hazırlanıyor',
    cameraError: 'Kamera açılamadı',
    allowCameraRetry: 'Kamera iznini verin ve tekrar deneyin',
    tablePreparing: 'Masa hazırlanıyor',
    cameraSessionStarting: 'Kamera ve oturum bağlantısı başlatılıyor',
    cameraPreparing: 'Kamera hazırlanıyor',
    tableAimDetail: 'Telefonu masaya doğrultun. Desenler veya küçük bir nesne görünürse sabitleme daha güçlü olur.',
    fixTable: 'Masayı sabitle',
    tableNotFixed: 'Masa sabitlenemedi',
    processingImage: 'Masa görüntüsü işleniyor',
    processingMayTake: 'Bu işlem telefonunuza göre birkaç saniye sürebilir.',
    tableReady: 'Masa hazır',
    photoSessionOnly: 'Fotoğraf yalnızca bu oturum için kullanılıyor',
    lowFeatures: 'Yüzeyde yeterli görsel ayrıntı bulunamadı. Masadaki deseni veya küçük, sabit bir nesneyi kadraja alıp tekrar deneyin.',
    imageFailed: 'Masa fotoğrafı işlenemedi. Kamerayı sabit tutup tekrar deneyin.',
    desktopReady: 'Sanal masa hazır',
    desktopControls: 'Sahneyi sürükleyerek gezin, tekerlekle yaklaşın; Shift + tekerlek ile yemeği döndürün'
  },
  ru: {
    catalogLoading: 'Каталог блюд загружается',
    selectedPreparing: 'Выбранное блюдо готовится к привязке к визуальному якорю',
    tableFound: 'Стол найден',
    dishAnchored: 'Блюдо закреплено на поверхности стола',
    tableSearching: 'Поиск стола',
    showCapturedSurface: 'Наведите камеру на поверхность, которую вы сфотографировали',
    dishLoadError: 'Не удалось загрузить блюдо',
    checkConnection: 'Проверьте подключение к интернету',
    anchorFoundPreparing: 'Якорь найден, модель подготавливается',
    firstDishPreparing: 'Подготавливается первое блюдо',
    cameraError: 'Не удалось открыть камеру',
    allowCameraRetry: 'Разрешите доступ к камере и попробуйте снова',
    tablePreparing: 'Подготовка стола',
    cameraSessionStarting: 'Запускается камера и привязка текущей сессии',
    cameraPreparing: 'Камера подготавливается',
    tableAimDetail: 'Наведите телефон на стол. Узоры или небольшой неподвижный предмет сделают привязку устойчивее.',
    fixTable: 'Закрепить стол',
    tableNotFixed: 'Не удалось закрепить стол',
    processingImage: 'Обработка изображения стола',
    processingMayTake: 'Это может занять несколько секунд в зависимости от телефона.',
    tableReady: 'Стол готов',
    photoSessionOnly: 'Фотография используется только в этой сессии',
    lowFeatures: 'На поверхности недостаточно визуальных деталей. Добавьте в кадр узор или небольшой неподвижный предмет и попробуйте снова.',
    imageFailed: 'Не удалось обработать фотографию стола. Держите камеру неподвижно и попробуйте снова.',
    desktopReady: 'Виртуальный стол готов',
    desktopControls: 'Перетаскивайте сцену мышью, колесом приближайте; Shift + колесо вращает блюдо'
  }
}[PAGE_LANGUAGE];

const MENU = PAGE_LANGUAGE === 'ru' ? MENU_RU : MENU_TR;

const MAIN_API = 'https://api.albaspace.com.tr';
const AUTH_TOKEN_KEY = 'albaspace_access_token';
const AUTH_RETURN_KEY = 'albaspace_auth_return_to';
const MODEL_BASE_SCALE = 0.56;

function consumeAuthToken() {
  const hash = window.location.hash.replace(/^#/, '');
  const parts = hash ? hash.split('&') : [];
  const tokenPart = parts.find((part) => part.startsWith(`${AUTH_TOKEN_KEY}=`));
  if (!tokenPart) return;
  const token = decodeURIComponent(tokenPart.slice(AUTH_TOKEN_KEY.length + 1));
  if (token) {
    try { localStorage.setItem(AUTH_TOKEN_KEY, token); } catch (error) { console.warn('Auth token could not be stored:', error); }
  }
  const rest = parts.filter((part) => !part.startsWith(`${AUTH_TOKEN_KEY}=`));
  const cleanUrl = `${window.location.pathname}${window.location.search}${rest.length ? `#${rest.join('&')}` : ''}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function authHeaders() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    return token ? {Authorization: `Bearer ${token}`} : {};
  } catch (error) {
    return {};
  }
}

async function checkLogin() {
  consumeAuthToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${MAIN_API}/me`, {
      credentials: 'include',
      headers: authHeaders(),
      mode: 'cors',
      signal: controller.signal
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

const app = document.querySelector('#ar-app');
const arScene = document.querySelector('#ar-scene');
const dishAnchor = document.querySelector('#dish-anchor');
const dishStableStage = document.querySelector('#dish-stable-stage');
const dishRotation = document.querySelector('#dish-rotation');
const dishModel = document.querySelector('#dish-model');
const dishPlate = document.querySelector('#dish-plate');
const desktopEnvironment = document.querySelector('#desktop-environment');
const sceneCamera = document.querySelector('#scene-camera');
const ambientLight = document.querySelector('#ambient-light');
const keyLight = document.querySelector('#key-light');
const menuButton = document.querySelector('#menu-button');
const menuPanel = document.querySelector('#menu-panel');
const menuClose = document.querySelector('#menu-close');
const recalibrateButton = document.querySelector('#recalibrate-button');
const categoryContainer = document.querySelector('#menu-category-buttons');
const itemContainer = document.querySelector('#menu-item-buttons');
const statusCard = document.querySelector('#status-card');
const statusLabel = document.querySelector('#status-label');
const statusDetail = document.querySelector('#status-detail');
const loadingProgress = document.querySelector('#loading-progress');
const captureButton = document.querySelector('#capture-button');
const captureTimer = document.querySelector('#capture-timer');
const cameraFallback = document.querySelector('#camera-start-fallback');
const authGate = document.querySelector('#auth-gate');
const authChecking = document.querySelector('#auth-checking');
const authRequired = document.querySelector('#auth-required');
const loginLink = document.querySelector('#login-link');
const tableCalibration = document.querySelector('#table-calibration');
const tablePreview = document.querySelector('#table-preview');
const tableFreeze = document.querySelector('#table-freeze');
const tableCaptureButton = document.querySelector('#table-capture-button');
const tableCaptureLabel = document.querySelector('#table-capture-label');
const tableRetryButton = document.querySelector('#table-retry-button');
const tableCalibrationDetail = document.querySelector('#table-calibration-detail');
const calibrationProgress = document.querySelector('#calibration-progress');
const calibrationProgressBar = calibrationProgress.querySelector('span');

const state = {
  user: null,
  category: 'meat',
  dishIndex: 0,
  arSystem: null,
  arStarted: false,
  anchorReady: false,
  anchorTargetUrl: '',
  calibrationStream: null,
  calibrating: false,
  targetFound: false,
  modelReady: false,
  loadingDish: false,
  modelMinY: 0,
  zoom: 1,
  rotationZ: 0,
  pinchStartDistance: 0,
  pinchStartZoom: 1,
  twistStartAngle: 0,
  twistStartRotation: 0,
  poseInitialized: false,
  poseFrameId: null,
  poseLastFrameAt: 0,
  targetLostAt: 0,
  lastAnchorSeenAt: 0,
  statusTimer: null,
  captureHoldTimer: null,
  captureLongPress: false,
  mediaRecorder: null,
  recordedChunks: [],
  recordingStopTimer: null,
  recordingUiTimer: null,
  recordingStartedAt: 0,
  captureCanvas: null,
  captureContext: null,
  captureFrameId: null,
  desktopYaw: 0,
  desktopPitch: 0.21,
  desktopDistance: 3.15,
  desktopDragging: false,
  desktopPointerX: 0,
  desktopPointerY: 0
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function currentCategory() {
  return MENU[state.category] || MENU.meat;
}

function currentDish() {
  return currentCategory().items[state.dishIndex] || currentCategory().items[0];
}

function setStatus(label, detail, mode = 'loading', visible = true) {
  if (!statusCard) return;
  statusLabel.textContent = label;
  statusDetail.textContent = detail;
  statusCard.dataset.mode = mode;
  statusCard.hidden = !visible;
}

function setProgress(percent) {
  if (loadingProgress) loadingProgress.style.width = `${clamp(percent, 0, 100)}%`;
}

function hideStatusSoon(delay = 500) {
  clearTimeout(state.statusTimer);
  state.statusTimer = window.setTimeout(() => {
    if (state.targetFound && state.modelReady && !state.loadingDish) statusCard.hidden = true;
  }, delay);
}

function applyZoom() {
  const categoryScale = state.category === 'meat' ? 0.5 : 1;
  const scale = MODEL_BASE_SCALE * categoryScale * state.zoom;
  const surfaceZ = state.category === 'meat' ? 0.028 : 0.015;
  dishModel.setAttribute('scale', `${scale} ${scale} ${scale}`);
  dishModel.setAttribute('position', `0 0 ${surfaceZ - (state.modelMinY * scale)}`);
  const boardScale = 1.35 * state.zoom;
  dishPlate.setAttribute('scale', `${boardScale} ${boardScale} ${boardScale}`);
  dishRotation.setAttribute('rotation', `0 0 ${state.rotationZ}`);
  app.style.setProperty('--dish-zoom', state.zoom.toFixed(3));
  app.style.setProperty('--dish-rotation-z', state.rotationZ.toFixed(2));
}

function updateDishPresentation() {
  const isMeat = state.category === 'meat';
  dishPlate.setAttribute('visible', String(isMeat));
  ambientLight.setAttribute('light', 'intensity', isMeat ? 2.05 : 1.7);
  keyLight.setAttribute('light', 'intensity', isMeat ? 1.45 : 1.2);
}

function measureModelBottom() {
  const mesh = dishModel.getObject3D('mesh');
  if (!mesh || !window.AFRAME?.THREE) return 0;
  const root = new AFRAME.THREE.Group();
  root.add(mesh.clone(true));
  root.updateMatrixWorld(true);
  const bounds = new AFRAME.THREE.Box3().setFromObject(root);
  root.clear();
  return Number.isFinite(bounds.min.y) ? bounds.min.y : 0;
}

function renderCategoryButtons() {
  categoryContainer.innerHTML = Object.entries(MENU).map(([key, category]) => `
    <button class="category-button${key === state.category ? ' is-active' : ''}" type="button" role="tab" aria-selected="${key === state.category}" data-category="${key}">
      ${category.label}
    </button>
  `).join('');
  categoryContainer.querySelectorAll('.category-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      state.dishIndex = 0;
      renderCategoryButtons();
      renderItemButtons();
    });
  });
}

function renderItemButtons() {
  const category = currentCategory();
  itemContainer.innerHTML = category.items.map((item, index) => `
    <button class="menu-item-button${state.category === state.category && index === state.dishIndex ? ' is-selected' : ''}" type="button" data-index="${index}">
      <span class="menu-item-main"><strong>${item.name}</strong><small>${item.description}</small></span>
      <span class="menu-item-price">${item.price}</span>
    </button>
  `).join('');
  itemContainer.querySelectorAll('.menu-item-button').forEach((button) => {
    button.addEventListener('click', () => selectDish(state.category, Number(button.dataset.index)));
  });
}

function renderMenu() {
  renderCategoryButtons();
  renderItemButtons();
}

function setMenuOpen(open) {
  menuPanel.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  if (open) {
    renderMenu();
    window.setTimeout(() => menuPanel.querySelector('.menu-item-button')?.focus(), 60);
  } else {
    menuButton.focus({preventScroll: true});
  }
}

function prepareDish(item) {
  state.modelReady = false;
  state.loadingDish = true;
  setProgress(10);
  setStatus(COPY.catalogLoading, COPY.selectedPreparing, 'loading', true);
  dishModel.setAttribute('visible', 'false');
  dishModel.setAttribute('gltf-model', item.src);
  dishModel.setAttribute('title', item.alt);
  state.zoom = 1;
  state.rotationZ = 0;
  state.modelMinY = 0;
  updateDishPresentation();
  applyZoom();
}

function selectDish(categoryKey, index) {
  if (!MENU[categoryKey] || !MENU[categoryKey].items[index]) return;
  state.category = categoryKey;
  state.dishIndex = index;
  renderMenu();
  setMenuOpen(false);
  prepareDish(currentDish());
}

function handleModelLoaded(event) {
  if (event.target !== dishModel) return;
  dishModel.removeAttribute('animation');
  dishModel.removeAttribute('animation-mixer');
  state.modelReady = true;
  state.loadingDish = false;
  state.modelMinY = measureModelBottom();
  applyZoom();
  setProgress(100);
  dishModel.setAttribute('visible', 'true');
  if (IS_DESKTOP_SCENE) {
    setStatus(COPY.desktopReady, COPY.desktopControls, 'ready', true);
    hideStatusSoon(1400);
  } else if (state.targetFound) {
    setStatus(COPY.tableFound, COPY.dishAnchored, 'ready', true);
    hideStatusSoon(1100);
  } else {
    setStatus(COPY.tableSearching, COPY.showCapturedSurface, 'scanning', true);
  }
}

function handleModelError(event) {
  if (event.target !== dishModel) return;
  state.modelReady = false;
  state.loadingDish = false;
  setProgress(0);
  setStatus(COPY.dishLoadError, COPY.checkConnection, 'error', true);
  console.warn('AR model load failed:', event);
}

function handleTargetFound() {
  const now = performance.now();
  if (now - state.lastAnchorSeenAt > 1200) state.poseInitialized = false;
  state.targetFound = true;
  state.targetLostAt = 0;
  if (state.modelReady && !state.loadingDish) {
    setStatus(COPY.tableFound, COPY.dishAnchored, 'ready', true);
    hideStatusSoon(900);
  } else {
    setStatus(COPY.catalogLoading, COPY.anchorFoundPreparing, 'loading', true);
  }
}

function handleTargetLost() {
  state.targetFound = false;
  state.targetLostAt = performance.now();
  setStatus(COPY.tableSearching, COPY.showCapturedSurface, 'scanning', true);
}

function startAnchorStabilization() {
  if (!window.AFRAME?.THREE || state.poseFrameId) return;
  const targetPosition = new AFRAME.THREE.Vector3();
  const targetQuaternion = new AFRAME.THREE.Quaternion();
  const targetScale = new AFRAME.THREE.Vector3();
  const lostGraceMs = 500;
  const smoothingMs = 145;

  const updatePose = (now) => {
    const delta = state.poseLastFrameAt ? Math.min(50, now - state.poseLastFrameAt) : 16;
    state.poseLastFrameAt = now;

    if (state.targetFound && dishAnchor.object3D.visible) {
      dishAnchor.object3D.updateWorldMatrix(true, false);
      dishAnchor.object3D.getWorldPosition(targetPosition);
      dishAnchor.object3D.getWorldQuaternion(targetQuaternion);
      dishAnchor.object3D.getWorldScale(targetScale);

      const stage = dishStableStage.object3D;
      if (!state.poseInitialized) {
        stage.position.copy(targetPosition);
        stage.quaternion.copy(targetQuaternion);
        stage.scale.copy(targetScale);
        state.poseInitialized = true;
      } else {
        const alpha = 1 - Math.exp(-delta / smoothingMs);
        stage.position.lerp(targetPosition, alpha);
        stage.quaternion.slerp(targetQuaternion, alpha);
        stage.scale.lerp(targetScale, alpha);
      }
      stage.visible = state.modelReady;
      state.lastAnchorSeenAt = now;
    } else if (state.targetLostAt && now - state.targetLostAt > lostGraceMs) {
      dishStableStage.object3D.visible = false;
    }

    state.poseFrameId = requestAnimationFrame(updatePose);
  };

  state.poseFrameId = requestAnimationFrame(updatePose);
}

function stopAnchorStabilization() {
  cancelAnimationFrame(state.poseFrameId);
  state.poseFrameId = null;
  state.poseLastFrameAt = 0;
  state.poseInitialized = false;
  dishStableStage.object3D.visible = false;
}

function setArVideoStyles(video) {
  if (!video) return;
  video.setAttribute('playsinline', '');
  video.muted = true;
}

function handleArReady() {
  state.arSystem = arScene.systems['mindar-image-system'];
  setArVideoStyles(state.arSystem?.video);
  setProgress(58);
  if (state.modelReady) {
    setStatus(COPY.tableSearching, COPY.showCapturedSurface, 'scanning', true);
  } else {
    setStatus(COPY.catalogLoading, COPY.firstDishPreparing, 'loading', true);
  }
}

function handleArError(event) {
  const code = event.detail?.error || 'VIDEO_FAIL';
  console.warn('MindAR error:', code);
  state.arStarted = false;
  state.targetFound = false;
  state.poseInitialized = false;
  dishStableStage.object3D.visible = false;
  state.arSystem?.video?.srcObject?.getTracks().forEach((track) => track.stop());
  state.arSystem?.video?.remove();
  cameraFallback.hidden = false;
  setStatus(COPY.cameraError, COPY.allowCameraRetry, 'error', true);
}

function startImageTracking() {
  if (state.arStarted || !state.anchorReady || !state.anchorTargetUrl) return;
  const system = arScene.systems['mindar-image-system'];
  if (!system) {
    handleArError({detail: {error: 'SYSTEM_UNAVAILABLE'}});
    return;
  }
  state.arSystem = system;
  system.imageTargetSrc = state.anchorTargetUrl;
  state.arStarted = true;
  cameraFallback.hidden = true;
  setStatus(COPY.tablePreparing, COPY.cameraSessionStarting, 'loading', true);
  system.start();
}

function stopImageTracking() {
  if (!state.arStarted || !state.arSystem) {
    state.targetFound = false;
    state.poseInitialized = false;
    dishStableStage.object3D.visible = false;
    return;
  }
  try {
    if (state.arSystem.controller && state.arSystem.video?.srcObject) {
      state.arSystem.stop();
    } else {
      state.arSystem.video?.srcObject?.getTracks().forEach((track) => track.stop());
      state.arSystem.video?.remove();
    }
  } catch (error) {
    console.warn('MindAR stop failed:', error);
  }
  state.arStarted = false;
  state.targetFound = false;
  state.poseInitialized = false;
  dishAnchor.object3D.visible = false;
  dishStableStage.object3D.visible = false;
}

function cameraErrorFallback() {
  state.arStarted = false;
  state.targetFound = false;
  state.poseInitialized = false;
  dishStableStage.object3D.visible = false;
  state.arSystem?.video?.srcObject?.getTracks().forEach((track) => track.stop());
  state.arSystem?.video?.remove();
  cameraFallback.hidden = false;
  setStatus(COPY.cameraError, COPY.allowCameraRetry, 'error', true);
}

function stageVideo() {
  if (!state.anchorReady) return;
  if (arScene.hasLoaded) startImageTracking();
  else arScene.addEventListener('loaded', startImageTracking, {once: true});
}

function stopCalibrationPreview() {
  if (state.calibrationStream) {
    state.calibrationStream.getTracks().forEach((track) => track.stop());
    state.calibrationStream = null;
  }
  tablePreview.srcObject = null;
}

async function startCalibrationPreview() {
  stopCalibrationPreview();
  tablePreview.hidden = false;
  tableFreeze.hidden = true;
  tableRetryButton.hidden = true;
  calibrationProgress.hidden = true;
  calibrationProgressBar.style.width = '0%';
  tableCaptureLabel.textContent = COPY.cameraPreparing;
  tableCalibrationDetail.textContent = COPY.tableAimDetail;
  tableCaptureButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {facingMode: {ideal: 'environment'}, width: {ideal: 1280}, height: {ideal: 960}}
    });
    state.calibrationStream = stream;
    tablePreview.srcObject = stream;
    await tablePreview.play();
    tableCaptureButton.disabled = false;
    tableCaptureLabel.textContent = COPY.fixTable;
  } catch (error) {
    console.warn('Table preview failed:', error);
    tableCaptureLabel.textContent = COPY.cameraError;
    tableCalibrationDetail.textContent = `${COPY.allowCameraRetry}.`;
    tableRetryButton.hidden = false;
  }
}

function drawTableFrame() {
  const videoWidth = tablePreview.videoWidth;
  const videoHeight = tablePreview.videoHeight;
  if (!videoWidth || !videoHeight) throw new Error('CAMERA_NOT_READY');
  const targetWidth = 640;
  const targetHeight = 480;
  const targetRatio = targetWidth / targetHeight;
  const videoRatio = videoWidth / videoHeight;
  let sourceWidth = videoWidth;
  let sourceHeight = videoHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (videoRatio > targetRatio) {
    sourceWidth = videoHeight * targetRatio;
    sourceX = (videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = videoWidth / targetRatio;
    sourceY = (videoHeight - sourceHeight) / 2;
  }
  tableFreeze.width = targetWidth;
  tableFreeze.height = targetHeight;
  const context = tableFreeze.getContext('2d', {alpha: false, willReadFrequently: true});
  context.drawImage(tablePreview, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  return context;
}

function countCompiledFeatures(dataList) {
  const matchingData = dataList?.[0]?.matchingData || [];
  return matchingData.reduce((total, frame) => {
    return total + (frame.maximaPoints?.length || 0) + (frame.minimaPoints?.length || 0);
  }, 0);
}

function showCalibrationError(message) {
  state.calibrating = false;
  calibrationProgress.hidden = true;
  tableCaptureButton.disabled = true;
  tableCaptureLabel.textContent = COPY.tableNotFixed;
  tableCalibrationDetail.textContent = message;
  tableRetryButton.hidden = false;
}

async function compileTableAnchor() {
  if (state.calibrating) return;
  state.calibrating = true;
  tableCaptureButton.disabled = true;
  tableRetryButton.hidden = true;
  calibrationProgress.hidden = false;
  calibrationProgressBar.style.width = '2%';
  tableCaptureLabel.textContent = COPY.processingImage;
  tableCalibrationDetail.textContent = COPY.processingMayTake;
  try {
    drawTableFrame();
    tableFreeze.hidden = false;
    tablePreview.hidden = true;
    stopCalibrationPreview();
    const Compiler = window.MINDAR?.IMAGE?.Compiler;
    if (!Compiler) throw new Error('COMPILER_UNAVAILABLE');
    const compiler = new Compiler();
    const dataList = await compiler.compileImageTargets([tableFreeze], (progress) => {
      const rounded = Math.max(2, Math.min(96, Math.round(progress)));
      calibrationProgressBar.style.width = `${rounded}%`;
      tableCaptureLabel.textContent = `${COPY.processingImage} · ${rounded}%`;
    });
    if (countCompiledFeatures(dataList) < 24) throw new Error('LOW_FEATURES');
    const buffer = compiler.exportData();
    if (state.anchorTargetUrl) URL.revokeObjectURL(state.anchorTargetUrl);
    state.anchorTargetUrl = URL.createObjectURL(new Blob([buffer], {type: 'application/octet-stream'}));
    state.anchorReady = true;
    state.calibrating = false;
    calibrationProgressBar.style.width = '100%';
    tableCaptureLabel.textContent = COPY.tableReady;
    tableCalibration.hidden = true;
    setStatus(COPY.tableReady, COPY.photoSessionOnly, 'ready', true);
    window.setTimeout(stageVideo, 120);
  } catch (error) {
    console.warn('Table anchor compilation failed:', error);
    const message = error.message === 'LOW_FEATURES' ? COPY.lowFeatures : COPY.imageFailed;
    showCalibrationError(message);
  }
}

async function beginTableCalibration() {
  stopImageTracking();
  stopCalibrationPreview();
  if (state.anchorTargetUrl) {
    URL.revokeObjectURL(state.anchorTargetUrl);
    state.anchorTargetUrl = '';
  }
  state.anchorReady = false;
  state.targetFound = false;
  state.calibrating = false;
  menuPanel.hidden = true;
  tableCalibration.hidden = false;
  await startCalibrationPreview();
}


function updateDesktopCamera() {
  if (!IS_DESKTOP_SCENE || !sceneCamera?.object3D || !window.AFRAME?.THREE) return;
  const target = new AFRAME.THREE.Vector3(0, 0.93, 0);
  const horizontal = Math.cos(state.desktopPitch) * state.desktopDistance;
  sceneCamera.object3D.position.set(
    Math.sin(state.desktopYaw) * horizontal,
    target.y + Math.sin(state.desktopPitch) * state.desktopDistance,
    Math.cos(state.desktopYaw) * horizontal
  );
  sceneCamera.object3D.lookAt(target);
}

function setupDesktopOrbit() {
  if (!IS_DESKTOP_SCENE) return;
  const bind = () => {
    const canvas = arScene.canvas || arScene.renderer?.domElement;
    if (!canvas || canvas.dataset.desktopOrbit === 'ready') return;
    canvas.dataset.desktopOrbit = 'ready';
    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      state.desktopDragging = true;
      state.desktopPointerX = event.clientX;
      state.desktopPointerY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!state.desktopDragging) return;
      state.desktopYaw -= (event.clientX - state.desktopPointerX) * 0.006;
      state.desktopPitch = clamp(state.desktopPitch + (event.clientY - state.desktopPointerY) * 0.004, 0.08, 0.78);
      state.desktopPointerX = event.clientX;
      state.desktopPointerY = event.clientY;
      updateDesktopCamera();
    });
    const stopDrag = () => { state.desktopDragging = false; };
    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
    updateDesktopCamera();
  };
  if (arScene.hasLoaded) bind();
  else arScene.addEventListener('loaded', bind, {once: true});
}

function initializeDesktopScene() {
  stopCalibrationPreview();
  tableCalibration.hidden = true;
  cameraFallback.hidden = true;
  desktopEnvironment?.setAttribute('visible', 'true');
  ambientLight.setAttribute('light', 'intensity', 1.25);
  keyLight.setAttribute('light', 'intensity', 1.9);
  sceneCamera?.setAttribute('fov', '50');
  dishAnchor.setAttribute('visible', 'false');
  dishStableStage.setAttribute('visible', 'true');
  dishStableStage.setAttribute('position', '0 0.855 0');
  dishStableStage.setAttribute('rotation', '-90 0 0');
  state.anchorReady = true;
  state.targetFound = true;
  setupDesktopOrbit();
  setStatus(COPY.desktopReady, COPY.desktopControls, 'ready', true);
}

async function initializeSession() {
  if (IS_GUEST_MODE) {
    state.user = {guest: true};
    authChecking.hidden = true;
    authRequired.hidden = true;
    authGate.hidden = true;
    if (IS_DESKTOP_SCENE) initializeDesktopScene();
    else await beginTableCalibration();
    return;
  }
  state.user = await checkLogin();
  authChecking.hidden = true;
  if (!state.user || !state.user.email) {
    authRequired.hidden = false;
    return;
  }
  authGate.hidden = true;
  if (IS_DESKTOP_SCENE) initializeDesktopScene();
  else await beginTableCalibration();
}

function distanceBetweenTouches(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

function angleBetweenTouches(touches) {
  return Math.atan2(
    touches[1].clientY - touches[0].clientY,
    touches[1].clientX - touches[0].clientX
  ) * 180 / Math.PI;
}

function shortestAngleDelta(current, start) {
  return ((current - start + 540) % 360) - 180;
}

function setupTransformControls() {
  app.addEventListener('touchstart', (event) => {
    if (IS_DESKTOP_SCENE || event.touches.length !== 2) return;
    state.pinchStartDistance = distanceBetweenTouches(event.touches);
    state.pinchStartZoom = state.zoom;
    state.twistStartAngle = angleBetweenTouches(event.touches);
    state.twistStartRotation = state.rotationZ;
    event.preventDefault();
  }, {passive: false});
  app.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 2 || !state.pinchStartDistance) return;
    const distance = distanceBetweenTouches(event.touches);
    state.zoom = clamp(state.pinchStartZoom * distance / state.pinchStartDistance, 0.48, 2.2);
    state.rotationZ = state.twistStartRotation + shortestAngleDelta(angleBetweenTouches(event.touches), state.twistStartAngle);
    applyZoom();
    event.preventDefault();
  }, {passive: false});
  const clearGesture = () => { state.pinchStartDistance = 0; };
  app.addEventListener('touchend', clearGesture, {passive: true});
  app.addEventListener('touchcancel', clearGesture, {passive: true});
  app.addEventListener('wheel', (event) => {
    if (!state.targetFound) return;
    if (IS_DESKTOP_SCENE && !event.shiftKey) {
      state.desktopDistance = clamp(state.desktopDistance * (event.deltaY > 0 ? 1.08 : 0.92), 1.8, 5.2);
      updateDesktopCamera();
    } else if (event.shiftKey) {
      state.rotationZ += event.deltaY > 0 ? -7.5 : 7.5;
      applyZoom();
    } else {
      state.zoom = clamp(state.zoom * (event.deltaY > 0 ? 0.92 : 1.08), 0.48, 2.2);
      applyZoom();
    }
    event.preventDefault();
  }, {passive: false});
}

function timestampName(prefix, extension) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${stamp}.${extension}`;
}

function saveBlob(blob, filename) {
  if (!blob || !blob.size) return;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

function cameraVideo() {
  return state.arSystem?.video || document.querySelector('#ar-scene video');
}

function captureCanvasSize() {
  const video = cameraVideo();
  return {
    width: video?.videoWidth || Math.max(720, window.innerWidth * 2),
    height: video?.videoHeight || Math.max(1280, window.innerHeight * 2)
  };
}

function getCaptureCanvas() {
  if (!state.captureCanvas) {
    state.captureCanvas = document.createElement('canvas');
    state.captureContext = state.captureCanvas.getContext('2d', {alpha: false});
  }
  const {width, height} = captureCanvasSize();
  if (state.captureCanvas.width !== width || state.captureCanvas.height !== height) {
    state.captureCanvas.width = width;
    state.captureCanvas.height = height;
  }
  return state.captureCanvas;
}

function mapViewportToVideo(rect) {
  const {width, height} = getCaptureCanvas();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scale = Math.max(viewportWidth / width, viewportHeight / height);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;
  const offsetX = (viewportWidth - renderedWidth) / 2;
  const offsetY = (viewportHeight - renderedHeight) / 2;
  return {
    x: (rect.left - offsetX) / scale,
    y: (rect.top - offsetY) / scale,
    width: rect.width / scale,
    height: rect.height / scale
  };
}

function drawCaptureFrame() {
  const canvas = getCaptureCanvas();
  const context = state.captureContext;
  const video = cameraVideo();
  const {width, height} = canvas;
  context.clearRect(0, 0, width, height);
  if (video?.videoWidth && video?.videoHeight) context.drawImage(video, 0, 0, width, height);
  else {
    context.fillStyle = '#050b1a';
    context.fillRect(0, 0, width, height);
  }
  const rendererCanvas = arScene.renderer?.domElement;
  if (rendererCanvas?.width && rendererCanvas?.height) {
    const target = mapViewportToVideo({left: 0, top: 0, width: window.innerWidth, height: window.innerHeight});
    context.drawImage(rendererCanvas, 0, 0, rendererCanvas.width, rendererCanvas.height, target.x, target.y, target.width, target.height);
  }
  return canvas;
}

function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function takePhoto() {
  const canvas = drawCaptureFrame();
  const blob = await canvasToBlob(canvas, 'image/png');
  if (blob) saveBlob(blob, timestampName('alba-ar-photo', 'png'));
}

function updateRecordingTimer() {
  if (!state.recordingStartedAt) return;
  const elapsed = Math.min(30, (performance.now() - state.recordingStartedAt) / 1000);
  const remaining = Math.max(0, 30 - Math.ceil(elapsed));
  captureTimer.textContent = `00:${String(remaining).padStart(2, '0')}`;
}

function startCaptureFrameLoop() {
  const tick = () => {
    if (!state.mediaRecorder) return;
    drawCaptureFrame();
    state.captureFrameId = requestAnimationFrame(tick);
  };
  cancelAnimationFrame(state.captureFrameId);
  state.captureFrameId = requestAnimationFrame(tick);
}

function stopCaptureFrameLoop() {
  cancelAnimationFrame(state.captureFrameId);
  state.captureFrameId = null;
}

function startVideoRecording() {
  if (state.mediaRecorder || !window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
  const video = cameraVideo();
  if (!video?.videoWidth) return;
  const canvas = getCaptureCanvas();
  const stream = canvas.captureStream(30);
  const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  try {
    state.mediaRecorder = new MediaRecorder(stream, mimeType ? {mimeType, videoBitsPerSecond: 4200000} : undefined);
  } catch (error) {
    console.warn('MediaRecorder unavailable:', error);
    stream.getTracks().forEach((track) => track.stop());
    return;
  }
  state.recordedChunks = [];
  state.recordingStartedAt = performance.now();
  const recorder = state.mediaRecorder;
  recorder.ondataavailable = (event) => { if (event.data.size) state.recordedChunks.push(event.data); };
  recorder.onstop = () => {
    const blob = new Blob(state.recordedChunks, {type: recorder.mimeType || 'video/webm'});
    state.recordedChunks = [];
    stream.getTracks().forEach((track) => track.stop());
    if (blob.size) saveBlob(blob, timestampName('alba-ar-video', 'webm'));
  };
  recorder.onerror = (event) => console.warn('MediaRecorder error:', event.error);
  recorder.start(250);
  captureButton.classList.add('is-recording');
  captureTimer.hidden = false;
  updateRecordingTimer();
  state.recordingUiTimer = window.setInterval(updateRecordingTimer, 250);
  state.recordingStopTimer = window.setTimeout(stopVideoRecording, 30000);
  startCaptureFrameLoop();
}

function stopVideoRecording() {
  clearTimeout(state.recordingStopTimer);
  clearInterval(state.recordingUiTimer);
  state.recordingStopTimer = null;
  state.recordingUiTimer = null;
  captureTimer.hidden = true;
  captureButton.classList.remove('is-recording');
  state.recordingStartedAt = 0;
  stopCaptureFrameLoop();
  const recorder = state.mediaRecorder;
  state.mediaRecorder = null;
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

function setupCaptureControl() {
  captureButton.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    state.captureLongPress = false;
    clearTimeout(state.captureHoldTimer);
    captureButton.setPointerCapture?.(event.pointerId);
    state.captureHoldTimer = window.setTimeout(() => {
      state.captureLongPress = true;
      startVideoRecording();
    }, 450);
    event.preventDefault();
  });
  const finish = (event) => {
    clearTimeout(state.captureHoldTimer);
    state.captureHoldTimer = null;
    if (state.mediaRecorder) stopVideoRecording();
    else if (!state.captureLongPress) takePhoto();
    event.preventDefault();
  };
  captureButton.addEventListener('pointerup', finish);
  captureButton.addEventListener('pointercancel', (event) => {
    clearTimeout(state.captureHoldTimer);
    state.captureHoldTimer = null;
    if (state.mediaRecorder) stopVideoRecording();
    event.preventDefault();
  });
  captureButton.addEventListener('contextmenu', (event) => event.preventDefault());
}

menuButton.addEventListener('click', () => setMenuOpen(menuPanel.hidden));
menuClose.addEventListener('click', () => setMenuOpen(false));
recalibrateButton.addEventListener('click', () => {
  setMenuOpen(false);
  beginTableCalibration();
});
tableCaptureButton.addEventListener('click', compileTableAnchor);
tableRetryButton.addEventListener('click', startCalibrationPreview);
loginLink.addEventListener('click', () => {
  try {
    sessionStorage.setItem(AUTH_RETURN_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}`);
  } catch (error) {
    console.warn('Return path could not be stored:', error);
  }
});
cameraFallback.addEventListener('click', () => {
  cameraFallback.hidden = true;
  if (state.anchorReady) startImageTracking();
  else beginTableCalibration();
});
dishAnchor.addEventListener('targetFound', handleTargetFound);
dishAnchor.addEventListener('targetLost', handleTargetLost);
dishModel.addEventListener('model-loaded', handleModelLoaded);
dishModel.addEventListener('model-error', handleModelError);
arScene.addEventListener('arReady', handleArReady);
arScene.addEventListener('arError', handleArError);
window.addEventListener('error', (event) => {
  if (String(event.message || '').toLowerCase().includes('camera')) cameraErrorFallback();
});
window.addEventListener('pagehide', () => {
  if (state.mediaRecorder) stopVideoRecording();
  stopAnchorStabilization();
  stopCalibrationPreview();
  stopImageTracking();
  if (state.anchorTargetUrl) URL.revokeObjectURL(state.anchorTargetUrl);
});

renderMenu();
prepareDish(currentDish());
if (!IS_DESKTOP_SCENE) {
  startAnchorStabilization();
  setupCaptureControl();
}
setupTransformControls();
initializeSession();
