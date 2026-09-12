(function () {
  'use strict';

  const BASE = '/games/albamen-cosmos/';
  const VERSION = '20260912-5';
  const CATEGORY_RE = /asteroid|comet|астеро|комет|asteroit|kuyruk/i;
  const ATLAS_PARTS = Array.from({ length: 9 }, (_, i) => `${BASE}assets/asteroids-comets/atlas.${String(i + 1).padStart(2, '0')}.b64?v=${VERSION}`);
  const DATA_NAMES = [
    'data.001.b64','data.002.b64',
    'data.003.1.b64','data.003.2.b64','data.003.3.b64','data.003.4.b64',
    'data.003.5.b64','data.003.6.b64','data.003.7.b64','data.003.8.b64'
  ];
  const DATA_PARTS = DATA_NAMES.map(name => `${BASE}${name}?v=${VERSION}`);

  let installed = false;
  let atlasUrl = '';
  let atlasError = '';
  let questionIndex = new Map();
  let scheduled = false;

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return (await response.text()).trim();
  }

  async function loadAtlas() {
    const chunks = await Promise.all(ATLAS_PARTS.map(fetchText));
    const base64 = chunks.join('').replace(/\s+/g, '');
    if (!base64.startsWith('UklG')) throw new Error('invalid asteroid atlas');
    return `data:image/webp;base64,${base64}`;
  }

  async function loadData() {
    const chunks = await Promise.all(DATA_PARTS.map(fetchText));
    const base64 = chunks.join('').replace(/\s+/g, '');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return JSON.parse(text);
  }

  function buildQuestionIndex(data) {
    const categoryIds = new Set();
    for (const language of Object.keys(data?.categories || {})) {
      for (const [cid, label] of Object.entries(data.categories[language] || {})) {
        if (CATEGORY_RE.test(String(label || ''))) categoryIds.add(cid);
      }
    }
    const asteroidCid = [...categoryIds][0];
    if (!asteroidCid) return;

    const qIds = Object.keys(data.qmeta || {}).filter(id => data.qmeta[id]?.cid === asteroidCid).slice(0, 10);
    const map = new Map();
    for (const language of Object.keys(data.translations || {})) {
      const table = data.translations[language] || {};
      qIds.forEach((id, index) => {
        const text = normalize(table[id]?.question);
        if (text) map.set(text, index);
      });
    }
    questionIndex = map;
    scheduleDecorate();
  }

  function visibleCounterIndex() {
    const preferred = document.querySelectorAll('.section-title span,.q-count');
    for (const node of preferred) {
      const match = String(node.textContent || '').match(/\b(10|[1-9])\s*\/\s*10\b/);
      if (match) return Number(match[1]) - 1;
    }
    const match = String(document.body?.innerText || '').match(/\b(10|[1-9])\s*\/\s*10\b/);
    return match ? Number(match[1]) - 1 : -1;
  }

  function findFlashCard() {
    const direct = document.getElementById('flash-card');
    if (direct) return direct;
    const candidates = document.querySelectorAll('section.card,section.flash-card,.flash-card,section');
    for (const el of candidates) {
      const badge = el.querySelector('.badge');
      if (!badge || !CATEGORY_RE.test(badge.textContent || '')) continue;
      if (el.querySelector('h2,.answer-side,.tiny')) return el;
    }
    return null;
  }

  function ensureVisual(container, index, back, anchor, label) {
    if (!container || index < 0 || index > 9) return;
    let visual = container.querySelector(':scope > .asteroid-card-visual');
    if (!visual) {
      visual = document.createElement('div');
      visual.className = 'asteroid-card-visual';
      visual.setAttribute('role', 'img');
      if (anchor && anchor.parentNode === container) container.insertBefore(visual, anchor);
      else container.prepend(visual);
    }

    const side = back ? 'back' : 'front';
    const state = `${index}:${side}:${atlasUrl ? 'ready' : atlasError ? 'error' : 'loading'}`;
    if (visual.dataset.renderState === state) return;
    visual.dataset.renderState = state;
    visual.dataset.index = String(index);
    visual.dataset.side = side;
    visual.setAttribute('aria-label', label);

    if (atlasUrl) {
      visual.className = 'asteroid-card-visual';
      visual.textContent = '';
      visual.style.backgroundImage = `url("${atlasUrl}")`;
      visual.style.backgroundPosition = `${back ? 100 : 0}% ${index === 0 ? 0 : (index / 9) * 100}%`;
    } else if (atlasError) {
      visual.className = 'asteroid-card-visual is-error';
      visual.style.backgroundImage = 'none';
      visual.textContent = `Image error: ${atlasError}`;
    } else {
      visual.className = 'asteroid-card-visual is-loading';
      visual.style.backgroundImage = 'none';
      visual.textContent = 'Loading image…';
    }
  }

  function decorateCard() {
    const card = findFlashCard();
    if (!card) return;
    const badgeText = card.querySelector('.badge')?.textContent || '';
    if (!CATEGORY_RE.test(badgeText)) return;

    const index = visibleCounterIndex();
    if (index < 0) return;
    const isBack = !!card.querySelector('.answer-side');
    const anchor = card.querySelector('h2,.answer-side,.tiny');
    ensureVisual(card, index, isBack, anchor, isBack ? 'Answer image' : 'Card image');
  }

  function decorateQuiz() {
    const question = document.querySelector('.question');
    if (!question) return;
    const panel = question.closest('section') || question.parentElement;
    if (!panel) return;
    const category = document.querySelector('.quiz-meta small')?.textContent || document.querySelector('.quiz-meta strong')?.textContent || '';
    if (!CATEGORY_RE.test(category)) return;

    const questionText = normalize(question.textContent || '');
    let index = questionIndex.get(questionText);
    if (!Number.isInteger(index)) index = visibleCounterIndex();
    if (index < 0) return;
    const isBack = !!panel.querySelector('.feedback');
    ensureVisual(panel, index, isBack, question, isBack ? 'Answer image' : 'Question image');
  }

  function decorate() {
    try {
      decorateCard();
      decorateQuiz();
    } catch (error) {
      console.error('[ALBAMEN Cosmos] asteroid visual render failed', error);
    }
  }

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  }

  function installStyles() {
    if (document.getElementById('albamen-asteroid-visual-styles')) return;
    const style = document.createElement('style');
    style.id = 'albamen-asteroid-visual-styles';
    style.textContent = `
      .asteroid-card-visual{
        width:min(82%,260px)!important;
        aspect-ratio:1/1!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 auto!important;
        margin:14px auto 16px!important;
        padding:8px!important;
        box-sizing:border-box!important;
        border-radius:16px!important;
        background-repeat:no-repeat!important;
        background-size:200% 1000%!important;
        background-color:#0b1028!important;
        color:#9fb0d8!important;
        font:600 12px/1.35 Montserrat,system-ui,sans-serif!important;
        text-align:center!important;
        box-shadow:0 10px 26px rgba(0,0,0,.25)!important;
        pointer-events:none!important;
      }
      .asteroid-card-visual.is-loading{border:1px dashed rgba(72,202,255,.45)!important}
      .asteroid-card-visual.is-error{border:1px solid #fb7185!important;color:#fb7185!important}
      @media(max-width:520px){.asteroid-card-visual{width:min(76vw,240px)!important}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (installed) return;
    installed = true;
    window.__albamenAsteroidVisualsVersion = VERSION;
    installStyles();

    const observer = new MutationObserver(scheduleDecorate);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    scheduleDecorate();

    const timer = setInterval(scheduleDecorate, 500);
    setTimeout(() => clearInterval(timer), 120000);

    loadAtlas().then(url => {
      atlasUrl = url;
      window.__albamenAsteroidsAtlas = url;
      console.info('[ALBAMEN Cosmos] asteroid atlas loaded', VERSION);
      scheduleDecorate();
    }).catch(error => {
      atlasError = String(error?.message || error || 'unknown');
      console.error('[ALBAMEN Cosmos] asteroid atlas failed', error);
      scheduleDecorate();
    });

    loadData().then(data => {
      buildQuestionIndex(data);
      console.info('[ALBAMEN Cosmos] asteroid question mapping loaded', questionIndex.size);
    }).catch(error => {
      console.warn('[ALBAMEN Cosmos] asteroid mapping unavailable; counter fallback active', error);
    });
  }

  window.AlbamenAsteroidVisuals = { install, decorate: scheduleDecorate, version: VERSION };
})();