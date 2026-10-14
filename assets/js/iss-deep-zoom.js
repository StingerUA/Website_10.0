/* ISS deep zoom: 100%-1000% camera zoom, not AR scale. */
(function () {
  'use strict';
  function mount(viewer) {
    if (viewer.dataset.issZoomMounted === 'true') return;
    viewer.dataset.issZoomMounted = 'true';
    viewer.setAttribute('min-camera-orbit', 'auto auto 0.005m');
    viewer.setAttribute('ar-scale', 'auto');
    const lang = (document.documentElement.lang || 'tr').toLowerCase().slice(0, 2);
    const labels = lang === 'ru' ? {zoom:'Приближение',reset:'Сброс'} : lang === 'en' ? {zoom:'Zoom',reset:'Reset'} : {zoom:'Yakınlaştırma',reset:'Sıfırla'};
    const panel = document.createElement('div');
    panel.className = 'iss-deep-zoom';
    panel.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;margin:10px auto 18px;padding:11px 14px;max-width:540px;color:white;font:14px/1.3 Arial,sans-serif;background:rgba(6,20,38,.91);border:1px solid rgba(105,187,235,.35);border-radius:12px';
    const title = document.createElement('label');
    const id = 'iss-zoom-' + Math.random().toString(36).slice(2, 8);
    title.htmlFor = id; title.textContent = labels.zoom;
    const range = document.createElement('input');
    range.type = 'range'; range.id = id; range.min = '100'; range.max = '1000'; range.step = '10'; range.value = '100'; range.disabled = true;
    range.setAttribute('aria-label', title.textContent + ' 100-1000%');
    range.style.cssText = 'width:min(35vw,230px);min-width:110px;accent-color:#00c2ff';
    const readout = document.createElement('output'); readout.htmlFor = id; readout.textContent = '100%';
    readout.style.cssText = 'min-width:52px;text-align:right;font-variant-numeric:tabular-nums';
    const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = labels.reset; reset.disabled = true;
    reset.style.cssText = 'border:1px solid #578aa9;border-radius:8px;padding:6px 10px;background:#163752;color:white;cursor:pointer';
    panel.append(title, range, readout, reset);
    viewer.insertAdjacentElement('afterend', panel);
    let baseRadius = 0;
    function apply(zoom) {
      if (!baseRadius) return;
      const orbit = viewer.getCameraOrbit();
      const distance = baseRadius * 100 / zoom;
      viewer.cameraOrbit = orbit.theta + 'rad ' + orbit.phi + 'rad ' + distance.toFixed(5) + 'm';
      readout.textContent = Math.round(zoom) + '%';
    }
    function ready() {
      if (baseRadius || typeof viewer.getCameraOrbit !== 'function') return;
      const orbit = viewer.getCameraOrbit();
      if (!Number.isFinite(orbit.radius) || orbit.radius <= 0) return;
      baseRadius = orbit.radius; range.disabled = false; reset.disabled = false;
    }
    viewer.addEventListener('iss-explorer-camera-changed', () => {
      baseRadius = 0;
      range.value = '100'; readout.textContent = '100%';
      requestAnimationFrame(ready);
    });
    viewer.addEventListener('load', ready);
    if (viewer.loaded) ready();
    range.addEventListener('input', () => apply(Number(range.value)));
    reset.addEventListener('click', () => { range.value = '100'; apply(100); });
    viewer.addEventListener('camera-change', () => {
      if (!baseRadius || typeof viewer.getCameraOrbit !== 'function') return;
      const orbit = viewer.getCameraOrbit();
      if (!Number.isFinite(orbit.radius) || orbit.radius <= 0) return;
      const z = Math.round(baseRadius / orbit.radius * 100);
      range.value = String(Math.max(100, Math.min(1000, z)));
      readout.textContent = (Math.round(z / 10) * 10) + '%';
    });
  }
  function start() {
    document.querySelectorAll('model-viewer[data-model-name="iss"], model-viewer[src$="/assets/models/iss.glb"]').forEach(mount);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
