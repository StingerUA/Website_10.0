(function () {
  'use strict';

  const BASE = '/games/albamen-cosmos/';
  const VERSION = '20260912-6';
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
    return document.getElementById('flash-card') ||
      document.querySelector('.flash-card') ||
      [...document.querySelectorAll('section.card,.card,section')].find(el => el.querySelector('.badge') && el.querySelector('h2,.answer-side,.tiny')) ||
      null;
  }

  function currentCardCategory(card) {
    const badge = card?.querySelector('.badge')?.textContent || '';
    if (badge) return badge;
    const titles = [...document.querySelectorAll('.section-title h3')];
    return titles.map(x => x.textContent || '').find(x => CATEGORY_RE.test(x)) || '';
  }

  function applyVisual(host, index, back) {
    if (!host || !Number.isInteger(index) || index < 0 || index > 9) return;
    host.classList.add('asteroid-visual-host');
    host.classList.toggle('asteroid-visual-loading', !atlasUrl && !atlasError);
    host.classList.toggle('asteroid-visual-error', !!atlasError);
    host.style.setProperty('--asteroid-visual-image', atlasUrl ? `url("${atlasUrl}")` : 'none');
    host.style.setProperty('--asteroid-visual-x', back ? '100%' : '0%');
    host.style.setProperty('--asteroid-visual-y', `${index === 0 ? 0 : (index / 9) * 100}%`);
    host.dataset.asteroidVisualIndex = String(index);
    host.dataset.asteroidVisualSide = back ? 'back' : 'front';
  }

  function clearVisual(host) {
    if (!host) return;
    host.classList.remove('asteroid-visual-host','asteroid-visual-loading','asteroid-visual-error');
    host.style.removeProperty('--asteroid-visual-image');
    host.style.removeProperty('--asteroid-visual-x');
    host.style.removeProperty('--asteroid-visual-y');
    delete host.dataset.asteroidVisualIndex;
    delete host.dataset.asteroidVisualSide;
  }

  function decorateCard() {
    const card = findFlashCard();
    if (!card) return;
    const category = currentCardCategory(card);
    if (!CATEGORY_RE.test(category)) {
      clearVisual(card);
      return;
    }
    const index = visibleCounterIndex();
    if (index < 0) return;
    applyVisual(card, index, !!card.querySelector('.answer-side'));
  }

  function decorateQuiz() {
    const question = document.querySelector('.question');
    if (!question) return;
    const panel = question.closest('section') || question.parentElement;
    if (!panel) return;
    const category = document.querySelector('.quiz-meta small')?.textContent || document.querySelector('.quiz-meta strong')?.textContent || '';
    if (!CATEGORY_RE.test(category)) {
      clearVisual(panel);
      return;
    }

    const questionText = normalize(question.textContent || '');
    let index = questionIndex.get(questionText);
    if (!Number.isInteger(index)) index = visibleCounterIndex();
    if (index < 0) return;
    applyVisual(panel, index, !!panel.querySelector('.feedback'));
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
      .asteroid-visual-host::before{
        content:""!important;
        display:block!important;
        width:min(82%,260px)!important;
        aspect-ratio:1/1!important;
        flex:0 0 auto!important;
        margin:34px auto 16px!important;
        box-sizing:border-box!important;
        border-radius:16px!important;
        background-image:var(--asteroid-visual-image)!important;
        background-position:var(--asteroid-visual-x) var(--asteroid-visual-y)!important;
        background-size:200% 1000%!important;
        background-repeat:no-repeat!important;
        background-color:#0b1028!important;
        box-shadow:0 10px 26px rgba(0,0,0,.25)!important;
        pointer-events:none!important;
      }
      .panel.asteroid-visual-host::before{margin:0 auto 16px!important}
      .asteroid-visual-host.asteroid-visual-loading::before{border:1px dashed rgba(72,202,255,.45)!important}
      .asteroid-visual-host.asteroid-visual-error::before{border:1px solid #fb7185!important}
      .flash-card.asteroid-visual-host{justify-content:flex-start!important}
      .flash-card.asteroid-visual-host h2{margin-top:4px!important}
      @media(max-width:520px){
        .asteroid-visual-host::before{width:min(70vw,238px)!important}
      }
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

    const timer = setInterval(scheduleDecorate, 400);
    setTimeout(() => clearInterval(timer), 180000);

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