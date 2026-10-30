/**
 * AlbaSpace: Android AR fallback, 2026-10-30.
 * WebXR is primary while an Oct 2026 Google app regression breaks Scene Viewer.
 * A direct Scene Viewer fallback is also available. iOS is untouched.
 */
(() => {
  'use strict';
  if (!/Android/i.test(navigator.userAgent)) return;
  const NATIVE = 'scene-viewer quick-look';
  const WEBXR = 'webxr scene-viewer quick-look';
  const translations = {
    tr: ['AR açılmadı mı? Chrome ile açın ve Google Play Hizmetleri (AR) uygulamasını güncelleyin.', 'AR başlatılamadı. Chrome ve Google Play Hizmetleri (AR) uygulamasını kontrol edin.', 'Google AR ile dene', 'Kapat', 'Tarayıcıda AR aç', 'Bu tarayıcı WebXR desteklemiyor. Chrome kullanın.'],
    en: ['AR did not open? Open this page in Chrome and update Google Play Services for AR.', 'AR could not start. Check Chrome and Google Play Services for AR.', 'Try Google AR', 'Dismiss', 'Open AR in browser', 'This browser does not support WebXR AR. Open this page in Chrome.'],
    ru: ['AR не открылся? Откройте страницу в Chrome и обновите Google Play Services for AR.', 'AR не запустился. Проверьте Chrome и Google Play Services for AR.', 'Попробовать Google AR', 'Закрыть', 'Открыть AR в браузере', 'Этот браузер не поддерживает WebXR. Откройте страницу в Chrome.'],
    ar: ['لم يعمل الواقع المعزز؟ افتح الصفحة في Chrome وحدّث خدمات Google Play للواقع المعزز.', 'تعذر تشغيل الواقع المعزز. تحقق من Chrome وخدمات Google Play للواقع المعزز.', 'جرّب Google AR', 'إغلاق', 'فتح AR في المتصفح', 'هذا المتصفح لا يدعم WebXR. افتح الصفحة في Chrome.']
  };
  const t = translations[(document.documentElement.lang || 'tr').slice(0, 2).toLowerCase()] || translations.tr;
  const wired = new WeakSet();
  const style = document.createElement('style');
  style.textContent = '.alba-ar-recovery{margin:12px auto;padding:12px 14px;max-width:650px;border:1px solid #3183b4;border-radius:10px;background:#10223c;color:#f2faff;font:14px/1.5 system-ui,sans-serif;text-align:center}.alba-ar-recovery[hidden]{display:none!important}.alba-ar-recovery button{margin:8px 4px 0;padding:8px 12px;border:1px solid #4ab6e0;border-radius:7px;background:#164b70;color:#fff;cursor:pointer;font:inherit}.alba-ar-recovery button:focus-visible{outline:2px solid #bcefff;outline-offset:2px}.alba-ar-browser-button{display:block;margin:10px auto;padding:10px 17px;border:1px solid #45c6f1;border-radius:9px;background:#123d61;color:white;font:600 14px system-ui,sans-serif;cursor:pointer}.alba-ar-browser-button:disabled{opacity:.45;cursor:wait}';
  document.head.appendChild(style);

  function canUseNative(viewer) {
    const src = viewer.getAttribute('src') || viewer.getAttribute('data-src');
    if (!src) return true; // lazily assigned GLB
    try {
      return /^https?:$/.test(new URL(src, location.href).protocol);
    } catch (_) { return false; }
  }
  function enhance(viewer) {
    if (wired.has(viewer) || !viewer.hasAttribute('ar') || viewer.closest('[data-no-alba-ar-fix]')) return;
    wired.add(viewer);
    const applyMode = () => viewer.setAttribute('ar-modes', canUseNative(viewer) ? WEBXR : 'webxr quick-look');
    applyMode();
    let notice, timeout, pending = false, left = false, clickedAt = 0, hiddenAt = 0;
    const cancel = () => { clearTimeout(timeout); timeout = null; };
    const dismiss = () => { cancel(); if (notice) notice.hidden = true; };
    const show = (message) => {
      if (!viewer.isConnected) return;
      if (!notice) {
        notice = document.createElement('div');
        notice.className = 'alba-ar-recovery';
        notice.hidden = true;
        notice.setAttribute('role', 'status');
        notice.setAttribute('aria-live', 'polite');
        const messageEl = document.createElement('p');
        messageEl.style.margin = '0';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = t[2];
        retry.addEventListener('click', () => {
          dismiss();
          if (!canUseNative(viewer)) { show(t[1]); return; }
          pending = true;
          clickedAt = Date.now();
          left = false;
          viewer.setAttribute('ar-modes', NATIVE);
          timeout = setTimeout(() => {
            if (pending && !document.hidden) show(t[0]);
          }, 6500);
          try {
            Promise.resolve(viewer.activateAR()).catch(() => { applyMode(); show(t[1]); });
          } catch (_) { applyMode(); show(t[1]); }
        });
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = t[3];
        close.addEventListener('click', dismiss);
        notice.append(messageEl, retry, close);
      }
      notice.firstElementChild.textContent = message;
      viewer.insertAdjacentElement('afterend', notice);
      notice.hidden = false;
    };
    viewer.addEventListener('ar-status', (event) => {
      const status = event.detail && event.detail.status;
      if (status === 'failed') {
        pending = false;
        cancel();
        applyMode();
        show(t[1]);
      } else if (status === 'session-started' || status === 'object-placed') {
        pending = false;
        dismiss();
      } else if (status === 'not-presenting') {
        const quickReturn = pending && Date.now() - clickedAt < 4500;
        pending = false;
        cancel();
        applyMode();
        if (quickReturn) show(t[0]);
      }
    });
    // Built-in model-viewer AR button lives in the shadow DOM.
    viewer.addEventListener('click', (event) => {
      const path = event.composedPath?.() || [];
      const isARClick = path.some((el) => el && el.nodeType === 1 &&
        (el.id === 'default-ar-button' || el.slot === 'ar-button' ||
         el.getAttribute?.('part')?.split(/\s+/).includes('default-ar-button')));
      if (!isARClick) return;
      dismiss();
      left = false;
      pending = true;
      clickedAt = Date.now();
      timeout = setTimeout(() => {
        timeout = null;
        if (pending && !left && !document.hidden) show(t[0]);
      }, 6500);
    }, true);
    // Independent AR entry remains visible even when the built-in button
    // disappears after a failed OS hand-off.
    const browserButton = document.createElement('button');
    browserButton.type = 'button';
    browserButton.className = 'alba-ar-browser-button';
    browserButton.textContent = t[4];
    browserButton.disabled = !viewer.loaded;
    viewer.addEventListener('load', () => { browserButton.disabled = false; });
    viewer.addEventListener('error', () => { browserButton.disabled = true; });
    browserButton.addEventListener('click', () => {
      if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
        show(t[5]);
        return;
      }
      dismiss();
      left = false;
      pending = true;
      clickedAt = Date.now();
      viewer.setAttribute('ar-modes', 'webxr');
      timeout = setTimeout(() => {
        if (pending && !document.hidden) show(t[0]);
      }, 6500);
      try {
        Promise.resolve(viewer.activateAR()).catch(() => {
          pending = false;
          cancel();
          applyMode();
          show(t[1]);
        });
      } catch (_) {
        pending = false;
        cancel();
        applyMode();
        show(t[1]);
      }
    });
    viewer.insertAdjacentElement('afterend', browserButton);

    const markLeft = () => { left = true; hiddenAt = Date.now(); cancel(); };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) markLeft();
      else if (pending && hiddenAt && Date.now() - hiddenAt < 3500) {
        pending = false;
        applyMode();
        show(t[0]); // native app returned immediately
      }
    });
    window.addEventListener('pagehide', markLeft);

    // The rest of Atlas already has a separate Scene Viewer / depth button.
    // ISS deliberately has no depth button: offer a native alternative there.
    if (/(?:^|\/)(?:atlas-)?iss(?:\/|$)/i.test(location.pathname)) {
      const alternative = document.createElement('button');
      alternative.type = 'button';
      alternative.className = 'alba-ar-native-alternative';
      alternative.textContent = t[2];
      alternative.title = t[0];
      alternative.style.cssText = 'display:block;margin:10px auto;padding:9px 16px;border:1px solid #40aee1;background:#102a48;color:#fff;border-radius:9px;cursor:pointer;font:600 13px system-ui,sans-serif';
      alternative.addEventListener('click', () => {
        if (!canUseNative(viewer)) { show(t[1]); return; }
        dismiss();
        left = false;
        pending = true;
        clickedAt = Date.now();
        viewer.setAttribute('ar-modes', NATIVE);
        timeout = setTimeout(() => { if (pending && !document.hidden) show(t[0]); }, 6500);
        try {
          Promise.resolve(viewer.activateAR()).catch(() => { pending = false; cancel(); applyMode(); show(t[1]); });
        } catch (_) { pending = false; cancel(); applyMode(); show(t[1]); }
      });
      viewer.insertAdjacentElement('afterend', alternative);
    }
    new MutationObserver(applyMode).observe(viewer, {attributes:true,attributeFilter:['src','data-src']});
  }
  const scan = (node = document) => {
    if (node.nodeType === 1 && node.matches?.('model-viewer')) enhance(node);
    node.querySelectorAll?.('model-viewer[ar]').forEach(enhance);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(), {once:true});
  else scan();
  new MutationObserver((changes) => {
    for (const change of changes) for (const node of change.addedNodes)
      if (node.nodeType === 1) scan(node);
  }).observe(document.documentElement, {childList:true,subtree:true});
})();
