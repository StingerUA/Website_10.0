const PAGE_LANGUAGE = document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'tr';
const AUTH_MODE = document.documentElement.dataset.authMode || 'required';
const IS_GUEST_MODE = AUTH_MODE === 'guest';
const IS_DESKTOP_SCENE = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;

document.documentElement.classList.toggle('is-desktop-scene', IS_DESKTOP_SCENE);

const MODEL_VERSION = 'model-viewer-ar-3';
const modelSource = (filename) => `/assets/models/restaurant/ar/${filename}?v=${MODEL_VERSION}`;
const desktopModelSource = (filename) => `/assets/models/restaurant/${filename}?v=${MODEL_VERSION}`;

const MENU_TR = {
  meat: {
    label: 'ET YEMEKLERİ',
    items: [
      {
        src: modelSource('turkish-shish-kebab-plated.glb'),
        desktopSrc: modelSource('turkish-shish-kebab.glb'),
        desktopScale: 1,
        desktopSupport: 'plate',
        desktopSupportScale: 1.7,
        alt: 'Közlenmiş sebzelerle servis edilen üç şişli Türk şiş kebabı 3D modeli',
        name: 'Türk Şiş Kebabı',
        description: 'Şişte ızgara et; közlenmiş biber, domates, soğan ve limonla servis edilir.',
        price: '₺ 620'
      },
      {
        src: modelSource('turkish-adana-kebab-plated.glb'),
        desktopSrc: modelSource('turkish-adana-kebab.glb'),
        desktopScale: 1,
        desktopSupport: 'plate',
        desktopSupportScale: 1.7,
        alt: 'Pide, közlenmiş domates ve biberli Adana kebabı 3D modeli',
        name: 'Adana Kebabı',
        description: 'Baharatlı kıyma kebabı; pide, közlenmiş domates, biber ve sumaklı soğanla.',
        price: '₺ 590'
      },
      {
        src: modelSource('realistic-grilled-steak.glb'),
        desktopSupport: 'board',
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
        src: modelSource('realistic-dessert-cake-plated.glb'),
        desktopSrc: desktopModelSource('realistic-dessert-cake.glb'),
        desktopSupport: 'plate',
        desktopSupportScale: 2.45,
        alt: 'Beyaz glazür ve kirazlı gerçekçi katlı pasta 3D modeli',
        name: 'Alba Kirazlı Pasta',
        description: 'Beyaz glazür ve kirazlarla süslenmiş katlı pandispanya.',
        price: '₺ 260'
      },
      {
        src: modelSource('strawberry-chocolate-cake-plated.glb'),
        desktopSrc: modelSource('strawberry-chocolate-cake.glb'),
        desktopScale: 1,
        desktopSupport: 'plate',
        desktopSupportScale: 1.55,
        alt: 'Çilek ve çikolata kaplamalı gerçekçi pasta 3D modeli',
        name: 'Çilekli Çikolatalı Pasta',
        description: 'Çilek, çikolata kaplama ve yumuşak kek katmanlarıyla hazırlanan pasta.',
        price: '₺ 280'
      },
      {
        src: modelSource('realistic-layered-dessert-cup.glb'),
        desktopSrc: desktopModelSource('realistic-layered-dessert-cup.glb'),
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
        src: modelSource('turkish-lentil-soup.glb'),
        desktopSrc: modelSource('turkish-lentil-soup.glb'),
        desktopScale: 1,
        alt: 'Limon, maydanoz ve zeytinyağlı Türk mercimek çorbası 3D modeli',
        name: 'Mercimek Çorbası',
        description: 'Limon, maydanoz, kırmızı biber ve zeytinyağıyla servis edilen sıcak mercimek çorbası.',
        price: '₺ 190'
      }
    ]
  },
  drink: {
    label: 'İÇECEKLER',
    items: [
      {
        src: modelSource('realistic-yogurt-drink.glb'),
        alt: 'Çilekli yoğurt içeceği şişesi gerçekçi 3D modeli',
        name: 'Çilekli Yoğurt',
        description: 'Soğuk çilekli yoğurt içeceği.',
        price: '₺ 145'
      },
      {
        src: modelSource('realistic-coffee-cup.glb'),
        alt: 'Kapaklı kahve bardağı gerçekçi 3D modeli',
        name: 'Alba Kahve',
        description: 'Kapaklı detaylı bardakta aromatik kahve.',
        price: '₺ 135'
      },
      {
        src: modelSource('realistic-strawberry-lemonade.glb'),
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
        src: modelSource('turkish-shish-kebab-plated.glb'),
        desktopSrc: modelSource('turkish-shish-kebab.glb'),
        desktopScale: 1,
        desktopSupport: 'plate',
        desktopSupportScale: 1.7,
        alt: '3D-модель турецкого шиш-кебаба на трёх шампурах с запечёнными овощами',
        name: 'Турецкий шиш-кебаб',
        description: 'Мясо на шампурах с запечённым перцем, помидором, луком и лимоном.',
        price: '₺ 620'
      },
      {
        src: modelSource('turkish-adana-kebab-plated.glb'),
        desktopSrc: modelSource('turkish-adana-kebab.glb'),
        desktopScale: 1,
        desktopSupport: 'plate',
        desktopSupportScale: 1.7,
        alt: '3D-модель турецкого адана-кебаба с питой, запечённым помидором и перцем',
        name: 'Адана-кебаб',
        description: 'Пряный кебаб из рубленого мяса с питой, запечёнными овощами и луком с сумахом.',
        price: '₺ 590'
      },
      {
        src: modelSource('realistic-grilled-steak.glb'),
        desktopSupport: 'board',
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
        src: modelSource('realistic-dessert-cake-plated.glb'),
        desktopSrc: desktopModelSource('realistic-dessert-cake.glb'),
        desktopSupport: 'plate',
        desktopSupportScale: 2.45,
        alt: 'Реалистичная 3D-модель слоёного торта с белой глазурью и вишней',
        name: 'Вишнёвый торт Alba',
        description: 'Слоёный бисквит с белой глазурью и вишней.',
        price: '₺ 260'
      },
      {
        src: modelSource('strawberry-chocolate-cake-plated.glb'),
        desktopSrc: modelSource('strawberry-chocolate-cake.glb'),
        desktopScale: 1,
        desktopSupport: 'plate',
        desktopSupportScale: 1.55,
        alt: 'Реалистичная 3D-модель шоколадного торта с клубникой',
        name: 'Клубнично-шоколадный торт',
        description: 'Шоколадный торт с клубникой, глазурью и мягкими бисквитными слоями.',
        price: '₺ 280'
      },
      {
        src: modelSource('realistic-layered-dessert-cup.glb'),
        desktopSrc: desktopModelSource('realistic-layered-dessert-cup.glb'),
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
        src: modelSource('turkish-lentil-soup.glb'),
        desktopSrc: modelSource('turkish-lentil-soup.glb'),
        desktopScale: 1,
        alt: '3D-модель турецкого чечевичного супа с лимоном, петрушкой и оливковым маслом',
        name: 'Турецкий чечевичный суп',
        description: 'Горячий суп из красной чечевицы с лимоном, петрушкой, паприкой и оливковым маслом.',
        price: '₺ 190'
      }
    ]
  },
  drink: {
    label: 'НАПИТКИ',
    items: [
      {
        src: modelSource('realistic-yogurt-drink.glb'),
        alt: 'Реалистичная 3D-модель бутылки клубничного йогуртового напитка',
        name: 'Клубничный йогурт',
        description: 'Охлаждённый клубничный йогуртовый напиток.',
        price: '₺ 145'
      },
      {
        src: modelSource('realistic-coffee-cup.glb'),
        alt: 'Реалистичная 3D-модель стакана кофе с крышкой',
        name: 'Кофе Alba',
        description: 'Ароматный кофе в детализированном стакане с крышкой.',
        price: '₺ 135'
      },
      {
        src: modelSource('realistic-strawberry-lemonade.glb'),
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
    catalogLoading: 'Yemek yükleniyor',
    selectedPreparing: 'Seçtiğiniz 3D model AR için hazırlanıyor',
    previewReady: 'Yemek hazır',
    previewDetail: 'İnceleyin veya “Masaya yerleştir”e dokunun',
    surfaceSearching: 'Masa yüzeyi aranıyor',
    moveCamera: 'Telefonu masanın üzerinde yavaşça hareket ettirin',
    dishPlaced: 'Yemek masaya yerleştirildi',
    arGestures: 'Sürükleyin; iki parmakla ölçeklendirin ve döndürün',
    trackingLost: 'Kamera takibi geçici olarak kayboldu',
    restoreTracking: 'Telefonu daha yavaş hareket ettirin ve masaya tekrar doğrultun',
    dishLoadError: 'Yemek yüklenemedi',
    checkConnection: 'Bağlantıyı kontrol edip menüden tekrar seçin',
    arUnavailable: 'Bu cihazda AR açılamadı',
    inlineAvailable: '3D modeli ekranda incelemeye devam edebilirsiniz',
    desktopLoading: 'Sanal restoran hazırlanıyor',
    desktopReady: 'Sanal masa hazır',
    desktopControls: 'Sahneyi sürükleyin, tekerlekle yaklaşın; Shift + tekerlek yemeği döndürür',
    engineError: '3D görüntüleyici başlatılamadı',
    retryPage: 'Sayfayı yenileyip tekrar deneyin'
  },
  ru: {
    catalogLoading: 'Загрузка блюда',
    selectedPreparing: 'Выбранная 3D-модель подготавливается для AR',
    previewReady: 'Блюдо готово',
    previewDetail: 'Рассмотрите его или нажмите «Разместить на столе»',
    surfaceSearching: 'Поиск поверхности стола',
    moveCamera: 'Медленно перемещайте телефон над столом',
    dishPlaced: 'Блюдо размещено на столе',
    arGestures: 'Перемещайте одним пальцем; двумя масштабируйте и поворачивайте',
    trackingLost: 'Камера временно потеряла позицию',
    restoreTracking: 'Двигайте телефон медленнее и снова наведите его на стол',
    dishLoadError: 'Не удалось загрузить блюдо',
    checkConnection: 'Проверьте подключение и снова выберите блюдо в меню',
    arUnavailable: 'AR недоступен на этом устройстве',
    inlineAvailable: '3D-модель по-прежнему можно рассматривать на экране',
    desktopLoading: 'Подготовка виртуального ресторана',
    desktopReady: 'Виртуальный стол готов',
    desktopControls: 'Перетаскивайте сцену, колесом приближайте; Shift + колесо вращает блюдо',
    engineError: 'Не удалось запустить 3D-просмотрщик',
    retryPage: 'Обновите страницу и попробуйте снова'
  }
}[PAGE_LANGUAGE];

const MENU = PAGE_LANGUAGE === 'ru' ? MENU_RU : MENU_TR;
const MAIN_API = 'https://api.albaspace.com.tr';
const AUTH_TOKEN_KEY = 'albaspace_access_token';
const AUTH_RETURN_KEY = 'albaspace_auth_return_to';
const DESKTOP_MODEL_BASE_SCALE = 0.56;

const app = document.querySelector('#ar-app');
const mobileModelViewer = document.querySelector('#mobile-model-viewer');
const arScene = document.querySelector('#ar-scene');
const dishStableStage = document.querySelector('#dish-stable-stage');
const dishRotation = document.querySelector('#dish-rotation');
const dishModel = document.querySelector('#dish-model');
const dishPlate = document.querySelector('#dish-plate');
const desktopEnvironment = document.querySelector('#desktop-environment');
const sceneCamera = document.querySelector('#scene-camera');
const ambientLight = document.querySelector('#ambient-light');
const keyLight = document.querySelector('#key-light');
const experienceUi = document.querySelector('#experience-ui');
const arLaunchButton = document.querySelector('#ar-launch-button');
const arExitButton = document.querySelector('#ar-exit-button');
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
const surfacePrompt = document.querySelector('#surface-prompt');
const viewerDishName = document.querySelector('#viewer-dish-name');
const authGate = document.querySelector('#auth-gate');
const authChecking = document.querySelector('#auth-checking');
const authRequired = document.querySelector('#auth-required');
const loginLink = document.querySelector('#login-link');

const state = {
  user: null,
  category: 'meat',
  dishIndex: 0,
  modelReady: false,
  loadingDish: false,
  requestedSource: '',
  modelMinY: 0,
  zoom: 1,
  rotationZ: 0,
  arStatus: 'not-presenting',
  statusTimer: null,
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

function desktopSource(item) {
  return item.desktopSrc || item.src.replace('/restaurant/ar/', '/restaurant/');
}

function setStatus(label, detail, mode = 'loading', visible = true) {
  statusLabel.textContent = label;
  statusDetail.textContent = detail;
  statusCard.dataset.mode = mode;
  statusCard.hidden = !visible;
}

function setProgress(percent) {
  loadingProgress.style.width = `${clamp(percent, 0, 100)}%`;
}

function hideStatusSoon(delay = 1200) {
  window.clearTimeout(state.statusTimer);
  state.statusTimer = window.setTimeout(() => {
    if (!state.loadingDish && state.arStatus !== 'session-started') statusCard.hidden = true;
  }, delay);
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
      renderMenu();
    });
  });
}

