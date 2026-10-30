/**
 * AlbaSpace Android AR depth opt-in (2026).
 * Native Scene Viewer can perform ARCore depth occlusion on supported devices,
 * but model-viewer sets disable_occlusion=true for its built-in AR launch.
 * This adds a separate, explicit native launcher without changing the 3D
 * model viewer, loading URLs, AR button, camera controls or iOS behaviour.
 * Never attach to any ISS page/model.
 */
(() => {
  'use strict';
  if (!/Android/i.test(navigator.userAgent)) return;
  const pathname = location.pathname.toLowerCase();
  if (/(?:^|\/)(?:atlas-)?iss(?:\/|$)/.test(pathname) || /(?:^|\/)orbital-iss(?:\.html|\/|$)/.test(pathname)) return;

  const copy = {
    tr: ['AR · Gerçekçi derinlik', 'Kamerada gerçek nesnelerin 3D modelin önünde görünmesini dener. Desteklenen Android cihaz gerekir.', 'Google AR hemen kapanırsa yukarıdaki standart AR düğmesini (WebXR) deneyin ve Google uygulamasını güncelleyin.'],
    en: ['AR · Realistic depth', 'Tries real-world occlusion in AR. Requires a compatible Android phone.', 'If Google AR closes immediately, use the standard AR button above (WebXR) and update the Google app.'],
    ru: ['AR · Реальная глубина', 'В AR реальные объекты смогут перекрывать модель. Требуется совместимый Android.', 'Если Google AR сразу закрывается, используйте обычную кнопку AR выше (WebXR) и обновите приложение Google.']
  };
  const lang = (document.documentElement.lang || 'tr').slice(0, 2);
  const t = copy[lang] || copy.tr;

  function excluded(viewer) {
    const model = [viewer.getAttribute('data-model-name'), viewer.getAttribute('src'),
      viewer.getAttribute('data-src')].filter(Boolean).join(' ').toLowerCase();
    return /(?:^|[\s/_.-])iss(?:$|[\s/_.-])/.test(model) ||
      /(?:^|[\s/_.-])atlas-iss(?:$|[\s/_.-])/.test(model);
  }

  function launch(viewer) {
    const src = viewer.getAttribute('src') || viewer.getAttribute('data-src');
    if (!src || excluded(viewer)) return;
    let url;
    try {
      url = new URL(src, location.href);
      if (!/^https?:$/.test(url.protocol)) return;
    } catch (_) { return; }
    const params = new URLSearchParams({
      mode: 'ar_preferred',
      disable_occlusion: 'false',
      resizable: 'true',
      title: (document.querySelector('main h1, h1')?.textContent || 'AlbaSpace 3D').trim().slice(0, 58),
      file: url.href
    });
    const intent = 'intent://arvr.google.com/scene-viewer/1.2?' + params.toString() +
      '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;' +
      'action=android.intent.action.VIEW;S.browser_fallback_url=' +
      encodeURIComponent(location.href) + ';end;';
    const a = document.createElement('a');
    a.href = intent;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click(); // Must originate in direct user click; do not await a promise.
    a.remove();
    // Google app regression (Oct 2026): Scene Viewer may immediately return.
    // Keep the recovery instruction visible when the user returns to the page.
    const button = viewer.parentElement?.querySelector('.alba-ar-depth-launch');
    if (button && !button.nextElementSibling?.classList.contains('alba-ar-depth-note')) {
      const note = document.createElement('p');
      note.className = 'alba-ar-depth-note';
      note.setAttribute('role', 'status');
      note.textContent = t[2] || copy.en[2];
      note.style.cssText = 'max-width:650px;margin:-8px auto 20px;text-align:center;color:#c8edff;font:13px/1.4 system-ui,sans-serif';
      button.insertAdjacentElement('afterend', note);
    }
  }

  function enhance(viewer) {
    if (excluded(viewer) || viewer.dataset.albaDepthButton) return;
    if (!viewer.parentElement || viewer.closest('[data-no-alba-depth]')) return;
    viewer.dataset.albaDepthButton = '1';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'alba-ar-depth-launch';
    b.textContent = '◉ ' + t[0];
    b.title = t[1];
    b.setAttribute('aria-label', t[0]);
    b.addEventListener('click', () => launch(viewer));
    viewer.insertAdjacentElement('afterend', b);
  }

  const style = document.createElement('style');
  style.textContent = '.alba-ar-depth-launch{display:block;margin:14px auto 25px;padding:12px 22px;border-radius:999px;border:1px solid #45d7ff;background:linear-gradient(130deg,#0d2253,#081329);color:#e8faff;font:600 14px system-ui,sans-serif;box-shadow:0 0 22px #008bc966;cursor:pointer;max-width:95%;touch-action:manipulation}.alba-ar-depth-launch:focus-visible{outline:3px solid #9eefff;outline-offset:3px}.alba-ar-depth-launch:hover{background:#174b7b}';
  document.head.appendChild(style);
  const scan = () => document.querySelectorAll('model-viewer').forEach(enhance);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, {once:true});
  else scan();
  new MutationObserver(scan).observe(document.documentElement, {childList:true, subtree:true});
})();
