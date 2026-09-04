// Educational model pages: render Albaman narration as readable translucent cards.
// Works for both /atlas/... and regular model-viewer pages.
(function () {
  'use strict';

  var path = String((window.location && window.location.pathname) || '').toLowerCase();
  var GROUP_PATTERN = [3, 2, 3, 3, 2];
  var STYLE_ID = 'atlas-story-cards-styles';
  var STORY_ID = 'albaStoryContent';
  var renderLock = false;
  var refreshTimer = null;

  var STRINGS = {
    tr: { show: 'Metni göster', hide: 'Metni gizle' },
    en: { show: 'Show text', hide: 'Show less' },
    ru: { show: 'Показать текст', hide: 'Скрыть' },
    ar: { show: 'إظهار النص', hide: 'إخفاء النص' }
  };

  function isExcludedModelPage(value) {
    return /\/(?:ar-restaurant|game|games|scanner)(?:\/|$)/.test(value) ||
      /\/(?:shop|cart|account|favorites|orders)(?:\.html|\/|$)/.test(value) ||
      /\/product-[^/]+(?:\.html|\/|$)/.test(value) ||
      /\/found-models\.html$/.test(value);
  }

  if (isExcludedModelPage(path)) return;

  function detectLanguage() {
    if (path.indexOf('/eng/') === 0) return 'en';
    if (path.indexOf('/rus/') === 0) return 'ru';
    if (path.indexOf('/ar/') === 0) return 'ar';
    return 'tr';
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.atlas-story-cards{width:min(100%,1040px);margin:18px auto 34px;display:flex;flex-direction:column;gap:18px;}',
      '.atlas-story-cards[hidden]{display:none!important;}',
      '.atlas-story-card{position:relative;isolation:isolate;overflow:hidden;width:100%;padding:clamp(19px,2.4vw,28px);border:1px solid rgba(125,211,252,.27);border-radius:22px;background:linear-gradient(135deg,rgba(3,105,161,.34) 0%,rgba(14,165,233,.16) 42%,rgba(2,6,23,.76) 100%);box-shadow:0 18px 48px rgba(2,6,23,.28),inset 0 1px 0 rgba(255,255,255,.05),0 0 32px rgba(14,165,233,.07);-webkit-backdrop-filter:blur(16px) saturate(125%);backdrop-filter:blur(16px) saturate(125%);}',
      '.atlas-story-card::before{content:"";position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,rgba(125,211,252,.8),rgba(34,211,238,.55),transparent);z-index:-1;}',
      '.atlas-story-card::after{content:"";position:absolute;width:240px;height:240px;border-radius:50%;right:-115px;top:-135px;background:radial-gradient(circle,rgba(56,189,248,.16) 0%,rgba(14,165,233,.06) 42%,transparent 72%);pointer-events:none;z-index:-1;}',
      '.atlas-story-card--2{width:min(90%,900px);}',
      '.atlas-story-card--2:nth-child(even){align-self:flex-end;}',
      '.atlas-story-card--2:nth-child(odd){align-self:flex-start;}',
      '.atlas-story-card--tone-2{background:linear-gradient(145deg,rgba(2,132,199,.27) 0%,rgba(8,47,73,.38) 48%,rgba(2,6,23,.79) 100%);}',
      '.atlas-story-card--tone-3{background:linear-gradient(128deg,rgba(14,116,144,.30) 0%,rgba(6,78,120,.24) 44%,rgba(2,6,23,.80) 100%);}',
      '.atlas-story-card--tone-4{background:linear-gradient(150deg,rgba(3,105,161,.30) 0%,rgba(30,64,175,.15) 46%,rgba(2,6,23,.80) 100%);}',
      '.atlas-story-card--tone-5{background:linear-gradient(132deg,rgba(8,145,178,.25) 0%,rgba(14,116,144,.20) 46%,rgba(2,6,23,.79) 100%);}',
      '.atlas-story-paragraph{position:relative;z-index:1;margin:0;color:rgba(248,250,252,.96);font-size:clamp(1rem,.97rem + .16vw,1.08rem);font-weight:430;line-height:1.78;letter-spacing:.006em;text-wrap:pretty;text-shadow:0 1px 8px rgba(2,6,23,.42);}',
      '.atlas-story-paragraph:first-child{color:#fff;font-size:clamp(1.05rem,1rem + .22vw,1.14rem);font-weight:600;line-height:1.72;}',
      '.atlas-story-paragraph + .atlas-story-paragraph{margin-top:15px;padding-top:15px;border-top:1px solid rgba(125,211,252,.11);}',
      '.atlas-story-paragraph--signoff{color:#bae6fd!important;font-size:clamp(.94rem,.91rem + .12vw,1rem)!important;font-weight:560!important;font-style:italic;letter-spacing:.015em;}',
      '.atlas-story-toggle{display:block;margin:10px auto 24px;padding:12px 24px;background:linear-gradient(135deg,rgba(29,73,105,.92),rgba(3,105,161,.72));color:#fff;border:1px solid #4192cc;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;transition:all .25s ease;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 28px rgba(2,6,23,.24);}',
      '.atlas-story-toggle:hover{background:#0096ff;box-shadow:0 0 15px rgba(0,150,255,.6);}',
      '[dir="rtl"] .atlas-story-paragraph,.atlas-story-cards[dir="rtl"] .atlas-story-paragraph{text-align:right;}',
      '@media(max-width:767px){.atlas-story-cards{gap:14px;margin:14px auto 26px}.atlas-story-card,.atlas-story-card--2{width:100%;align-self:stretch;padding:18px 17px;border-radius:18px}.atlas-story-paragraph{font-size:.98rem;line-height:1.72}.atlas-story-paragraph:first-child{font-size:1.04rem}.atlas-story-paragraph + .atlas-story-paragraph{margin-top:13px;padding-top:13px}.atlas-story-toggle{padding:10px 16px;font-size:14px;margin-bottom:20px}}',
      '@media(prefers-reduced-motion:no-preference){.atlas-story-card{transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}.atlas-story-card:hover{transform:translateY(-2px);border-color:rgba(125,211,252,.42);box-shadow:0 20px 54px rgba(2,6,23,.32),0 0 38px rgba(14,165,233,.10)}}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
  }

  function cleanParts(parts) {
    return parts.map(function (part) { return String(part || '').trim(); }).filter(Boolean);
  }

  // Normalize one HTML block into logical paragraphs. Most narration files use
  // <br><br>, but some older pages use single <br> separators.
  function splitHtmlIntoParagraphs(html) {
    html = String(html || '').trim();
    if (!html) return [];

    var doubleBreakParts = cleanParts(html.split(/(?:<br\s*\/?>(?:\s|&nbsp;)*){2,}/i));
    if (doubleBreakParts.length > 1) return doubleBreakParts;

    var breaks = html.match(/<br\s*\/?>/gi) || [];
    if (breaks.length >= 3) {
      var singleBreakParts = cleanParts(html.split(/<br\s*\/?>/i));
      if (singleBreakParts.length >= 3) return singleBreakParts;
    }

    return [html];
  }

  function makeGroups(parts) {
    var groups = [];
    var cursor = 0;
    var patternIndex = 0;

    while (cursor < parts.length) {
      var remaining = parts.length - cursor;
      var desired = GROUP_PATTERN[patternIndex % GROUP_PATTERN.length];
      var take = Math.min(desired, remaining);

      // Avoid an orphan final card containing only one paragraph.
      if (remaining - take === 1 && take > 2) take -= 1;
      if (take === 1 && groups.length) {
        groups[groups.length - 1].push(parts[cursor]);
        cursor += 1;
        continue;
      }

      groups.push(parts.slice(cursor, cursor + take));
      cursor += take;
      patternIndex += 1;
    }

    return groups;
  }

  function buildCards(parts) {
    var wrapper = document.createElement('div');
    wrapper.id = STORY_ID;
    wrapper.className = 'atlas-story-cards';
    wrapper.setAttribute('data-atlas-story-enhanced', 'true');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.hidden = true;

    var direction = document.documentElement.getAttribute('dir') || (document.body && document.body.getAttribute('dir'));
    if (direction) wrapper.setAttribute('dir', direction);

    makeGroups(parts).forEach(function (group, index) {
      var card = document.createElement('div');
      var tone = (index % 5) + 1;
      card.className = 'atlas-story-card atlas-story-card--' + group.length + ' atlas-story-card--tone-' + tone;

      group.forEach(function (html) {
        var p = document.createElement('p');
        p.className = 'atlas-story-paragraph';
        p.innerHTML = html;
        if (/vael-khrun/i.test(p.textContent || '')) p.classList.add('atlas-story-paragraph--signoff');
        card.appendChild(p);
      });

      wrapper.appendChild(card);
    });

    return wrapper;
  }

  function removeToggleArtifacts() {
    var oldButton = document.getElementById('toggleBtn');
    if (oldButton) oldButton.remove();
    var oldStyle = document.getElementById('text-toggle-css');
    if (oldStyle) oldStyle.remove();
  }

  // Prevent the legacy text-toggle.js from wrapping one story paragraph later.
  function markLegacyToggleHandled(wrapper) {
    var firstParagraph = wrapper && wrapper.querySelector('.atlas-story-paragraph');
    if (firstParagraph && !document.getElementById('textContent')) firstParagraph.id = 'textContent';
  }

  function ensureStoryToggle(wrapper) {
    if (!wrapper || !wrapper.parentNode) return;
    injectStyles();
    removeToggleArtifacts();

    var strings = STRINGS[detectLanguage()] || STRINGS.tr;
    var button = document.createElement('button');
    button.id = 'toggleBtn';
    button.className = 'toggle-btn atlas-story-toggle';
    button.type = 'button';
    button.textContent = strings.show;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', STORY_ID);
    button.setAttribute('data-story-toggle-owned', 'true');

    wrapper.hidden = true;
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.classList.remove('expanded');
    wrapper.parentNode.insertBefore(button, wrapper.nextSibling);

    button.addEventListener('click', function () {
      var willExpand = wrapper.hidden;
      wrapper.hidden = !willExpand;
      wrapper.classList.toggle('expanded', willExpand);
      wrapper.setAttribute('aria-hidden', willExpand ? 'false' : 'true');
      button.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
      button.textContent = willExpand ? strings.hide : strings.show;
    });
  }

  function repositionScanner(root) {
    if (!root) return false;
    var player = document.getElementById('albaModelPlayer');
    var viewer = root.querySelector('model-viewer');
    var wrap = document.getElementById('alba-scanner-btn-wrap');
    var hint = document.getElementById('alba-scanner-hint');
    if (!wrap) return false;

    var target = player || viewer;
    if (!target || !target.parentNode) return false;
    var parent = target.parentNode;
    if (hint) parent.insertBefore(hint, target);
    parent.insertBefore(wrap, target);
    return !!player;
  }

  function watchScannerAndPlayer(root) {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      var done = repositionScanner(root);
      if (done || attempts >= 40) clearInterval(timer);
    }, 150);
  }

  function findInjectedNarrationParts(wrapper) {
    if (!wrapper) return [];
    var paragraphs = Array.prototype.slice.call(wrapper.querySelectorAll('.atlas-story-paragraph'));
    var best = [];

    paragraphs.forEach(function (p) {
      var split = splitHtmlIntoParagraphs(p.innerHTML);
      var isNarrationTarget = p.hasAttribute('data-albamen-narration');
      if ((isNarrationTarget && split.length >= 2) || split.length >= 4) {
        if (split.length > best.length) best = split;
      }
    });

    return best;
  }

  function rebuildExistingStory(root, wrapper) {
    if (!wrapper || !wrapper.parentNode) return false;
    var injectedParts = findInjectedNarrationParts(wrapper);
    if (injectedParts.length < 2) return false;

    renderLock = true;
    try {
      removeToggleArtifacts();
      var replacement = buildCards(injectedParts);
      wrapper.parentNode.replaceChild(replacement, wrapper);
      markLegacyToggleHandled(replacement);
      ensureStoryToggle(replacement);
      watchScannerAndPlayer(root);
      root.setAttribute('data-atlas-story-root', 'true');
    } finally {
      renderLock = false;
    }
    return true;
  }

  function collectSource(root) {
    var directChildren = Array.prototype.slice.call(root.children || []);
    var viewerIndex = directChildren.findIndex(function (el) {
      return el && el.tagName && el.tagName.toLowerCase() === 'model-viewer';
    });

    var sources = [];
    directChildren.forEach(function (el, index) {
      if (viewerIndex >= 0 && index >= viewerIndex) return;
      if (!el) return;
      if (el.tagName === 'P') sources.push({ node: el, paragraph: el });
      if (el.id === 'textContent') {
        var p = el.querySelector('p');
        if (p) sources.push({ node: el, paragraph: p });
      }
    });

    if (!sources.length) return null;

    // Prefer a single long narration block when present. This avoids mixing an
    // updated narration with stale paragraphs left behind by an earlier render.
    for (var i = 0; i < sources.length; i += 1) {
      var single = splitHtmlIntoParagraphs(sources[i].paragraph.innerHTML);
      if (single.length >= 4) {
        return { nodes: [sources[i].node], anchor: sources[i].node, parts: single };
      }
    }

    // Otherwise flatten every source paragraph. A source <p> may itself contain
    // several logical paragraphs, so never treat the whole block as one card item.
    var parts = [];
    sources.forEach(function (source) {
      parts = parts.concat(splitHtmlIntoParagraphs(source.paragraph.innerHTML));
    });

    if (parts.length < 4) return null;
    return {
      nodes: sources.map(function (source) { return source.node; }),
      anchor: sources[0].node,
      parts: parts
    };
  }

  function enhanceRoot(root) {
    if (!root || !root.querySelector('model-viewer')) return;

    var existing = root.querySelector(':scope > .atlas-story-cards');
    if (existing) {
      if (rebuildExistingStory(root, existing)) return;
      existing.id = STORY_ID;
      existing.setAttribute('data-atlas-story-enhanced', 'true');
      markLegacyToggleHandled(existing);
      ensureStoryToggle(existing);
      watchScannerAndPlayer(root);
      root.setAttribute('data-atlas-story-root', 'true');
      return;
    }

    var source = collectSource(root);
    if (!source) return;

    renderLock = true;
    try {
      removeToggleArtifacts();
      var wrapper = buildCards(source.parts);
      source.anchor.parentNode.insertBefore(wrapper, source.anchor);
      source.nodes.forEach(function (node) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });
      markLegacyToggleHandled(wrapper);
      ensureStoryToggle(wrapper);
      watchScannerAndPlayer(root);
      root.setAttribute('data-atlas-story-root', 'true');
    } finally {
      renderLock = false;
    }
  }

  function enhanceAll() {
    if (renderLock || !document.querySelector('model-viewer')) return;
    var roots = [];
    document.querySelectorAll('model-viewer').forEach(function (viewer) {
      var root = viewer.closest('.container') || viewer.parentElement;
      if (root && roots.indexOf(root) === -1) roots.push(root);
    });
    roots.forEach(enhanceRoot);
  }

  function scheduleRefresh() {
    if (renderLock) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(enhanceAll, 30);
  }

  window.AlbaStoryCards = window.AlbaStoryCards || {};
  window.AlbaStoryCards.refresh = enhanceAll;

  // Narration scripts may replace the first paragraph after cards were already
  // created. Observe that mutation and rebuild all cards from the final text.
  function startObserver() {
    if (!document.body || !window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      if (renderLock) return;
      var relevant = mutations.some(function (mutation) {
        var target = mutation.target && mutation.target.nodeType === 1
          ? mutation.target
          : mutation.target && mutation.target.parentElement;
        return target && target.closest && (
          target.closest('.atlas-story-cards') ||
          target.closest('#textContent') ||
          target.matches('[data-albamen-narration]')
        );
      });
      if (relevant) scheduleRefresh();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-albamen-narration'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      enhanceAll();
      startObserver();
    }, { once: true });
  } else {
    enhanceAll();
    startObserver();
  }
})();
