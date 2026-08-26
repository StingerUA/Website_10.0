const MENU = {
  meat: {
    label: 'МЯСНЫЕ БЛЮДА',
    items: [
      {
        src: '/assets/models/restaurant/steak.glb',
        alt: '3D-модель стейка на гриле с зеленью и лимоном',
        name: 'Стейк на гриле',
        description: 'Сочный стейк, свежая зелень и цитрусовый акцент.',
        price: '₺ 420'
      },
      {
        src: '/assets/models/restaurant/lamb-chops.glb',
        alt: '3D-модель каре ягнёнка на тарелке',
        name: 'Каре ягнёнка',
        description: 'Нежное каре ягнёнка, зелень и соус с травами.',
        price: '₺ 510'
      }
    ]
  },
  dessert: {
    label: 'ДЕСЕРТЫ',
    items: [
      {
        src: '/assets/models/restaurant/dessert.glb',
        alt: '3D-модель трио мини-десертов с кремом и ягодами',
        name: 'Трио мини-десертов',
        description: 'Нежный крем, шоколадная основа и свежие ягоды.',
        price: '₺ 190'
      },
      {
        src: '/assets/models/restaurant/chocolate-cake.glb',
        alt: '3D-модель шоколадного торта с ягодами',
        name: 'Шоколадный торт',
        description: 'Плотный шоколадный бисквит, крем и ягоды.',
        price: '₺ 220'
      }
    ]
  },
  drink: {
    label: 'НАПИТКИ',
    items: [
      {
        src: '/assets/models/restaurant/drink.glb',
        alt: '3D-модель цитрусового напитка в стакане',
        name: 'Citrus Spark',
        description: 'Холодный цитрусовый напиток с лёгкой газированной нотой.',
        price: '₺ 95'
      },
      {
        src: '/assets/models/restaurant/latte.glb',
        alt: '3D-модель латте на блюдце',
        name: 'Alba Latte',
        description: 'Мягкий латте с молочной пеной и ароматом кофе.',
        price: '₺ 120'
      }
    ]
  }
};

const video = document.querySelector('#camera-feed');
const stage = document.querySelector('#dish-stage');
const card = document.querySelector('#dish-card');
const model = document.querySelector('#dish-model');
const pointer = document.querySelector('#hand-pointer');
const trackingLed = document.querySelector('#tracking-led');
const trackingLabel = document.querySelector('#tracking-label');
const trackingDetail = document.querySelector('#tracking-detail');
const startButton = document.querySelector('#start-camera');
const resetButton = document.querySelector('#reset-dish');
const prevDishButton = document.querySelector('#dish-prev');
const nextDishButton = document.querySelector('#dish-next');
const dishPosition = document.querySelector('#dish-position');
const categoryButtons = [...document.querySelectorAll('.category-button')];
const helpDialog = document.querySelector('#help-dialog');
const helpButton = document.querySelector('#help-button');
const closeHelp = document.querySelector('#close-help');

