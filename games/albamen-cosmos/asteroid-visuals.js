(function () {
  'use strict';

  const BASE = '/games/albamen-cosmos/';
  const VERSION = '20260912-4';
  const CATEGORY_RE = /asteroid|comet|астеро|комет|asteroit|kuyruk/i;
  const PARTS = Array.from({ length: 9 }, (_, i) => `${BASE}assets/asteroids-comets/atlas.${String(i + 1).padStart(2, '0')}.b64?v=${VERSION}`);
  const DATA_PARTS = ['data.001.b64', 'data.002.b64', 'data.003.b64'].map(name => `${BASE}${name}?v=${VERSION}`);

  let installed = false;
  let atlasUrl = '';
  let atlasError = '';
  let questionIndex = new Map();
  let cardIndex = new Map();

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return (await response.text()).trim();
  }

  async function loadAtlas() {
    const chunks = await Promise.all(PARTS.map(fetchText));
    const base64 = chunks.join('').replace(/\s+/g, '');
    if (!base64) throw new Error('empty atlas');
    if (!base64.startsWith('UklG')) throw new Error('invalid WebP base64 header');
    return `data:image/webp;base64,${base64}`;
  }

  async function loadData() {
    const chunks = await Promise.all(DATA_PARTS.map(fetchText));
    const base64 = chunks.join('').replace(/\s+/g, '');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return JSON.parse(text);
  }

  function buildIndexes(data) {
    const categoryIds = new Set();
    for (const language of Object.keys(data?.categories || {})) {
      for (const [cid, label] of Object.entries(data.categories[language] || {})) {
        if (CATEGORY_RE.test(String(label || ''))) categoryIds.add(cid);
      }
    }
    const asteroidCid = [...categoryIds][0];
    if (!asteroidCid) return;

    const qIds = Object.keys(data.qmeta || {}).filter(id => data.qmeta[id]?.cid === asteroidCid).slice(0, 10);
    const fIds = Object.keys(data.fcmeta || {}).filter(id => data.fcmeta[id]?.cid === asteroidCid).slice(0, 10);
    const qMap = new Map();
    const fMap = new Map();

    for (const language of Object.keys(data.translations || {})) {
      const table = data.translations[language] || {};
      qIds.forEach((id, index) => {
        const text = normalize(table[id]?.question);
        if (text) qMap.set(text, index);
      });
      fIds.forEach((id, index) => {
        const text = normalize(table[id]?.front);
        if (text) fMap.set(text, index);
      });
    }
    questionIndex = qMap;
    cardIndex = fMap;
    decorate();
  }

  function visibleCounterIndex() {
    const nodes = [...document.querySelectorAll('.section-title span,.q-count')];
    for (const node of nodes) {
      const match = String(node.textContent || '').match(/(\d+)\s*\/\s*10/);
      if (!match) continue;
      const index = Number(match[1]) - 1;
      if (index >= 0 && index <= 9) return index;
    }
    return -1;
  }

  function ensureVisual(container, index, back, anchor, label) {
    if (!container || !Number.isInteger(index) || index < 0 || index > 9) return;

    let visual = container.querySelector(':scope > .asteroid-card-visual');
    if (!visual) {
      visual = document.createElement('div');
      visual.className = 'asteroid-card-visual';
      visual.setAttribute('role', 'img');
      if (anchor && anchor.parentNode === container) container.insertBefore(visual, anchor);
      else container.prepend(visual);
    }

    visual.dataset.index = String(index);
    visual.dataset.side = back ? 'back' : 'front';
    visual.setAttribute('aria-label', label);

    if (atlasUrl) {
      visual.classList.remove('is-loading', 'is-error');
      visual.textContent = '';
      visual.style.backgroundImage = `url("${atlasUrl}")`;
      visual.style.backgroundPosition = `${back ? 100 : 0}% ${index === 0 ? 0 : (index / 9) * 100}%`;
    } else if (atlasError) {
      visual.classList.remove('is-loading');
      visual.classList.add('is-error');
      visual.style.backgroundImage = 'none';
      visual.textContent = `Image error: ${atlasError}`;
    } else {
      visual.classList.add('is-loading');
      visual.classList.remove('is-error');
      visual.style.backgroundImage = 'none';
      visual.textContent = 'Görsel yükleniyor…';
    }
  }

  function decorateCard() {
    const card = document.getElementById('flash-card');
    if (!card) return;
    const category = card.querySelector('.badge')?.textContent || '';
    const old = card.querySelector(':scope > .asteroid-card-visual');
    if (!CATEGORY_RE.test(category)) {
      if (old) old.remove();
      return;
    }

    const frontText = normalize(card.querySelector('h2')?.textContent || '');
    let index = cardIndex.get(frontText);
    if (!Number.isInteger(index)) index = visibleCounterIndex();
    const isBack = !!card.querySelector('.answer-side');
    const anchor = card.querySelector('.answer-side, h2, .tiny');
    ensureVisual(card, index, isBack, anchor, isBack ? 'Answer image' : 'Card image');
  }

  function decorateQuiz() {
    const panel = document.querySelector('.quiz-head + .panel');
    if (!panel) return;
    const category = document.querySelector('.quiz-meta small')?.textContent || '';
    const old = panel.querySelector(':scope > .asteroid-card-visual');
    if (!CATEGORY_RE.test(category)) {
      if (old) old.remove();
      return;
    }

    const questionText = normalize(panel.querySelector('.question')?.textContent || '');
    let index = questionIndex.get(questionText);
    if (!Number.isInteger(index)) index = visibleCounterIndex();
    const isBack = !!panel.querySelector('.feedback');
    ensureVisual(panel, index, isBack, panel.querySelector('.question'), isBack ? 'Answer image' : 'Question image');
  }

  function decorate() {
    try {
      decorateCard();
      decorateQuiz();
    } catch (error) {
      console.error('[ALBAMEN Cosmos] asteroid visual render failed', error);
    }
  }

  function installStyles() {
    if (document.getElementById('albamen-asteroid-visual-styles')) return;
    const style = document.createElement('style');
    style.id = 'albamen-asteroid-visual-styles';
    style.textContent = `
      .asteroid-card-visual{
        width:min(100%,320px)!important;
        aspect-ratio:1/1!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 auto!important;
        margin:12px auto 18px!important;
        padding:10px!important;
        box-sizing:border-box!important;
        border-radius:18px!important;
        background-repeat:no-repeat!important;
        background-size:200% 1000%!important;
        background-color:#0b1028!important;
        color:#9fb0d8!important;
        font:600 12px/1.35 Montserrat,system-ui,sans-serif!important;
        text-align:center!important;
        box-shadow:0 14px 32px rgba(0,0,0,.28)!important;
        pointer-events:none!important;
      }
      .asteroid-card-visual.is-loading{border:1px dashed rgba(72,202,255,.4)!important}
      .asteroid-card-visual.is-error{border:1px solid #fb7185!important;color:#fb7185!important}
      @media(max-width:520px){.asteroid-card-visual{width:min(72vw,300px)!important}}
    `;
    document.head.appendChild(style);
  }

  async function install() {
    if (installed) return;
    installed = true;
    window.__albamenAsteroidVisualsVersion = VERSION;
    installStyles();

    const observer = new MutationObserver(() => requestAnimationFrame(decorate));
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    decorate();
    const timer = setInterval(decorate, 500);
    setTimeout(() => clearInterval(timer), 60000);

    loadAtlas().then(url => {
      atlasUrl = url;
      window.__albamenAsteroidsAtlas = url;
      decorate();
    }).catch(error => {
      atlasError = String(error?.message || error || 'unknown');
      console.error('[ALBAMEN Cosmos] asteroid atlas failed', error);
      decorate();
    });

    loadData().then(buildIndexes).catch(error => {
      console.warn('[ALBAMEN Cosmos] asteroid mapping unavailable; counter fallback active', error);
    });
  }

  window.AlbamenAsteroidVisuals = { install, decorate, version: VERSION };
})();