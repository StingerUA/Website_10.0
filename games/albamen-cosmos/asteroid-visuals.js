(function () {
  'use strict';

  const BASE = '/games/albamen-cosmos/';
  const VERSION = '20260912-7';
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
    const nodes = [...document.querySelectorAll('.section-title span,.q-count')];
    for (const node of nodes) {
      const match = String(node.textContent || '').match(/\b(10|[1-9])\s*\/\s*10\b/);
      if (match) return Number(match[1]) - 1;
    }
    const match = String(document.body?.innerText || '').match(/\b(10|[1-9])\s*\/\s*10\b/);
    return match ? Number(match[1]) - 1 : -1;
  }

  function findAsteroidBadge() {
    return [...document.querySelectorAll('.badge')].find(node => CATEGORY_RE.test(node.textContent || '')) || null;
  }

  function findFlashCard() {
    const direct = document.getElementById('flash-card');
    if (direct) return direct;
    const badge = findAsteroidBadge();
    if (badge) return badge.closest('.flash-card,.card,section,div');
    return [...document.querySelectorAll('.flash-card,.card,section')].find(el =>
      CATEGORY_RE.test(el.textContent || '') && el.querySelector('h2,.answer-side,.tiny')
    ) || null;
  }

  function visualStyle(index, back) {
    const y = index === 0 ? 0 : (index / 9) * 100;
    return [
      'display:block',
      'width:min(82%,260px)',
      'aspect-ratio:1/1',
      'flex:0 0 auto',
      'margin:42px auto 14px',
      'border-radius:16px',
      'box-sizing:border-box',
      'background-color:#0b1028',
      `background-image:${atlasUrl ? `url("${atlasUrl}")` : 'none'}`,
      `background-position:${back ? 100 : 0}% ${y}%`,
      'background-size:200% 1000%',
      'background-repeat:no-repeat',
      'box-shadow:0 10px 26px rgba(0,0,0,.25)',
      'pointer-events:none',
      'position:relative',
      'z-index:2'
    ].join(';');
  }

  function upsertVisual(host, index, back, kind) {
    if (!host || !Number.isInteger(index) || index < 0 || index > 9) return false;
    let visual = host.querySelector(':scope > .asteroid-inline-visual');
    if (!visual) {
      visual = document.createElement('div');
      visual.className = 'asteroid-inline-visual';
      visual.setAttribute('aria-hidden', 'true');
      const anchor = host.querySelector('h2,.answer-side,.question,.tiny');
      if (anchor && anchor.parentNode === host) host.insertBefore(visual, anchor);
      else host.appendChild(visual);
    }
    visual.style.cssText = visualStyle(index, back);
    visual.dataset.index = String(index);
    visual.dataset.side = back ? 'back' : 'front';
    visual.dataset.kind = kind;
    return true;
  }

  function decorateCard() {
    const card = findFlashCard();
    if (!card) return;
    const badge = card.querySelector('.badge') || findAsteroidBadge();
    const category = badge?.textContent || '';
    if (!CATEGORY_RE.test(category)) return;

    const index = visibleCounterIndex();
    if (index < 0) return;
    const back = !!card.querySelector('.answer-side');
    card.style.setProperty('justify-content', 'flex-start', 'important');
    if (upsertVisual(card, index, back, 'card')) {
      const key = `${index}:${back}:${!!atlasUrl}`;
      if (key !== lastCardLog) {
        lastCardLog = key;
        console.info('[ALBAMEN Cosmos] asteroid card visual applied', { index: index + 1, side: back ? 'B' : 'F', atlas: !!atlasUrl, host: card.id || card.className });
      }
    }
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
    const back = !!panel.querySelector('.feedback');
    if (upsertVisual(panel, index, back, 'quiz')) {
      const key = `${index}:${back}:${!!atlasUrl}`;
      if (key !== lastQuizLog) {
        lastQuizLog = key;
        console.info('[ALBAMEN Cosmos] asteroid quiz visual applied', { index: index + 1, side: back ? 'B' : 'F', atlas: !!atlasUrl });
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

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  }

  function install() {
    if (installed) return;
    installed = true;
    window.__albamenAsteroidVisualsVersion = VERSION;

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