const state = {
  category: 'meat',
  dishIndex: 0,
  cameraStream: null,
  handLandmarker: null,
  cameraRunning: false,
  handTrackingAvailable: false,
  lastVideoTime: -1,
  grabbed: false,
  grabbedBy: null,
  offsetX: 0,
  offsetY: 0,
  lastHandSeenAt: 0,
  manualPointerId: null,
  statusTimeout: null
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCurrentCategory() {
  return MENU[state.category] || MENU.meat;
}

function getCurrentDish() {
  const category = getCurrentCategory();
  return category.items[state.dishIndex] || category.items[0];
}

function setTrackingStatus(label, detail, mode = 'ready') {
  trackingLabel.textContent = label;
  trackingDetail.textContent = detail;
  trackingLed.classList.toggle('is-off', mode === 'off');
  trackingLed.classList.toggle('is-ready', mode === 'ready');
  trackingLed.classList.toggle('is-holding', mode === 'holding');
}

function setTemporaryStatus(label, detail, mode, duration = 1700) {
  clearTimeout(state.statusTimeout);
  setTrackingStatus(label, detail, mode);
  state.statusTimeout = window.setTimeout(() => {
    state.statusTimeout = null;
    if (state.grabbed) {
      setTrackingStatus('Тарелка в руке', 'Переместите руку и разожмите пальцы', 'holding');
    } else if (state.cameraRunning && state.handTrackingAvailable) {
      setTrackingStatus('Правая рука найдена', 'Сведите большой и указательный пальцы', 'ready');
    }
  }, duration);
}

function updateDishInfo(item) {
  const category = getCurrentCategory();
  document.querySelector('#dish-category').textContent = category.label;
  document.querySelector('#dish-name').textContent = item.name;
  document.querySelector('#dish-description').textContent = item.description;
  document.querySelector('#dish-price').textContent = item.price;
  dishPosition.textContent = `${state.dishIndex + 1} / ${category.items.length}`;
  prevDishButton.disabled = category.items.length <= 1;
  nextDishButton.disabled = category.items.length <= 1;
  prevDishButton.setAttribute('aria-label', `Предыдущее блюдо: ${item.name}`);
  nextDishButton.setAttribute('aria-label', `Следующее блюдо: ${item.name}`);
  model.alt = item.alt;
  model.src = item.src;
}

function renderDish() {
  updateDishInfo(getCurrentDish());
}

function selectCategory(categoryKey) {
  if (!MENU[categoryKey] || state.category === categoryKey) return;
  state.category = categoryKey;
  state.dishIndex = 0;
  categoryButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.category === categoryKey));
  resetDish({ announce: false });
  renderDish();
  const item = getCurrentDish();
  setTemporaryStatus('Категория изменена', `${item.name} — блюдо 1 из ${getCurrentCategory().items.length}`, 'ready', 1200);
}

function shiftDish(direction) {
  const category = getCurrentCategory();
  if (category.items.length <= 1) return;
  state.dishIndex = (state.dishIndex + direction + category.items.length) % category.items.length;
  resetDish({ announce: false });
  renderDish();
  const item = getCurrentDish();
  setTemporaryStatus('Блюдо меняется', `${item.name} — блюдо ${state.dishIndex + 1} из ${category.items.length}`, 'ready', 1200);
}

function stagePoint(clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  return {
    x: clamp(clientX, rect.left, rect.right),
    y: clamp(clientY, rect.top, rect.bottom),
    rect
  };
}

function placeCard(clientX, clientY) {
  const { x, y, rect } = stagePoint(clientX, clientY);
  const halfW = card.offsetWidth / 2;
  const halfH = card.offsetHeight / 2;
  const nextX = clamp(x + state.offsetX, rect.left + halfW, rect.right - halfW);
  const nextY = clamp(y + state.offsetY, rect.top + halfH, rect.bottom - halfH);
  card.style.left = `${nextX - rect.left}px`;
  card.style.top = `${nextY - rect.top}px`;
  return { x: nextX, y: nextY };
}

function setCardCenter() {
  const rect = stage.getBoundingClientRect();
  state.offsetX = 0;
  state.offsetY = 0;
  card.style.left = `${rect.width / 2}px`;
  card.style.top = `${rect.height / 2}px`;
}

function resetDish({ announce = true } = {}) {
  setCardCenter();
  card.classList.remove('is-grabbed');
  card.classList.remove('is-placed');
  state.grabbed = false;
  state.grabbedBy = null;
  if (!announce) return;
  setTemporaryStatus(
    state.cameraRunning ? 'Блюдо в центре стола' : 'Камера выключена',
    state.cameraRunning ? 'Сведите пальцы над тарелкой, чтобы взять её' : 'Нажмите «Включить AR»',
    state.cameraRunning ? 'ready' : 'off',
    900
  );
}

function dishContains(clientX, clientY) {
  const rect = card.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.43;
  return Math.hypot(clientX - centerX, clientY - centerY) <= radius;
}

