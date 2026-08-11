// Automatically inject a viewer-wrapper overlay for every <model-viewer>
(function(){
  // Default localized texts. Can be overridden by setting
  // window.MODEL_PRELOADER_TEXTS = { en: {...}, tr: {...} }
    const DEFAULT_TEXTS = {
    tr: {
      loadingText: 'Lütfen bekleyin, 3D model yükleniyor…',
      loadingSubtext: 'Bu işlem internet hızınıza göre birkaç saniye sürebilir.',
      overlayHint: 'AR & 3D deneyimi hazırlanıyor',
      logoText: '',
      errorText: '⚠️ Model yüklenemedi. Lütfen internet bağlantınızı kontrol edin.'
    },
    en: {
      loadingText: 'Please wait — 3D model is loading…',
      loadingSubtext: 'This may take a few seconds depending on your connection.',
      overlayHint: 'Preparing AR & 3D experience',
      logoText: 'ALBASPACE',
      errorText: '⚠️ Failed to load model. Please check your connection.'
    },
    ru: {
      loadingText: 'Пожалуйста, подождите — 3D-модель загружается…',
      loadingSubtext: 'Это может занять несколько секунд в зависимости от вашего соединения.',
      overlayHint: 'Подготовка AR & 3D',
      logoText: 'ALBASPACE',
      errorText: '⚠️ Не удалось загрузить модель. Проверьте соединение или файл.'
    }
  };

  function getTextsForViewer(viewer){
    const global = (window.MODEL_PRELOADER_TEXTS && typeof window.MODEL_PRELOADER_TEXTS === 'object') ? window.MODEL_PRELOADER_TEXTS : {};
    // prefer per-viewer data-lang attribute, otherwise document lang
    const viewerLang = viewer && viewer.dataset && viewer.dataset.lang ? viewer.dataset.lang.split('-')[0] : null;
    const docLang = viewerLang || ((document.documentElement && document.documentElement.lang) ? document.documentElement.lang.split('-')[0] : 'tr');
    const base = Object.assign({}, DEFAULT_TEXTS[docLang] || DEFAULT_TEXTS.tr, global[docLang] || {});

    // allow per-viewer overrides via data- attributes
    const texts = {
      loadingText: viewer.dataset.loadingText || base.loadingText,
      loadingSubtext: viewer.dataset.loadingSubtext || base.loadingSubtext,
      overlayHint: viewer.dataset.overlayHint || base.overlayHint,
      logoText: viewer.dataset.logoText || base.logoText,
      errorText: viewer.dataset.errorText || base.errorText
    };

    if (window.MODEL_PRELOADER_DEBUG) {
      try { console.log('[model-preloader] locale:', docLang, 'texts:', texts); } catch(e){}
    }

    return texts;
  }

  function createOverlayNode(viewer){
    const t = getTextsForViewer(viewer);
    const div = document.createElement('div');
    div.className = 'model-loading-overlay';
    div.setAttribute('aria-live','polite');
    div.setAttribute('aria-busy','true');
    div.innerHTML = `
      <div class="loader-card">
        <div class="loading-logo">
          <img src="/assets/images/albaspace.png" alt="Alba Space" />
        </div>

        <div class="loader-orb"><div class="orb-ring"></div><div class="orb-core"><img src="/assets/images/AlbaLogo.png" alt="" /></div></div>

        <p class="loading-text">${t.loadingText}</p>
        <p class="loading-subtext">${t.loadingSubtext}</p>

        <div class="progress-shell">
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <div class="progress-glow"></div>
        </div>

        <div class="overlay-hint">${t.overlayHint}</div>
      </div>`;
    return div;
  }

  function setViewerInteractivity(viewer, enabled){
    if (!viewer) return;
    viewer.style.pointerEvents = enabled ? 'auto' : 'none';
    viewer.style.touchAction = enabled ? 'auto' : 'none';
  }

  // ── Очередь загрузок: не даём всем model-viewer на странице тянуть
  // тяжёлые .glb одновременно — не больше MAX_CONCURRENT штук разом,
  // остальные ждут своей очереди и стартуют по мере освобождения слотов.
  const MAX_CONCURRENT = 2;
  let activeLoads = 0;
  const loadQueue = [];

  function runNextInQueue(){
    while (activeLoads < MAX_CONCURRENT && loadQueue.length > 0){
      const next = loadQueue.shift();
      activeLoads++;
      next();
    }
  }

  function enqueueLoad(startFn, eager){
    if (eager){
      // hero/приоритетные модели не ждут очереди — стартуют сразу
      activeLoads++;
      startFn();
      return;
    }
    loadQueue.push(startFn);
    runNextInQueue();
  }

  function releaseQueueSlot(){
    activeLoads = Math.max(0, activeLoads - 1);
    runNextInQueue();
  }

  // ── Lazy init: страницы держат тяжёлую модель ниже сгиба (после
  // заголовка/описания/аудио-плеера), поэтому нет смысла качать .glb
  // пока пользователь до него не долистал. Наблюдаем издалека —
  // rootMargin 200px — чтобы модель успела подгрузиться к моменту,
  // когда область реально попадёт в кадр.
  let lazyObserver = null;
  function getLazyObserver(onIntersect){
    if (lazyObserver) return lazyObserver;
    lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting){
          lazyObserver.unobserve(entry.target);
          onIntersect(entry.target);
        }
      });
    }, { rootMargin: '200px' });
    return lazyObserver;
  }

  function attachToViewer(viewer){
    if (!viewer) return;
    if (viewer.closest('.viewer-wrapper')) return; // already wrapped

    const wrapper = document.createElement('div');
    wrapper.className = 'viewer-wrapper';
    wrapper.classList.remove('is-ready');

    // insert wrapper in place of viewer
    viewer.parentNode.insertBefore(wrapper, viewer);
    wrapper.appendChild(viewer);



    const overlay = createOverlayNode(viewer);
    wrapper.insertBefore(overlay, viewer);

    const progressFill = overlay.querySelector('.progress-fill');
    const loadingTextEl = overlay.querySelector('.loading-text');
    const loadingSubtextEl = overlay.querySelector('.loading-subtext');
    const orb = overlay.querySelector('.loader-orb');

    let fallback;
    let raceCheck;
    let completed = false;
    let queueReleased = false;

    const releaseQueueOnce = () => {
      if (queueReleased) return;
      queueReleased = true;
      releaseQueueSlot();
    };

    const hideOverlay = () => {
      if (!overlay || overlay.classList.contains('fade-out')) return;
      overlay.classList.add('fade-out');
      overlay.setAttribute('aria-busy', 'false');
      setTimeout(() => { overlay?.remove(); }, 550);
    };

    const enableViewerInteractivity = () => {
      setViewerInteractivity(viewer, true);
      if (wrapper) wrapper.classList.add('is-ready');
    };

    // ── onComplete: единая точка «модель готова» — раньше этот же набор
    // действий (снять progress, включить интерактивность, спрятать
    // оверлей, погасить таймеры) был продублирован в 4 разных местах
    // (raceCheck, 'load', 'poster-dismissed', fallback-таймаут), из-за
    // чего было легко забыть один из них при правках. Теперь один callback.
    const onComplete = () => {
      if (completed) return;
      completed = true;
      clearTimeout(fallback);
      clearInterval(raceCheck);
      if (progressFill) progressFill.style.width = '100%';
      enableViewerInteractivity();
      hideOverlay();
      releaseQueueOnce();
    };

    const showError = () => {
      clearTimeout(fallback);
      clearInterval(raceCheck);
      if (progressFill) progressFill.style.width = '100%';
      if (progressFill) progressFill.style.backgroundColor = '#ef4444'; // red
      if (loadingTextEl) loadingTextEl.textContent = getTextsForViewer(viewer).errorText;
      if (loadingSubtextEl) loadingSubtextEl.textContent = '';
      if (orb) orb.style.display = 'none';
      releaseQueueOnce();
      // Do not hide overlay automatically on error
    };

    function updateProgress(e){
      const t = (e && e.detail && typeof e.detail.totalProgress === 'number') ? e.detail.totalProgress : null;
      if (t !== null && progressFill){
        const percent = Math.max(0, Math.min(100, Math.round(t*100)));
        progressFill.style.width = percent + '%';
        if (percent >= 100) onComplete();
      }
    }

    // NOTE: we intentionally do NOT disable pointer-events on the viewer while
    // loading anymore — this used to make every AR/camera-control button on the
    // model unusable for the entire load time (up to 2 minutes for large models).
    // The overlay itself already has pointer-events:none, so it never blocked
    // anything on its own; only this call did. Buttons stay clickable immediately,
    // the overlay is purely a visual loading indicator on top.
    if (wrapper) wrapper.classList.remove('is-ready');

    viewer.addEventListener('progress', updateProgress);
    viewer.addEventListener('load', onComplete);
    viewer.addEventListener('poster-dismissed', onComplete);
    viewer.addEventListener('error', () => { showError(); enableViewerInteractivity(); });

    function startWatchers(){
      // ── ФИКС ГОНКИ: заглушка/маленькая модель могла загрузиться
      // до того как мы повесили слушатели (скрипт грузится async).
      // Проверяем уже через 300мс и каждые 500мс до 10с.
      raceCheck = setInterval(() => {
        try {
          // model-viewer выставляет .loaded = true когда модель готова
          if (viewer.loaded) onComplete();
        } catch (e) { /* ignore */ }
      }, 300);
      setTimeout(() => clearInterval(raceCheck), 10000); // максимум 10 сек polling

      // Improved fallback: detect file size and adjust timeout accordingly
      // Large files (>20MB) may need more time on slower connections
      let timeoutDuration = 60000; // Default 60 seconds
      const src = viewer.getAttribute('src') || viewer.dataset.src || '';
      if (src.includes('imece') || src.includes('turksat-5') || src.includes('hubble') ||
          src.includes('lagari') || src.includes('gokturk-1')) {
        // These are known large models
        timeoutDuration = 120000; // 120 seconds for large models
      }
      fallback = setTimeout(onComplete, timeoutDuration);
    }

    // if viewer becomes removed, cleanup (raceCheck AND fallback — a removed
    // element can no longer fire 'load'/'error', so both timers must stop
    // right away instead of leaking until their own timeout expires)
    const obs = new MutationObserver(() => {
      if (!document.body.contains(viewer)){
        clearTimeout(fallback);
        clearInterval(raceCheck);
        releaseQueueOnce();
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // ── Lazy vs eager loading ──
    // Pages use data-src (not src) for models that should wait until
    // scrolled near. A plain "src" already present in the HTML (legacy
    // pages, or pages that set src themselves via JS e.g. protected/
    // premium models) is left completely alone — already-loading models
    // just get the overlay/queue-release bookkeeping above, unchanged.
    const lazySrc = viewer.dataset.src;
    const isEager = viewer.getAttribute('data-preload') === 'eager';

    if (lazySrc && !viewer.getAttribute('src')){
      const startLoad = () => {
        startWatchers();
        viewer.setAttribute('src', lazySrc);
      };
      if (isEager){
        enqueueLoad(startLoad, true);
      } else {
        getLazyObserver((el) => enqueueLoad(startLoad, false)).observe(wrapper);
      }
    } else {
      // already has a real src (or will get one from other page logic) —
      // behave exactly as before: start watching immediately, no queueing.
      startWatchers();
    }
  }

  function init(){
    const viewers = document.querySelectorAll('model-viewer');
    if (!viewers || viewers.length === 0) return;

    viewers.forEach(attachToViewer);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();