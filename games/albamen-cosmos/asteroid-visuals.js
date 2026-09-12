(function () {
  'use strict';

  const BASE = '/games/albamen-cosmos/';
  const VERSION = '20260912-8';
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
  let lastProbe = '';
  let lastCardLog = '';
  let lastQuizLog = '';

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
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
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
  }

  function visibleCounterIndex() {
    const nodes = [...document.querySelectorAll('.section-title span,.q-count')];
    for (const node of nodes) {
      const match = String(node.textContent || '').match(/\b(10|[1-9])\s*\/\s*10\b/);
      if (match) return Number(match[1]) - 1;
    }
    return -1;
  }

  function getCard() {
    return document.getElementById('flash-card') || document.querySelector('section.flash-card,.flash-card');
  }

  function probeCard(card, badgeText, index) {
    const key = `${!!card}|${badgeText}|${index}|${!!atlasUrl}|${atlasError}`;
    if (key === lastProbe) return;
    lastProbe = key;
    console.info('[ALBAMEN Cosmos] asteroid card probe', {
      card: !!card,
      id: card?.id || '',
      className: card?.className || '',
      badge: badgeText,
      index: index >= 0 ? index + 1 : -1,
      atlas: !!atlasUrl,
      atlasError: atlasError || ''
    });
  }

  function ensureSprite(host, index, back, kind) {
    if (!host || !Number.isInteger(index) || index < 0 || index > 9 || !atlasUrl) return false;

    let visual = host.querySelector(':scope > .asteroid-inline-visual');
    if (!visual) {
      visual = document.createElement('div');
      visual.className = 'asteroid-inline-visual';
      visual.setAttribute('aria-hidden', 'true');
      visual.style.cssText = [
        'display:block',
        'width:min(82%,260px)',
        'aspect-ratio:1/1',
        'position:relative',
        'overflow:hidden',
        'flex:0 0 auto',
        'margin:42px auto 14px',
        'border-radius:16px',
        'box-sizing:border-box',
        'background:#0b1028',
        'box-shadow:0 10px 26px rgba(0,0,0,.25)',
        'pointer-events:none',
        'z-index:2'
      ].join(';');

      const img = document.createElement('img');
      img.className = 'asteroid-inline-sprite';
      img.alt = '';
      img.draggable = false;
      img.style.cssText = [
        'position:absolute',
        'width:200%',
        'height:1000%',
        'max-width:none',
        'max-height:none',
        'object-fit:fill',
        'pointer-events:none',
        'user-select:none'
      ].join(';');
      visual.appendChild(img);

      const anchor = host.querySelector('.answer-side,h2,.question,.tiny');
      if (anchor && anchor.parentNode === host) host.insertBefore(visual, anchor);
      else host.appendChild(visual);
    }

    const img = visual.querySelector('.asteroid-inline-sprite');
    if (!img) return false;
    if (img.src !== atlasUrl) img.src = atlasUrl;
    img.style.left = back ? '-100%' : '0';
    img.style.top = `${-index * 100}%`;

    visual.dataset.index = String(index);
    visual.dataset.side = back ? 'back' : 'front';
    visual.dataset.kind = kind;
    return true;
  }

  function decorateCard() {
    const card = getCard();
    const badgeText = card?.querySelector('.badge')?.textContent || '';
    const index = visibleCounterIndex();
    probeCard(card, badgeText, index);

    if (!card || !CATEGORY_RE.test(badgeText) || index < 0 || !atlasUrl) return;

    const back = !!card.querySelector('.answer-side');
    card.style.setProperty('justify-content', 'flex-start', 'important');
    if (ensureSprite(card, index, back, 'card')) {
      const key = `${index}:${back}:${atlasUrl}`;
      if (key !== lastCardLog) {
        lastCardLog = key;
        console.info('[ALBAMEN Cosmos] asteroid card visual applied', {
          index: index + 1,
          side: back ? 'B' : 'F',
          host: card.id || card.className
        });
      }
    }
  }

  function decorateQuiz() {
    const question = document.querySelector('.question');
    if (!question || !atlasUrl) return;
    const panel = question.closest('section.panel') || question.closest('section') || question.parentElement;
    if (!panel) return;

    const category = document.querySelector('.quiz-meta small')?.textContent || document.querySelector('.quiz-meta strong')?.textContent || '';
    if (!CATEGORY_RE.test(category)) return;

    const questionText = normalize(question.textContent || '');
    let index = questionIndex.get(questionText);
    if (!Number.isInteger(index)) index = visibleCounterIndex();
    if (index < 0) return;

    const back = !!panel.querySelector('.feedback');
    if (ensureSprite(panel, index, back, 'quiz')) {
      const key = `${index}:${back}:${atlasUrl}`;
      if (key !== lastQuizLog) {
        lastQuizLog = key;
        console.info('[ALBAMEN Cosmos] asteroid quiz visual applied', {
          index: index + 1,
          side: back ? 'B' : 'F'
        });
      }
    }
  }

  function decorate() {
    try {
      decorateCard();
      decorateQuiz();
    } catch (error) {
      console.error('[ALBAMEN Cosmos] asteroid visual render failed', error);
    }
  }

  function install() {
    if (installed) return;
    installed = true;
    window.__albamenAsteroidVisualsVersion = VERSION;
    console.info('[ALBAMEN Cosmos] asteroid renderer installed', VERSION);

    decorate();
    const timer = setInterval(decorate, 300);
    setTimeout(() => clearInterval(timer), 300000);
    document.addEventListener('click', () => setTimeout(decorate, 0), true);
    document.addEventListener('visibilitychange', decorate);

    loadAtlas().then(url => {
      atlasUrl = url;
      window.__albamenAsteroidsAtlas = url;
      console.info('[ALBAMEN Cosmos] asteroid atlas loaded', VERSION, url.slice(0, 24));
      decorate();
    }).catch(error => {
      atlasError = String(error?.message || error || 'unknown');
      console.error('[ALBAMEN Cosmos] asteroid atlas failed', error);
      decorate();
    });

    loadData().then(data => {
      buildQuestionIndex(data);
      console.info('[ALBAMEN Cosmos] asteroid question mapping loaded', questionIndex.size);
      decorate();
    }).catch(error => {
      console.warn('[ALBAMEN Cosmos] asteroid mapping unavailable; counter fallback active', error);
      decorate();
    });
  }

  window.AlbamenAsteroidVisuals = { install, decorate, version: VERSION };
})();