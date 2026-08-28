/**
 * scanner-button.js
 * ─────────────────────────────────────────────────────────────
 * Автоматически добавляет кнопку "AR Tarayıcı" под плеером
 * на всех страницах с <model-viewer>.
 * Поддерживает TR / EN / RU.
 * ─────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  function extrasDisabled() {
    return document.body && document.body.dataset.disableModelExtras === 'true';
  }

  if (extrasDisabled()) return;

  function detectLang() {
    const p = window.location.pathname;
    if (p.startsWith('/eng/')) return 'en';
    if (p.startsWith('/rus/')) return 'ru';
    return 'tr';
  }

  const STRINGS = {
    tr: { label: 'AR Tarayıcı ile Görüntüle', hint: 'Kameranı hedef resme tut ve modeli canlı gör' },
    en: { label: 'View in AR Scanner',         hint: 'Point your camera at the target image to see the model live' },
    ru: { label: 'Открыть AR-сканер',          hint: 'Наведи камеру на целевое изображение и увидь модель в живую' },
  };

  const CSS = `
#alba-scanner-btn-wrap {
  display: flex;
  justify-content: center;
  margin: 18px auto 4px;
  max-width: 900px;
  padding: 0 16px;
}
#alba-scanner-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 28px;
  border-radius: 99px;
  border: 1px solid rgba(0,194,255,0.38);
  background: linear-gradient(135deg, rgba(0,80,120,0.55), rgba(0,40,80,0.7));
  color: #38bdf8;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 0 22px rgba(0,194,255,0.12), inset 0 0 12px rgba(0,194,255,0.05);
  backdrop-filter: blur(6px);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
#alba-scanner-btn::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(0,194,255,0.15), transparent 60%);
  opacity: 0;
  transition: opacity 0.25s;
}
#alba-scanner-btn:hover {
  border-color: rgba(0,194,255,0.7);
  color: #7dd3fc;
  box-shadow: 0 0 32px rgba(0,194,255,0.28), inset 0 0 20px rgba(0,194,255,0.08);
  transform: translateY(-1px);
}
#alba-scanner-btn:hover::before { opacity: 1; }
#alba-scanner-btn:active { transform: translateY(0) scale(0.97); }
#alba-scanner-btn svg {
  width: 18px; height: 18px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(0,194,255,0.6));
}
.scanner-btn-pulse {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #00c2ff;
  box-shadow: 0 0 8px #00c2ff;
  flex-shrink: 0;
  animation: scanPulse 1.8s ease-in-out infinite;
}
@keyframes scanPulse {
  0%,100% { opacity: 1; box-shadow: 0 0 8px #00c2ff; transform: scale(1); }
  50%      { opacity: .4; box-shadow: 0 0 3px #00c2ff; transform: scale(.8); }
}
#alba-scanner-hint {
  text-align: center;
  font-size: 11px;
  color: #475569;
  letter-spacing: 0.05em;
  margin: 6px auto 0;
  max-width: 900px;
  padding: 0 16px;
}
@media (max-width: 480px) {
  #alba-scanner-btn { padding: 11px 20px; font-size: 11px; }
}
`;

  function inject() {
    if (extrasDisabled()) return;
    if (!document.querySelector('model-viewer')) return;
    if (document.getElementById('alba-scanner-btn-wrap')) return;

    const lang = detectLang();
    const s = STRINGS[lang];

    // Inject CSS
    if (!document.getElementById('alba-scanner-btn-css')) {
      const style = document.createElement('style');
      style.id = 'alba-scanner-btn-css';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    // Build button wrap
    const wrap = document.createElement('div');
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

    // Hint line
    const hint = document.createElement('div');
    hint.id = 'alba-scanner-hint';
    hint.textContent = s.hint;

    // Find insert point: after #albaModelPlayer, or after model-viewer, or after h1
    const player  = document.getElementById('albaModelPlayer');
    const viewer  = document.querySelector('model-viewer');
    const toggleBtn = document.getElementById('toggleBtn');

    let insertAfter = null;

    // Prefer: after toggle button → after player → after viewer wrapper
    if (toggleBtn) {
      insertAfter = toggleBtn;
    } else if (player) {
      insertAfter = player;
    } else if (viewer) {
      insertAfter = viewer.closest('.viewer-wrapper') || viewer;
    }

    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(wrap, insertAfter.nextSibling);
      insertAfter.parentNode.insertBefore(hint, wrap.nextSibling);
    } else {
      // Fallback: append to container or body
      const cont = document.querySelector('.container, main') || document.body;
      cont.appendChild(wrap);
      cont.appendChild(hint);
    }
  }

  // Wait for DOM + player to be injected (player is injected dynamically)
  function tryInject(attempts) {
    if (extrasDisabled()) return;
    if (document.getElementById('albaModelPlayer') || document.querySelector('model-viewer')) {
      // Give player a moment to fully render, then inject
      setTimeout(inject, 400);
    } else if (attempts > 0) {
      setTimeout(() => tryInject(attempts - 1), 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryInject(20));
  } else {
    tryInject(20);
  }
})();