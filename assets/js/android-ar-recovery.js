/**
 * AlbaSpace: Android AR fallback, 2026-10-30.
 * Scene Viewer first avoids a WebXR requestSession hang. iOS is untouched.
 */
(() => {
  'use strict';
  if (!/Android/i.test(navigator.userAgent)) return;
  const NATIVE = 'scene-viewer webxr quick-look';
  const WEBXR = 'webxr scene-viewer quick-look';
  const translations = {
    tr: ['AR açılmadı mı? Chrome ile açın ve Google Play Hizmetleri (AR) uygulamasını güncelleyin.', 'AR başlatılamadı. Chrome ve Google Play Hizmetleri (AR) uygulamasını kontrol edin.', 'WebXR ile dene', 'Kapat'],
    en: ['AR did not open? Open this page in Chrome and update Google Play Services for AR.', 'AR could not start. Check Chrome and Google Play Services for AR.', 'Try WebXR', 'Dismiss'],
    ru: ['AR не открылся? Откройте страницу в Chrome и обновите Google Play Services for AR.', 'AR не запустился. Проверьте Chrome и Google Play Services for AR.', 'Попробовать WebXR', 'Закрыть'],
    ar: ['لم يعمل الواقع المعزز؟ افتح الصفحة في Chrome وحدّث خدمات Google Play للواقع المعزز.', 'تعذر تشغيل الواقع المعزز. تحقق من Chrome وخدمات Google Play للواقع المعزز.', 'جرّب WebXR', 'إغلاق']
  };
  const t = translations[(document.documentElement.lang || 'tr').slice(0, 2).toLowerCase()] || translations.tr;
  const wired = new WeakSet();
  const style = document.createElement('style');
  style.textContent = '.alba-ar-recovery{margin:12px auto;padding:12px 14px;max-width:650px;border:1px solid #3183b4;border-radius:10px;background:#10223c;color:#f2faff;font:14px/1.5 system-ui,sans-serif;text-align:center}.alba-ar-recovery[hidden]{display:none!important}.alba-ar-recovery button{margin:8px 4px 0;padding:8px 12px;border:1px solid #4ab6e0;border-radius:7px;background:#164b70;color:#fff;cursor:pointer;font:inherit}.alba-ar-recovery button:focus-visible{outline:2px solid #bcefff;outline-offset:2px}';
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
    const applyMode = () => viewer.setAttribute('ar-modes', canUseNative(viewer) ? NATIVE : WEBXR);
    applyMode();
    let notice, timeout, pending = false, left = false;
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
          viewer.setAttribute('ar-modes', WEBXR);
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
        pending = false;
        cancel();
        applyMode(); // restore native priority for the next entry
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
      timeout = setTimeout(() => {
        timeout = null;
        if (pending && !left && !document.hidden) show(t[0]);
      }, 6500);
    }, true);
    const markLeft = () => { left = true; cancel(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) markLeft(); });
    window.addEventListener('pagehide', markLeft);
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
