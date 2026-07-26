/**
 * google-login-prompt.js
 * Shows a Google sign-in suggestion popup (desktop: full card, mobile: mini button)
 * Only for non-logged-in users. Disappears after login or manual dismiss.
 * Respects "don't show again" choice for 7 days.
 */
(function () {
  'use strict';

  var STORAGE_KEY  = 'alba_login_prompt_dismissed';
  var DELAY_MS     = 3500;   // show after 3.5s
  var AUTO_HIDE_MS = 12000;  // auto-hide after 12s if not interacted
  var SNOOZE_DAYS  = 7;

  /* ── helpers ─────────────────────────────────────────────────────── */
  function isDismissed() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (!v) return false;
      return Date.now() < parseInt(v, 10);
    } catch (e) { return false; }
  }

  function dismiss(permanent) {
    try {
      var until = permanent
        ? Date.now() + SNOOZE_DAYS * 86400 * 1000
        : Date.now() + 3600 * 1000; // hide for 1h on soft-close
      localStorage.setItem(STORAGE_KEY, String(until));
    } catch (e) {}
  }

  function isLoggedIn() {
    /* worker-auth sets this after checkUser() */
    try {
      var av = document.getElementById('accountAvatar');
      if (av && av.src && !av.src.includes('alien.png')) return true;
      /* also check localStorage fallback */
      var u = localStorage.getItem('user');
      if (u) { var p = JSON.parse(u); return !!(p && p.id); }
    } catch (e) {}
    return false;
  }

  function getLang() {
    var p = window.location.pathname || '/';
    if (p.startsWith('/eng/')) return 'en';
    if (p.startsWith('/rus/')) return 'ru';
    return 'tr';
  }

  var STRINGS = {
    tr: {
      title:     'Alba Space\'a Hoş Geldiniz',
      subtitle:  'Modellere erişmek ve alışveriş yapmak için giriş yapın.',
      btn:       'Google ile Giriş Yap',
      dismiss:   'Daha sonra',
      mini:      'Google ile Giriş Yap',
    },
    en: {
      title:     'Welcome to Alba Space',
      subtitle:  'Sign in to access models and make purchases.',
      btn:       'Sign in with Google',
      dismiss:   'Maybe later',
      mini:      'Sign in with Google',
    },
    ru: {
      title:     'Добро пожаловать в Alba Space',
      subtitle:  'Войдите для доступа к моделям и покупкам.',
      btn:       'Войти через Google',
      dismiss:   'Позже',
      mini:      'Войти через Google',
    },
  };

  /* ── CSS ─────────────────────────────────────────────────────────── */
  var CSS = `
    /* ── Desktop card ── */
    .alba-login-prompt {
      position: fixed;
      top: 72px;
      right: 20px;
      z-index: 2147483000;
      width: 320px;
      background: #0f172a;
      border: 1px solid rgba(0,194,255,0.3);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,194,255,0.08);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      opacity: 0;
      transform: translateY(-12px) scale(0.96);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }
    .alba-login-prompt.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .alba-login-prompt.hiding {
      opacity: 0;
      transform: translateY(-10px) scale(0.96);
    }

    .alp-top {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .alp-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
      object-fit: contain;
      background: rgba(0,194,255,0.08);
      padding: 4px;
    }
    .alp-text { flex: 1; }
    .alp-title {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 4px;
      line-height: 1.3;
    }
    .alp-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }
    .alp-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
    }
    .alp-close:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }

    .alp-google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 11px 16px;
      background: #fff;
      color: #1f2937;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: box-shadow 0.18s, transform 0.15s;
      font-family: inherit;
    }
    .alp-google-btn:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      transform: translateY(-1px);
    }
    .alp-google-btn:active { transform: scale(0.98); }
    .alp-google-btn img { width: 18px; height: 18px; flex-shrink: 0; }

    .alp-dismiss {
      background: none;
      border: none;
      color: #64748b;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      padding: 0;
      font-family: inherit;
      transition: color 0.15s;
    }
    .alp-dismiss:hover { color: #94a3b8; }

    /* ── Mobile mini button ── */
    .alba-login-mini {
      position: fixed;
      top: 68px;
      right: 12px;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      background: #fff;
      color: #1f2937;
      border: none;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      font-family: inherit;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }
    .alba-login-mini.visible {
      opacity: 1;
      transform: translateX(0);
      pointer-events: all;
    }
    .alba-login-mini.hiding {
      opacity: 0;
      transform: translateX(20px);
    }
    .alba-login-mini img { width: 18px; height: 18px; flex-shrink: 0; }

    .alba-login-mini-close {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #1f2937;
      color: #fff;
      border: none;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }

    @media (min-width: 768px) { .alba-login-mini { display: none !important; } }
    @media (max-width: 767px) { .alba-login-prompt { display: none !important; } }
  `;

  /* ── inject CSS ──────────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('alba-login-prompt-css')) return;
    var s = document.createElement('style');
    s.id = 'alba-login-prompt-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── build & show ────────────────────────────────────────────────── */
  function show() {
    if (isDismissed() || isLoggedIn()) return;

    injectCSS();
    var lang = getLang();
    var t = STRINGS[lang] || STRINGS.tr;
    var GOOGLE_LOGO = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
    var ALBA_LOGO   = '/assets/images/albamenai.png';

    /* ── Desktop card ── */
    var card = document.createElement('div');
    card.className = 'alba-login-prompt';
    card.innerHTML =
      '<div class="alp-top">' +
        '<img class="alp-logo" src="' + ALBA_LOGO + '" alt="Alba Space">' +
        '<div class="alp-text">' +
          '<p class="alp-title">' + t.title + '</p>' +
          '<p class="alp-subtitle">' + t.subtitle + '</p>' +
        '</div>' +
        '<button class="alp-close" aria-label="Kapat">×</button>' +
      '</div>' +
      '<button class="alp-google-btn">' +
        '<img src="' + GOOGLE_LOGO + '" alt="Google">' +
        t.btn +
      '</button>' +
      '<button class="alp-dismiss">' + t.dismiss + '</button>';

    document.body.appendChild(card);

    /* ── Mobile mini ── */
    var mini = document.createElement('button');
    mini.className = 'alba-login-mini';
    mini.setAttribute('aria-label', t.mini);
    mini.innerHTML =
      '<img src="' + GOOGLE_LOGO + '" alt="Google">' +
      t.mini +
      '<button class="alba-login-mini-close" aria-label="Kapat">×</button>';
    document.body.appendChild(mini);

    /* ── Animate in ── */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        card.classList.add('visible');
        mini.classList.add('visible');
      });
    });

    /* ── Auto-hide ── */
    var autoTimer = setTimeout(function () { hide(false); }, AUTO_HIDE_MS);

    function hide(permanent) {
      clearTimeout(autoTimer);
      card.classList.add('hiding');
      mini.classList.add('hiding');
      dismiss(permanent);
      setTimeout(function () {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (mini.parentNode) mini.parentNode.removeChild(mini);
      }, 350);
    }

    function doLogin() {
      hide(true);
      if (typeof window.login === 'function') {
        window.login({ source: 'login-prompt' });
      }
    }

    /* ── Bindings ── */
    card.querySelector('.alp-google-btn').addEventListener('click', doLogin);
    card.querySelector('.alp-dismiss').addEventListener('click', function () { hide(true); });
    card.querySelector('.alp-close').addEventListener('click', function (e) {
      e.stopPropagation();
      hide(false);
    });

    mini.addEventListener('click', function (e) {
      if (e.target.closest('.alba-login-mini-close')) { hide(false); return; }
      doLogin();
    });
  }

  /* ── Entry point: wait for worker-auth to run, then check login state ── */
  function init() {
    if (isDismissed()) return;
    /* Give worker-auth ~1.5s to run checkUser() and update the avatar */
    setTimeout(function () {
      if (!isLoggedIn()) {
        setTimeout(show, DELAY_MS);
      }
      /* Also listen for auth state changes — hide if user logs in */
      var orig = window.updateAuthMenu;
      Object.defineProperty(window, 'updateAuthMenu', {
        configurable: true,
        set: function (fn) {
          orig = fn;
        },
        get: function () {
          return function (user) {
            if (orig) orig(user);
            if (user && (user.name || user.email || user.avatar)) {
              /* logged in — hide prompt if visible */
              var c = document.querySelector('.alba-login-prompt');
              var m = document.querySelector('.alba-login-mini');
              if (c) { c.classList.add('hiding'); setTimeout(function(){ if(c.parentNode) c.parentNode.removeChild(c); }, 350); }
              if (m) { m.classList.add('hiding'); setTimeout(function(){ if(m.parentNode) m.parentNode.removeChild(m); }, 350); }
            }
          };
        }
      });
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
