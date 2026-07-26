/**
 * auth-email.js
 * Adds email/password register & login form to the existing alien dropdown.
 * Works alongside Google auth — uses the same session cookie system.
 * 
 * Inject via include.js after header loads:
 *   <script src="/assets/js/auth-email.js" defer></script>
 */
(function () {
  'use strict';

  var API = 'https://albaspace-api.nncdecdgc.workers.dev';

  function getLang() {
    var p = window.location.pathname || '/';
    if (p.startsWith('/eng/')) return 'en';
    if (p.startsWith('/rus/')) return 'ru';
    return 'tr';
  }

  var T = {
    tr: {
      tabLogin: 'Giriş Yap', tabRegister: 'Kayıt Ol',
      email: 'E-posta', password: 'Şifre', name: 'Ad Soyad',
      loginBtn: 'Giriş Yap', registerBtn: 'Kayıt Ol',
      loginSuccess: 'Giriş başarılı!', registerSuccess: 'Kayıt başarılı!',
      forgotPw: 'Şifremi unuttum',
      orGoogle: 'veya',
    },
    en: {
      tabLogin: 'Sign In', tabRegister: 'Register',
      email: 'Email', password: 'Password', name: 'Full Name',
      loginBtn: 'Sign In', registerBtn: 'Register',
      loginSuccess: 'Signed in!', registerSuccess: 'Registered!',
      forgotPw: 'Forgot password?',
      orGoogle: 'or',
    },
    ru: {
      tabLogin: 'Войти', tabRegister: 'Регистрация',
      email: 'E-mail', password: 'Пароль', name: 'Имя',
      loginBtn: 'Войти', registerBtn: 'Зарегистрироваться',
      loginSuccess: 'Вход выполнен!', registerSuccess: 'Регистрация успешна!',
      forgotPw: 'Забыл пароль?',
      orGoogle: 'или',
    },
  };

  var CSS = `
    .aem-wrap {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px solid rgba(0,194,255,0.15);
      margin-top: 8px;
    }
    .aem-tabs {
      display: flex;
      gap: 4px;
    }
    .aem-tab {
      flex: 1;
      padding: 6px 0;
      border: 1px solid rgba(0,194,255,0.25);
      border-radius: 8px;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
      font-family: inherit;
    }
    .aem-tab.active {
      background: rgba(0,194,255,0.15);
      border-color: rgba(0,194,255,0.5);
      color: #e2e8f0;
    }
    .aem-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .aem-input {
      width: 100%;
      padding: 9px 12px;
      background: rgba(15,23,42,0.8);
      border: 1px solid rgba(0,194,255,0.2);
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.18s;
    }
    .aem-input:focus { border-color: rgba(0,194,255,0.55); }
    .aem-submit {
      width: 100%;
      padding: 9px;
      background: #00c2ff;
      color: #020617;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.18s, transform 0.12s;
    }
    .aem-submit:hover  { background: #22d3ff; }
    .aem-submit:active { transform: scale(0.97); }
    .aem-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .aem-error {
      font-size: 12px;
      color: #f87171;
      text-align: center;
      min-height: 16px;
    }
    .aem-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #475569;
    }
    .aem-divider::before,
    .aem-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(0,194,255,0.15);
    }
  `;

  function injectCSS() {
    if (document.getElementById('aem-css')) return;
    var s = document.createElement('style');
    s.id = 'aem-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function toast(msg, ok) {
    var t = document.getElementById('albaCartToast');
    if (!t) { t = document.createElement('div'); t.id = 'albaCartToast'; t.className = 'alba-cart-toast'; document.body.appendChild(t); }
    t.textContent = (ok ? '✓ ' : '⚠ ') + msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  function buildForm() {
    var lang = getLang();
    var t    = T[lang] || T.tr;

    // Find the logged-out section in the alien menu
    var loggedOut = document.querySelector('#alienMenu .alien-auth-logged-out');
    if (!loggedOut) return;

    // Don't inject twice
    if (loggedOut.querySelector('.aem-wrap')) return;

    var wrap = document.createElement('div');
    wrap.className = 'aem-wrap';
    wrap.innerHTML = `
      <div class="aem-tabs">
        <button class="aem-tab active" data-tab="login">${t.tabLogin}</button>
        <button class="aem-tab"        data-tab="register">${t.tabRegister}</button>
      </div>

      <!-- Login form -->
      <div class="aem-form" id="aem-form-login">
        <input class="aem-input" id="aem-login-email" type="email" placeholder="${t.email}" autocomplete="email">
        <input class="aem-input" id="aem-login-pw"    type="password" placeholder="${t.password}" autocomplete="current-password">
        <div class="aem-error" id="aem-login-err"></div>
        <button class="aem-submit" id="aem-login-btn">${t.loginBtn}</button>
      </div>

      <!-- Register form -->
      <div class="aem-form" id="aem-form-register" style="display:none">
        <input class="aem-input" id="aem-reg-name"  type="text"     placeholder="${t.name}"  autocomplete="name">
        <input class="aem-input" id="aem-reg-email" type="email"    placeholder="${t.email}" autocomplete="email">
        <input class="aem-input" id="aem-reg-pw"    type="password" placeholder="${t.password}" autocomplete="new-password">
        <div class="aem-error" id="aem-reg-err"></div>
        <button class="aem-submit" id="aem-reg-btn">${t.registerBtn}</button>
      </div>
    `;

    loggedOut.appendChild(wrap);

    // Tab switching
    wrap.querySelectorAll('.aem-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        wrap.querySelectorAll('.aem-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var which = tab.dataset.tab;
        document.getElementById('aem-form-login').style.display    = which === 'login'    ? 'flex' : 'none';
        document.getElementById('aem-form-register').style.display = which === 'register' ? 'flex' : 'none';
      });
    });

    // Login submit
    document.getElementById('aem-login-btn').addEventListener('click', function () {
      var email = document.getElementById('aem-login-email').value.trim();
      var pw    = document.getElementById('aem-login-pw').value;
      var errEl = document.getElementById('aem-login-err');
      var btn   = document.getElementById('aem-login-btn');
      errEl.textContent = '';
      if (!email || !pw) { errEl.textContent = 'Tüm alanları doldurun.'; return; }
      btn.disabled = true;
      fetch(API + '/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pw })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { errEl.textContent = res.d.error || 'Hata.'; return; }
          toast(t.loginSuccess, true);
          // Trigger worker-auth to refresh avatar/name
          if (typeof window.checkUser === 'function') window.checkUser();
          else window.location.reload();
        })
        .catch(function () { btn.disabled = false; errEl.textContent = 'Bağlantı hatası.'; });
    });

    // Register submit
    document.getElementById('aem-reg-btn').addEventListener('click', function () {
      var name  = document.getElementById('aem-reg-name').value.trim();
      var email = document.getElementById('aem-reg-email').value.trim();
      var pw    = document.getElementById('aem-reg-pw').value;
      var errEl = document.getElementById('aem-reg-err');
      var btn   = document.getElementById('aem-reg-btn');
      errEl.textContent = '';
      if (!email || !pw) { errEl.textContent = 'E-posta ve şifre zorunludur.'; return; }
      if (pw.length < 8) { errEl.textContent = 'Şifre en az 8 karakter olmalı.'; return; }
      btn.disabled = true;
      fetch(API + '/auth/register', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: pw })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { errEl.textContent = res.d.error || 'Hata.'; return; }
          toast(t.registerSuccess, true);
          if (typeof window.checkUser === 'function') window.checkUser();
          else window.location.reload();
        })
        .catch(function () { btn.disabled = false; errEl.textContent = 'Bağlantı hatası.'; });
    });

    // Enter key support
    ['aem-login-email','aem-login-pw'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('aem-login-btn').click();
      });
    });
    ['aem-reg-name','aem-reg-email','aem-reg-pw'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('aem-reg-btn').click();
      });
    });
  }

  function init() {
    injectCSS();

    // If header is already in the DOM — build immediately
    if (document.querySelector('#alienMenu .alien-auth-logged-out')) {
      buildForm();
      return;
    }

    // Bug #11 fix: MutationObserver instead of setInterval polling.
    // - Reacts instantly the moment include.js injects the header fragment
    // - Disconnects itself after first successful inject (no lingering watcher)
    // - Hard timeout (10s) disconnects the observer if header never arrives,
    //   preventing a forever-running observer on broken pages
    var observer = new MutationObserver(function () {
      if (document.querySelector('#alienMenu .alien-auth-logged-out')) {
        observer.disconnect();
        clearTimeout(giveUpTimer);
        buildForm();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    var giveUpTimer = setTimeout(function () {
      observer.disconnect();
      // Form never appeared — silently abort (header failed to load)
    }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());