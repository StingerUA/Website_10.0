const MENU = {
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

const app = document.querySelector('#ar-app');
const arScene = document.querySelector('#ar-scene');
const dishAnchor = document.querySelector('#dish-anchor');
const dishModel = document.querySelector('#dish-model');
const menuButton = document.querySelector('#menu-button');
const menuPanel = document.querySelector('#menu-panel');
const menuClose = document.querySelector('#menu-close');
const categoryContainer = document.querySelector('#menu-category-buttons');
const itemContainer = document.querySelector('#menu-item-buttons');
const statusCard = document.querySelector('#status-card');
const statusLabel = document.querySelector('#status-label');
const statusDetail = document.querySelector('#status-detail');
const loadingProgress = document.querySelector('#loading-progress');
const captureButton = document.querySelector('#capture-button');
const captureTimer = document.querySelector('#capture-timer');
const cameraFallback = document.querySelector('#camera-start-fallback');

const state = {
  category: 'meat',
  dishIndex: 0,
  arSystem: null,
  arStarted: false,
  targetFound: false,
  modelReady: false,
  loadingDish: false,
  zoom: 1,
  pinchStartDistance: 0,
  pinchStartZoom: 1,
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
  captureFrameId: null
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
  const scale = 0.28 * state.zoom;
  dishModel.setAttribute('scale', `${scale} ${scale} ${scale}`);
  app.style.setProperty('--dish-zoom', state.zoom.toFixed(3));
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
  setStatus('Yemek kataloğu yükleniyor', 'Seçtiğiniz yemek görsel işaretçiye hazırlanıyor', 'loading', true);
  dishModel.setAttribute('visible', 'false');
  dishModel.setAttribute('gltf-model', item.src);
  dishModel.setAttribute('title', item.alt);
  state.zoom = 1;
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
  state.modelReady = true;
  state.loadingDish = false;
  setProgress(100);
  dishModel.setAttribute('visible', 'true');
  if (state.targetFound) {
    setStatus('İşaretçi bulundu', 'Yemek masadaki görsele bağlandı', 'ready', true);
    hideStatusSoon(1100);
  } else {
    setStatus('İşaretçi aranıyor', 'Görseli masanın üzerine gösterin', 'scanning', true);
  }
}

function handleModelError(event) {
  if (event.target !== dishModel) return;
  state.modelReady = false;
  state.loadingDish = false;
  setProgress(0);
  setStatus('Yemek yüklenemedi', 'Lütfen internet bağlantınızı kontrol edin', 'error', true);
  console.warn('AR model load failed:', event);
}

function handleTargetFound() {
  state.targetFound = true;
  if (state.modelReady && !state.loadingDish) {
    setStatus('İşaretçi bulundu', 'Yemek masadaki görsele bağlandı', 'ready', true);
    hideStatusSoon(900);
  } else {
    setStatus('Yemek kataloğu yükleniyor', 'Görsel bulundu, model hazırlanıyor', 'loading', true);
  }
}

function handleTargetLost() {
  state.targetFound = false;
  setStatus('İşaretçi aranıyor', 'Görseli masanın üzerine gösterin', 'scanning', true);
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
    setStatus('İşaretçi aranıyor', 'Görseli masanın üzerine gösterin', 'scanning', true);
  } else {
    setStatus('Yemek kataloğu yükleniyor', 'İlk yemek hazırlanıyor', 'loading', true);
  }
}

function handleArError(event) {
  const code = event.detail?.error || 'VIDEO_FAIL';
  console.warn('MindAR error:', code);
  cameraFallback.hidden = false;
  setStatus('Kamera açılamadı', 'Kamera iznini verin ve tekrar deneyin', 'error', true);
}

function startImageTracking() {
  if (state.arStarted) return;
  const system = arScene.systems['mindar-image-system'];
  if (!system) {
    handleArError({detail: {error: 'SYSTEM_UNAVAILABLE'}});
    return;
  }
  state.arSystem = system;
  state.arStarted = true;
  cameraFallback.hidden = true;
  setStatus('Yemek kataloğu yükleniyor', 'Kamera ve görsel işaretçi hazırlanıyor', 'loading', true);
  system.start();
}

function stopImageTracking() {
  if (!state.arStarted || !state.arSystem) return;
  try { state.arSystem.stop(); } catch (error) { console.warn('MindAR stop failed:', error); }
  state.arStarted = false;
}

function cameraErrorFallback() {
  state.arStarted = false;
  cameraFallback.hidden = false;
  setStatus('Kamera açılamadı', 'Kamera iznini verin ve tekrar deneyin', 'error', true);
}

function stageVideo() {
  if (arScene.hasLoaded) startImageTracking();
  else arScene.addEventListener('loaded', startImageTracking, {once: true});
}

function distanceBetweenTouches(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

function setupZoomControls() {
  app.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 2) return;
    state.pinchStartDistance = distanceBetweenTouches(event.touches);
    state.pinchStartZoom = state.zoom;
    event.preventDefault();
  }, {passive: false});
  app.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 2 || !state.pinchStartDistance) return;
    const distance = distanceBetweenTouches(event.touches);
    state.zoom = clamp(state.pinchStartZoom * distance / state.pinchStartDistance, 0.48, 2.2);
    applyZoom();
    event.preventDefault();
  }, {passive: false});
  const clearPinch = () => { state.pinchStartDistance = 0; };
  app.addEventListener('touchend', clearPinch, {passive: true});
  app.addEventListener('touchcancel', clearPinch, {passive: true});
  app.addEventListener('wheel', (event) => {
    if (!state.targetFound) return;
    state.zoom = clamp(state.zoom * (event.deltaY > 0 ? 0.92 : 1.08), 0.48, 2.2);
    applyZoom();
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
cameraFallback.addEventListener('click', () => {
  cameraFallback.hidden = true;
  startImageTracking();
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
  stopImageTracking();
});

renderMenu();
prepareDish(currentDish());
setupZoomControls();
setupCaptureControl();
window.setTimeout(stageVideo, 0);