function renderItemButtons() {
  const category = currentCategory();
  itemContainer.innerHTML = category.items.map((item, index) => `
    <button class="menu-item-button${index === state.dishIndex ? ' is-selected' : ''}" type="button" data-index="${index}">
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
    window.setTimeout(() => menuPanel.querySelector('.menu-item-button')?.focus(), 50);
  } else if (document.activeElement && menuPanel.contains(document.activeElement)) {
    menuButton.focus({preventScroll: true});
  }
}

function updateMobilePresentation(item) {
  mobileModelViewer.alt = item.alt;
  mobileModelViewer.exposure = state.category === 'meat' ? 1.27 : 1.15;
  mobileModelViewer.orientation = item.orientation || '0deg 0deg 0deg';
  mobileModelViewer.scale = '1 1 1';
  viewerDishName.textContent = item.name;
}

function applyDesktopTransform() {
  if (!IS_DESKTOP_SCENE || !window.AFRAME?.THREE) return;
  const item = currentDish();
  const categoryScale = state.category === 'meat' ? 0.5 : 1;
  const baseScale = item.desktopScale ?? (DESKTOP_MODEL_BASE_SCALE * categoryScale);
  const scale = baseScale * state.zoom;
  const support = item.desktopSupport || (state.category === 'meat' ? 'board' : null);
  const surfaceZ = support === 'plate' ? 0.035 : (support === 'board' ? 0.028 : 0.015);
  dishModel.setAttribute('scale', `${scale} ${scale} ${scale}`);
  dishModel.setAttribute('position', `0 0 ${surfaceZ - (state.modelMinY * scale)}`);
  const supportScale = (item.desktopSupportScale || 1.35) * state.zoom;
  const supportHeightScale = support === 'plate' ? 0.5 * state.zoom : supportScale;
  dishPlate.setAttribute('scale', `${supportScale} ${supportHeightScale} ${supportScale}`);
  dishRotation.setAttribute('rotation', `0 0 ${state.rotationZ}`);
}

function updateDesktopPresentation(item = currentDish()) {
  const isMeat = state.category === 'meat';
  const support = item.desktopSupport || (isMeat ? 'board' : null);
  const supportSource = support === 'plate'
    ? desktopModelSource('realistic-porcelain-plate.glb')
    : desktopModelSource('wooden-cutting-board.glb');
  dishPlate.setAttribute('visible', String(Boolean(support)));
  if (support) dishPlate.setAttribute('gltf-model', supportSource);
  ambientLight.setAttribute('light', 'intensity', isMeat ? 2.05 : 1.7);
  keyLight.setAttribute('light', 'intensity', isMeat ? 1.45 : 1.2);
}

function measureDesktopModelBottom() {
  const mesh = dishModel.getObject3D('mesh');
  if (!mesh || !window.AFRAME?.THREE) return 0;
  const root = new AFRAME.THREE.Group();
  root.add(mesh.clone(true));
  root.updateMatrixWorld(true);
  const bounds = new AFRAME.THREE.Box3().setFromObject(root);
  root.clear();
  return Number.isFinite(bounds.min.y) ? bounds.min.y : 0;
}

function prepareDish(item) {
  state.modelReady = false;
  state.loadingDish = true;
  state.zoom = 1;
  state.rotationZ = 0;
  state.modelMinY = 0;
  setProgress(4);
  setStatus(COPY.catalogLoading, COPY.selectedPreparing, 'loading', true);

  if (IS_DESKTOP_SCENE) {
    state.requestedSource = desktopSource(item);
    dishModel.setAttribute('visible', 'false');
    dishModel.setAttribute('title', item.alt);
    dishModel.setAttribute('rotation', `90 ${item.desktopRotationY || 0} 0`);
    dishModel.setAttribute('gltf-model', state.requestedSource);
    updateDesktopPresentation(item);
    applyDesktopTransform();
    return;
  }

  state.requestedSource = item.src;
  updateMobilePresentation(item);
  mobileModelViewer.src = item.src;
}

function selectDish(categoryKey, index) {
  if (!MENU[categoryKey]?.items[index]) return;
  state.category = categoryKey;
  state.dishIndex = index;
  renderMenu();
  setMenuOpen(false);
  prepareDish(currentDish());
}

function handleMobileProgress(event) {
  if (IS_DESKTOP_SCENE || !state.loadingDish) return;
  setProgress(Math.max(4, Math.round((event.detail?.totalProgress || 0) * 100)));
}

function handleMobileLoad() {
  if (IS_DESKTOP_SCENE) return;
  mobileModelViewer.pause?.();
  state.modelReady = true;
  state.loadingDish = false;
  setProgress(100);
  if (state.arStatus === 'object-placed') {
    setStatus(COPY.dishPlaced, COPY.arGestures, 'ready', true);
  } else if (state.arStatus === 'session-started') {
    setStatus(COPY.surfaceSearching, COPY.moveCamera, 'scanning', true);
  } else {
    setStatus(COPY.previewReady, COPY.previewDetail, 'ready', true);
    hideStatusSoon(1500);
  }
}

function handleMobileError(event) {
  if (IS_DESKTOP_SCENE) return;
  state.modelReady = false;
  state.loadingDish = false;
  setProgress(0);
  setStatus(COPY.dishLoadError, COPY.checkConnection, 'error', true);
  console.warn('model-viewer failed to load a restaurant model:', event);
}

function handleArStatus(event) {
  if (IS_DESKTOP_SCENE) return;
  const status = event.detail?.status || 'not-presenting';
  state.arStatus = status;
  app.dataset.arStatus = status;
  surfacePrompt.hidden = status !== 'session-started';

  if (status === 'session-started') {
    setStatus(COPY.surfaceSearching, COPY.moveCamera, 'scanning', true);
  } else if (status === 'object-placed') {
    surfacePrompt.hidden = true;
    setStatus(COPY.dishPlaced, COPY.arGestures, 'ready', true);
    hideStatusSoon(1800);
  } else if (status === 'failed') {
    setStatus(COPY.arUnavailable, COPY.inlineAvailable, 'error', true);
  } else if (status === 'not-presenting' && state.modelReady) {
    setStatus(COPY.previewReady, COPY.previewDetail, 'ready', true);
    hideStatusSoon(1000);
  }
}

function handleArTracking(event) {
  if (IS_DESKTOP_SCENE || state.arStatus === 'not-presenting') return;
  if (event.detail?.status === 'not-tracking') {
    setStatus(COPY.trackingLost, COPY.restoreTracking, 'scanning', true);
  } else if (state.arStatus === 'object-placed') {
    setStatus(COPY.dishPlaced, COPY.arGestures, 'ready', true);
    hideStatusSoon(1200);
  } else {
    setStatus(COPY.surfaceSearching, COPY.moveCamera, 'scanning', true);
  }
}

function handleDesktopModelLoaded(event) {
  if (!IS_DESKTOP_SCENE || event.target !== dishModel) return;
  dishModel.removeAttribute('animation');
  dishModel.removeAttribute('animation-mixer');
  state.modelReady = true;
  state.loadingDish = false;
  state.modelMinY = measureDesktopModelBottom();
  applyDesktopTransform();
  dishModel.setAttribute('visible', 'true');
  setProgress(100);
  setStatus(COPY.desktopReady, COPY.desktopControls, 'ready', true);
  hideStatusSoon(1500);
}

function handleDesktopModelError(event) {
  if (!IS_DESKTOP_SCENE || event.target !== dishModel) return;
  state.modelReady = false;
  state.loadingDish = false;
  setProgress(0);
  setStatus(COPY.dishLoadError, COPY.checkConnection, 'error', true);
  console.warn('A-Frame failed to load a restaurant model:', event);
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
    canvas.addEventListener('wheel', (event) => {
      if (event.shiftKey) {
        state.rotationZ += event.deltaY > 0 ? -7.5 : 7.5;
        applyDesktopTransform();
      } else {
        state.desktopDistance = clamp(state.desktopDistance * (event.deltaY > 0 ? 1.08 : 0.92), 1.8, 5.2);
        updateDesktopCamera();
      }
      event.preventDefault();
    }, {passive: false});
    updateDesktopCamera();
  };
  if (arScene.hasLoaded) bind();
  else arScene.addEventListener('loaded', bind, {once: true});
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, {once: true});
      existing.addEventListener('error', reject, {once: true});
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', resolve, {once: true});
    script.addEventListener('error', reject, {once: true});
    document.head.appendChild(script);
  });
}

async function initializeDesktopScene() {
  setStatus(COPY.desktopLoading, COPY.selectedPreparing, 'loading', true);
  try {
    if (!window.AFRAME) await loadScript('https://aframe.io/releases/1.5.0/aframe.min.js');
    if (!arScene.hasLoaded) {
      await new Promise((resolve) => arScene.addEventListener('loaded', resolve, {once: true}));
    }
    desktopEnvironment.setAttribute('visible', 'true');
    ambientLight.setAttribute('light', 'intensity', 1.25);
    keyLight.setAttribute('light', 'intensity', 1.9);
    sceneCamera.setAttribute('fov', '50');
    dishStableStage.setAttribute('visible', 'true');
    dishStableStage.setAttribute('position', '0 0.855 0');
    dishStableStage.setAttribute('rotation', '-90 0 0');
    setupDesktopOrbit();
    prepareDish(currentDish());
  } catch (error) {
    console.error('Desktop restaurant scene failed to initialize:', error);
    setStatus(COPY.engineError, COPY.retryPage, 'error', true);
  }
}

async function waitForModelViewer() {
  if (customElements.get('model-viewer')) return true;
  await Promise.race([
    customElements.whenDefined('model-viewer'),
    new Promise((resolve) => window.setTimeout(resolve, 10000))
  ]);
  return Boolean(customElements.get('model-viewer'));
}

async function initializeMobileExperience() {
  if (!await waitForModelViewer()) {
    setStatus(COPY.engineError, COPY.retryPage, 'error', true);
    return;
  }
  prepareDish(currentDish());
}

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
    return response.ok ? await response.json() : null;
  } catch (error) {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function startExperience() {
  if (IS_DESKTOP_SCENE) await initializeDesktopScene();
  else await initializeMobileExperience();
}

async function initializeSession() {
  if (IS_GUEST_MODE) {
    state.user = {guest: true};
    authChecking.hidden = true;
    authRequired.hidden = true;
    authGate.hidden = true;
    await startExperience();
    return;
  }

  state.user = await checkLogin();
  authChecking.hidden = true;
  if (!state.user?.email) {
    authRequired.hidden = false;
    return;
  }
  authGate.hidden = true;
  await startExperience();
}

function activateMobileAr() {
  setMenuOpen(false);
  if (IS_DESKTOP_SCENE) return;
  if (!state.modelReady || !mobileModelViewer.canActivateAR) {
    setStatus(COPY.arUnavailable, COPY.inlineAvailable, 'error', true);
    return;
  }
  setStatus(COPY.surfaceSearching, COPY.moveCamera, 'scanning', true);
  mobileModelViewer.activateAR();
}

if (!IS_DESKTOP_SCENE) {
  mobileModelViewer.append(arLaunchButton, arExitButton, experienceUi);
} else {
  mobileModelViewer.remove();
  arLaunchButton.remove();
  arExitButton.remove();
}

renderMenu();

menuButton.addEventListener('click', () => setMenuOpen(menuPanel.hidden));
menuClose.addEventListener('click', () => setMenuOpen(false));
recalibrateButton.addEventListener('click', activateMobileAr);
arLaunchButton?.addEventListener('click', () => {
  if (!state.modelReady) setStatus(COPY.catalogLoading, COPY.selectedPreparing, 'loading', true);
});
loginLink.addEventListener('click', () => {
  try {
    sessionStorage.setItem(AUTH_RETURN_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}`);
  } catch (error) {
    console.warn('Return path could not be stored:', error);
  }
});

mobileModelViewer?.addEventListener('progress', handleMobileProgress);
mobileModelViewer?.addEventListener('load', handleMobileLoad);
mobileModelViewer?.addEventListener('error', handleMobileError);
mobileModelViewer?.addEventListener('ar-status', handleArStatus);
mobileModelViewer?.addEventListener('ar-tracking', handleArTracking);
dishModel.addEventListener('model-loaded', handleDesktopModelLoaded);
dishModel.addEventListener('model-error', handleDesktopModelError);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !menuPanel.hidden) setMenuOpen(false);
});

window.addEventListener('pagehide', () => window.clearTimeout(state.statusTimer));

initializeSession();