function beginGrab(clientX, clientY, source) {
  if (state.grabbed || !dishContains(clientX, clientY)) return false;
  const rect = card.getBoundingClientRect();
  state.offsetX = rect.left + rect.width / 2 - clientX;
  state.offsetY = rect.top + rect.height / 2 - clientY;
  state.grabbed = true;
  state.grabbedBy = source;
  card.classList.add('is-grabbed');
  setTrackingStatus('Тарелка в руке', 'Переместите руку и разожмите пальцы', 'holding');
  placeCard(clientX, clientY);
  return true;
}

function releaseGrab() {
  if (!state.grabbed) return;
  state.grabbed = false;
  state.grabbedBy = null;
  state.offsetX = 0;
  state.offsetY = 0;
  card.classList.remove('is-grabbed');
  card.classList.remove('is-placed');
  requestAnimationFrame(() => card.classList.add('is-placed'));
  window.setTimeout(() => card.classList.remove('is-placed'), 650);
  setTemporaryStatus('Тарелка поставлена', 'Можно выбрать другое блюдо или переместить это', 'ready', 1800);
}

function updateHandPointer(clientX, clientY, pinching) {
  pointer.style.position = 'fixed';
  pointer.style.left = `${clientX}px`;
  pointer.style.top = `${clientY}px`;
  pointer.classList.add('is-visible');
  pointer.classList.toggle('is-pinching', pinching);
}

function hideHandPointer() {
  pointer.classList.remove('is-visible', 'is-pinching');
}

function getRightHand(results) {
  const hands = results?.landmarks || [];
  if (!hands.length) return null;
  const labels = results.handedness || results.handednesses || [];
  for (let index = 0; index < hands.length; index += 1) {
    const label = labels[index]?.[0]?.categoryName || labels[index]?.[0]?.displayName || '';
    if (String(label).toLowerCase() === 'right') return hands[index];
  }
  // Some older CDN builds omit handedness labels. Use the first detected hand
  // rather than disabling the interaction completely; the UI still explains
  // that the intended control is the user's right hand.
  return hands[0];
}

function handleHand(hand) {
  const indexTip = hand[8];
  const thumbTip = hand[4];
  if (!indexTip || !thumbTip) return;

  const rect = stage.getBoundingClientRect();
  // The rear-facing camera is not mirrored, so keep normalized x unchanged.
  const clientX = rect.left + indexTip.x * rect.width;
  const clientY = rect.top + indexTip.y * rect.height;
  const pinchDistance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  const pinching = pinchDistance < 0.065;
  state.lastHandSeenAt = performance.now();
  updateHandPointer(clientX, clientY, pinching);

  if (pinching && !state.grabbed) {
    beginGrab(clientX, clientY, 'hand');
  } else if (!pinching && state.grabbed && state.grabbedBy === 'hand') {
    releaseGrab();
  }
  if (state.grabbed && state.grabbedBy === 'hand') placeCard(clientX, clientY);
  if (!state.grabbed && !pinching && !state.statusTimeout) {
    setTrackingStatus('Правая рука найдена', 'Сведите большой и указательный пальцы', 'ready');
  }
}

function readHandLandmarks(now) {
  if (!state.cameraRunning || !state.handLandmarker || video.readyState < 2) return;
  if (video.currentTime !== state.lastVideoTime) {
    state.lastVideoTime = video.currentTime;
    const results = state.handLandmarker.detectForVideo(video, now);
    const rightHand = getRightHand(results);
    if (rightHand) {
      handleHand(rightHand);
    } else {
      hideHandPointer();
      if (state.grabbed && state.grabbedBy === 'hand') releaseGrab();
      if (now - state.lastHandSeenAt > 400) {
        setTrackingStatus('Правая рука не найдена', 'Покажите правую руку в кадре', 'ready');
      }
    }
  }
  requestAnimationFrame(readHandLandmarks);
}

async function createHandTracker() {
  const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.js');
  const resolver = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
  return vision.HandLandmarker.createFromOptions(resolver, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.58,
    minHandPresenceConfidence: 0.58,
    minTrackingConfidence: 0.55
  });
}

