/**
 * scanner-button.js
 * Adds the AR scanner action to model-viewer pages.
 * Preferred order on educational pages:
 * story text -> text toggle -> scanner hint -> scanner button -> MP3 player -> model-viewer.
 */
(function () {
  'use strict';

  function extrasDisabled() {
    return document.body && document.body.dataset.disableModelExtras === 'true';
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

  function place() {
    const els = ensureElements();
    if (!els) return false;

    const player = document.getElementById('albaModelPlayer');
    const viewer = document.querySelector('model-viewer');
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
