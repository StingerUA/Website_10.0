/**
 * scanner-button.js
 * Adds the AR scanner action to model-viewer pages.
 * Preferred order on educational pages:
 * story text -> text toggle -> scanner hint -> scanner button -> MP3 player -> model-viewer.
 */
(function () {
  'use strict';

  function extrasDisabled() {
    return document.body && (document.body.dataset.disableModelExtras === 'true' || document.body.dataset.disableScanner === 'true');
  }

  if (extrasDisabled()) return;

  function detectLang() {
    const p = (window.location && window.location.pathname) || '';
    if (p.startsWith('/eng/')) return 'en';
    if (p.startsWith('/rus/')) return 'ru';
    if (p.startsWith('/ar/')) return 'ar';
    return 'tr';
  }

  const STRINGS = {
    tr: { label: 'AR Tarayıcı ile Görüntüle', hint: 'Kameranı hedef resme tut ve modeli canlı gör' },
    en: { label: 'View in AR Scanner', hint: 'Point your camera at the target image to see the model live' },
    ru: { label: 'Открыть AR-сканер', hint: 'Наведи камеру на целевое изображение и увидь модель вживую' },
    ar: { label: 'فتح ماسح الواقع المعزز', hint: 'وجّه الكاميرا إلى الصورة الهدف لرؤية النموذج مباشرة' }
  };

  const CSS = `
#alba-scanner-btn-wrap{display:flex;justify-content:center;margin:6px auto 10px;max-width:900px;padding:0 16px}
#alba-scanner-btn{display:inline-flex;align-items:center;gap:10px;padding:13px 28px;border-radius:99px;border:1px solid rgba(0,194,255,.38);background:linear-gradient(135deg,rgba(0,80,120,.55),rgba(0,40,80,.7));color:#38bdf8;font-family:'Courier New',monospace;font-size:13px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;text-decoration:none;cursor:pointer;box-shadow:0 0 22px rgba(0,194,255,.12),inset 0 0 12px rgba(0,194,255,.05);backdrop-filter:blur(6px);transition:all .25s ease;position:relative;overflow:hidden}
#alba-scanner-btn::before{content:'';position:absolute;inset:-1px;border-radius:inherit;background:linear-gradient(135deg,rgba(0,194,255,.15),transparent 60%);opacity:0;transition:opacity .25s}
#alba-scanner-btn:hover{border-color:rgba(0,194,255,.7);color:#7dd3fc;box-shadow:0 0 32px rgba(0,194,255,.28),inset 0 0 20px rgba(0,194,255,.08);transform:translateY(-1px)}
#alba-scanner-btn:hover::before{opacity:1}#alba-scanner-btn:active{transform:translateY(0) scale(.97)}
#alba-scanner-btn svg{width:18px;height:18px;flex-shrink:0;filter:drop-shadow(0 0 4px rgba(0,194,255,.6))}
.scanner-btn-pulse{width:8px;height:8px;border-radius:50%;background:#00c2ff;box-shadow:0 0 8px #00c2ff;flex-shrink:0;animation:scanPulse 1.8s ease-in-out infinite}
@keyframes scanPulse{0%,100%{opacity:1;box-shadow:0 0 8px #00c2ff;transform:scale(1)}50%{opacity:.4;box-shadow:0 0 3px #00c2ff;transform:scale(.8)}}
.alba-direct-ar-action{text-align:center;margin:12px auto 18px;max-width:650px}.alba-direct-ar-button{padding:12px 22px;border-radius:999px;background:#083b5c;border:1px solid #49c8f2;color:#effaff;font:600 14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}.alba-direct-ar-button:disabled{opacity:.48;cursor:not-allowed}.alba-direct-ar-status{margin:8px auto;color:#a9def5;font:13px/1.5 system-ui,sans-serif}.alba-direct-ar-status[hidden]{display:none!important}
#alba-scanner-hint{text-align:center;font-size:11px;color:#64748b;letter-spacing:.05em;margin:10px auto 0;max-width:900px;padding:0 16px}
@media(max-width:480px){#alba-scanner-btn{padding:11px 20px;font-size:11px}}
`;

  function ensureCss() {
    if (document.getElementById('alba-scanner-btn-css')) return;
    const style = document.createElement('style');
    style.id = 'alba-scanner-btn-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function ensureElements() {
    if (extrasDisabled() || !document.querySelector('model-viewer')) return null;
    ensureCss();

    const lang = detectLang();
    const s = STRINGS[lang] || STRINGS.tr;

    let wrap = document.getElementById('alba-scanner-btn-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'alba-scanner-btn-wrap';
      wrap.innerHTML = `
        <a id="alba-scanner-btn" href="/scanner/" aria-label="${s.label}">
          <span class="scanner-btn-pulse"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          ${s.label}
        </a>`;
    }

    let hint = document.getElementById('alba-scanner-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'alba-scanner-hint';
    }
    hint.textContent = s.hint;

    return { wrap, hint };
  }

  // A direct AR action stays available even when model-viewer's built-in AR
  // control is hidden by an unsupported browser or a failed native hand-off.
  // The separate image-target scanner link below remains unchanged.
  function ensureDirectAR(viewer) {
    if (!viewer || viewer.dataset.albaDirectArReady || !viewer.hasAttribute('ar')) return;
    if (viewer.closest('[data-no-alba-ar-fix]')) return;
    viewer.dataset.albaDirectArReady = 'true';
    const lang = detectLang();
    const messages = {
      tr: ['3D modeli AR ile görüntüle', 'AR kullanılamıyor. Android Chrome ve Google Play Hizmetleri (AR) uygulamasını kontrol edin. iPhone’da Safari kullanın.', 'AR başlatılamadı. Desteklenen bir cihazda Chrome veya Safari ile deneyin.', 'AR yükleniyor…'],
      en: ['View 3D model in AR', 'AR is unavailable. Use Chrome with Google Play Services for AR on Android, or Safari on iPhone.', 'AR did not start. Try Chrome or Safari on a compatible device.', 'Loading AR…'],
      ru: ['Просмотреть 3D-модель в AR', 'AR недоступна. На Android используйте Chrome и Google Play Services for AR, на iPhone — Safari.', 'Не удалось запустить AR. Попробуйте Chrome или Safari на совместимом устройстве.', 'Загрузка AR…'],
      ar: ['عرض نموذج ثلاثي الأبعاد بالواقع المعزز', 'الواقع المعزز غير متاح. استخدم Chrome على Android أو Safari على iPhone.', 'تعذر تشغيل الواقع المعزز على هذا الجهاز.', 'جارٍ تحميل الواقع المعزز…']
    };
    const t = messages[lang] || messages.tr;
    const box = document.createElement('div');
    box.className = 'alba-direct-ar-action';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'alba-direct-ar-button';
    button.textContent = t[0];
    const status = document.createElement('p');
    status.className = 'alba-direct-ar-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    box.append(button, status);
    function message(value) { status.textContent = value; status.hidden = !value; }
    function modelIsLoaded() { return Boolean(viewer.loaded && viewer.getAttribute('src')); }
    function updateButton() { button.disabled = !modelIsLoaded(); button.title = button.disabled ? t[3] : t[0]; }
    updateButton();
    viewer.addEventListener('load', () => { message(''); updateButton(); });
    viewer.addEventListener('error', () => { updateButton(); });
    viewer.addEventListener('ar-status', (event) => {
      if (event.detail?.status === 'failed') message(t[2]);
      if (event.detail?.status === 'session-started' || event.detail?.status === 'object-placed') message('');
    });
    button.addEventListener('click', () => {
      if (!modelIsLoaded()) { updateButton(); return; }
      if (!viewer.canActivateAR || typeof viewer.activateAR !== 'function') { message(t[1]); return; }
      // Scene Viewer/Quick Look cannot fetch blob: URLs from a separate app.
      // Keep those authorized models in the browser's WebXR mode; never make
      // paid model files public to work around the external-app restriction.
      const source = viewer.getAttribute('src') || '';
      if (/^blob:/i.test(source)) viewer.setAttribute('ar-modes', 'webxr');
      message('');
      try {
        Promise.resolve(viewer.activateAR()).catch(() => message(t[2]));
      } catch (_) { message(t[2]); }
    });
    const anchor = viewer.closest('.mv-btn-anchor') || viewer;
    anchor.insertAdjacentElement('afterend', box);
  }

  function place() {
    const els = ensureElements();
    if (!els) return false;

    const player = document.getElementById('albaModelPlayer');
    const viewer = document.querySelector('model-viewer');
    document.querySelectorAll('model-viewer[ar]').forEach(ensureDirectAR);
    const toggle = document.getElementById('toggleBtn');
    const target = player || viewer;

    if (!target || !target.parentNode) return false;

    const parent = target.parentNode;

    // If there is no player yet, staying after the text toggle keeps the scanner below the story.
    if (!player && toggle && toggle.parentNode === parent) {
      parent.insertBefore(els.hint, toggle.nextSibling);
      parent.insertBefore(els.wrap, els.hint.nextSibling);
      return false;
    }

    // Hint first, then the button itself immediately before the MP3 player.
    parent.insertBefore(els.hint, target);
    parent.insertBefore(els.wrap, target);
    return !!player;
  }

  function boot() {
    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      const done = place();
      if (done || attempts >= 40) clearInterval(timer);
    }, 150);
    place();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
