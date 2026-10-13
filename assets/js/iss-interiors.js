/* ISS module map + lazy GLB swapping. Non-destructive integration with #mainViewer. */
(() => {
  'use strict';
  const viewer = document.getElementById('mainViewer');
  const panel = document.getElementById('iss-interior-explorer');
  if (!viewer || !panel) return;
  const quality = panel.querySelector('#iss-interior-quality');
  const status = panel.querySelector('#iss-interior-status');
  const outside = panel.querySelector('#iss-interior-outside');
  const nodes = [...panel.querySelectorAll('[data-iss-module]')];
  const exteriorPath = viewer.getAttribute('data-src') || viewer.getAttribute('src') || '/assets/models/iss.glb';
  const directory = '/assets/models/interior/';
  // Add further module keys here only when a matching map node exists.
  const modules = {
    destiny: ['Destiny', '0deg 90deg 0.25m', '0m 0m 0m', '80deg'],
    cupola: ['Cupola', '180deg 88deg 0.25m', '0m 0.78m 0m', '85deg'],
    harmony: ['Harmony', '0deg 90deg 0.35m', '0m 0m 0m', '80deg'],
    columbus: ['Columbus', '0deg 90deg 0.35m', '0m 0m 0m', '80deg'],
    kibo: ['Kibo', '0deg 90deg 0.35m', '0m 0m 0m', '80deg'],
    tranquility: ['Tranquility', '0deg 90deg 0.35m', '0m 0m 0m', '80deg'],
    unity: ['Unity', '0deg 90deg 0.35m', '0m 0m 0m', '80deg'],
    zarya: ['Zarya', '0deg 90deg 0.35m', '0m 0m 0m', '80deg'],
    zvezda: ['Zvezda', '0deg 90deg 0.35m', '0m 0m 0m', '80deg']
  };
  let current = 'exterior';
  let requested = 'exterior';
  const availability = new Map();
  const urlFor = (key, kind) => directory + key + '_' + kind + '.glb';
  function setStatus(message) { status.textContent = message; }
  function markMap() {
    for (const node of nodes) {
      const key = node.dataset.issModule;
      node.classList.toggle('is-selected', key === current);
      node.classList.toggle('is-unavailable', !(availability.get(key)?.[quality.value]));
      node.setAttribute('aria-label', modules[key][0] + (availability.get(key)?.[quality.value] ? ' modülünü aç' : ' — model henüz yüklenmedi'));
    }
  }
  async function check(url) {
    try {
      const response = await fetch(url, {method:'HEAD', cache:'no-store'});
      const type = (response.headers.get('content-type') || '').toLowerCase();
      return response.ok && !type.includes('text/html');
    } catch (_) { return false; }
  }
  async function discover() {
    await Promise.all(Object.keys(modules).map(async key => {
      const [optimized, detailed] = await Promise.all([check(urlFor(key,'optimized')),check(urlFor(key,'detailed'))]);
      availability.set(key,{optimized,detailed});
    }));
    markMap();
    const count = [...availability.values()].filter(entry => entry[quality.value]).length;
    if (current === 'exterior') setStatus(count ? 'Hazır: ' + count + ' modül. Bir modül seçin.' : 'Modeller henüz yüklenmedi; dış ISS modeli kullanılabilir.');
  }
  function applyCamera(key) {
    if (key === 'exterior') {
      viewer.setAttribute('camera-target','0m 0m 0m');
      viewer.setAttribute('camera-orbit','35deg 65deg 110%');
      viewer.setAttribute('field-of-view','45deg');
      viewer.setAttribute('ar-scale','auto');
    } else {
      const config = modules[key];
      viewer.setAttribute('camera-target',config[2]);
      viewer.setAttribute('camera-orbit',config[1]);
      viewer.setAttribute('field-of-view',config[3]);
      viewer.setAttribute('ar-scale','fixed');
    }
    viewer.setAttribute('min-camera-orbit','auto auto 0.005m');
    requestAnimationFrame(() => viewer.dispatchEvent(new CustomEvent('iss-explorer-camera-changed')));
  }
  async function change(key) {
    if (key !== 'exterior' && !modules[key]) return;
    const kind = quality.value;
    let src = exteriorPath;
    if (key !== 'exterior') {
      src = urlFor(key,kind);
      // Perform a new check so the user can upload files without stale availability.
      if (!(await check(src))) {
        availability.set(key,{...(availability.get(key)||{}),[kind]:false});
        markMap();
        setStatus('Model bulunamadı: ' + src + ' — lütfen dosyayı yükleyin.');
        return;
      }
      availability.set(key,{...(availability.get(key)||{}),[kind]:true});
    }
    requested = key;
    current = key;
    markMap();
    setStatus(key === 'exterior' ? 'İstasyonun dış modeli yükleniyor…' : modules[key][0] + ' yükleniyor…');
    // Keep the site's lazy preloader data-src in sync with the active model.
    viewer.setAttribute('data-src',src);
    if (viewer.getAttribute('src') === src && viewer.loaded) {
      applyCamera(key);
      setStatus(key === 'exterior' ? 'Tüm istasyon' : modules[key][0] + ' — iç görünüm');
      return;
    }
    viewer.setAttribute('src',src);
  }
  viewer.addEventListener('load', () => {
    const key = requested;
    const expected = key === 'exterior' ? exteriorPath : urlFor(key,quality.value);
    if (viewer.getAttribute('src') !== expected) return;
    applyCamera(key);
    setStatus(key === 'exterior' ? 'Tüm istasyon' : modules[key][0] + ' — iç görünüm');
  });
  viewer.addEventListener('error', () => {
    const key = requested;
    setStatus('Model yüklenemedi: ' + (key === 'exterior' ? exteriorPath : urlFor(key,quality.value)));
  });
  outside.addEventListener('click', () => change('exterior'));
  quality.addEventListener('change', () => {markMap(); if (current !== 'exterior') change(current);});
  nodes.forEach(node => {
    const key = node.dataset.issModule;
    node.setAttribute('role','button'); node.setAttribute('tabindex','0');
    node.addEventListener('click',() => change(key));
    node.addEventListener('keydown',e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); change(key);}});
  });
  // Calibrate these coordinates against the real iss.glb before enabling hotspots.
  // window.ISS_INTERIOR_HOTSPOTS = {destiny:'0m 0m 0m', ...};
  const hotspots = window.ISS_INTERIOR_HOTSPOTS || {};
  Object.entries(hotspots).forEach(([key,position]) => {
    if (!modules[key] || !/^[-+\d.m\s]+$/.test(position)) return;
    const button = document.createElement('button');
    button.slot = 'hotspot-' + key; button.setAttribute('data-position',position);
    button.textContent = modules[key][0]; button.type = 'button';
    button.className = 'iss-interior-hotspot';
    button.addEventListener('click',() => change(key));viewer.appendChild(button);
  });
  discover();
})();