function stopCamera() {
  state.cameraRunning = false;
  state.handTrackingAvailable = false;
  state.handLandmarker?.close?.();
  state.handLandmarker = null;
  state.cameraStream?.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  video.srcObject = null;
  video.classList.remove('is-live');
  hideHandPointer();
  if (state.grabbed) releaseGrab();
  startButton.classList.remove('is-active');
  startButton.textContent = '◉  Включить AR';
  setTrackingStatus('Камера выключена', 'Нажмите «Включить AR»', 'off');
}

async function startCamera() {
  if (state.cameraRunning) {
    stopCamera();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    state.handTrackingAvailable = false;
    setTrackingStatus('Камера недоступна', 'Перетаскивайте блюдо пальцем или мышью', 'off');
    startButton.textContent = 'Камера недоступна';
    return;
  }

  startButton.disabled = true;
  startButton.textContent = 'Подготовка AR…';
  setTrackingStatus('Запрашиваем камеру', 'Разрешите доступ в окне браузера', 'off');
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = state.cameraStream;
    await video.play();
    video.classList.add('is-live');
    state.cameraRunning = true;
    setTrackingStatus('Загружаем hand-tracking', 'Модель работает локально на устройстве', 'ready');
    try {
      state.handLandmarker = await createHandTracker();
      state.handTrackingAvailable = true;
      setTrackingStatus('Покажите правую руку', 'Сведите пальцы над тарелкой, чтобы взять её', 'ready');
      requestAnimationFrame(readHandLandmarks);
    } catch (handError) {
      console.warn('Hand tracking unavailable:', handError);
      state.handTrackingAvailable = false;
      setTrackingStatus('Камера активна', 'Hand-tracking недоступен — используйте drag fallback', 'ready');
    }
    startButton.classList.add('is-active');
    startButton.textContent = 'Остановить AR';
  } catch (error) {
    console.warn('Camera permission or device error:', error);
    stopCamera();
    setTrackingStatus('Камера не запущена', 'Разрешите доступ или перетаскивайте блюдо пальцем', 'off');
  } finally {
    startButton.disabled = false;
  }
}

function setupManualDrag() {
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'touch' || !state.handTrackingAvailable) {
      if (beginGrab(event.clientX, event.clientY, 'manual')) {
        state.manualPointerId = event.pointerId;
        stage.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }
    }
  });
  stage.addEventListener('pointermove', (event) => {
    if (state.grabbed && state.grabbedBy === 'manual' && state.manualPointerId === event.pointerId) {
      placeCard(event.clientX, event.clientY);
      event.preventDefault();
    }
  });
  const endManual = (event) => {
    if (state.grabbedBy === 'manual' && state.manualPointerId === event.pointerId) {
      state.manualPointerId = null;
      releaseGrab();
    }
  };
  stage.addEventListener('pointerup', endManual);
  stage.addEventListener('pointercancel', endManual);
  stage.addEventListener('lostpointercapture', endManual);
}

function setupHelp() {
  helpButton.addEventListener('click', () => { helpDialog.hidden = false; closeHelp.focus(); });
  closeHelp.addEventListener('click', () => { helpDialog.hidden = true; helpButton.focus(); });
  helpDialog.addEventListener('click', (event) => { if (event.target === helpDialog) helpDialog.hidden = true; });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') helpDialog.hidden = true; });
}

categoryButtons.forEach((button) => button.addEventListener('click', () => selectCategory(button.dataset.category)));
prevDishButton.addEventListener('click', () => shiftDish(-1));
nextDishButton.addEventListener('click', () => shiftDish(1));
startButton.addEventListener('click', startCamera);
resetButton.addEventListener('click', () => resetDish());
window.addEventListener('resize', () => resetDish({ announce: false }));
window.addEventListener('pagehide', stopCamera);
setupManualDrag();
setupHelp();
renderDish();

// The card is placed after layout so its initial center remains exact on all screens.
window.requestAnimationFrame(() => resetDish({ announce: false }));
