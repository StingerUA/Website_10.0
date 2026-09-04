// Educational model pages: turn Albaman's long narrative into readable translucent story cards.
// The source text is preserved; only presentation/paragraph grouping and disclosure controls are changed.
(function () {
  'use strict';

  var path = String((window.location && window.location.pathname) || '').toLowerCase();

  function isExcludedModelPage(value) {
    return /\/(?:ar-restaurant|game|games|scanner)(?:\/|$)/.test(value) ||
      /\/(?:shop|cart|account|favorites|orders)(?:\.html|\/|$)/.test(value) ||
      /\/product-[^/]+(?:\.html|\/|$)/.test(value) ||
      /\/found-models\.html$/.test(value);
  }

  if (isExcludedModelPage(path)) return;

  var GROUP_PATTERN = [3, 2, 3, 3, 2];
  var STYLE_ID = 'atlas-story-cards-styles';
  var STORY_ID = 'albaStoryContent';

  var STRINGS = {
    tr: { show: 'Metni göster', hide: 'Metni gizle' },
    en: { show: 'Show text', hide: 'Show less' },
    ru: { show: 'Показать текст', hide: 'Скрыть' },
    ar: { show: 'إظهار النص', hide: 'إخفاء النص' }
  };

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
      '.atlas-story-cards{',
      '  width:min(100%,1040px);',
      '  margin:18px auto 34px;',
      '  display:flex;',
      '  flex-direction:column;',
      '  gap:18px;',
      '}',
      '.atlas-story-cards[hidden]{display:none!important;}',
      '.atlas-story-card{',
      '  position:relative;',
      '  isolation:isolate;',
      '  overflow:hidden;',
      '  width:100%;',
      '  padding:clamp(19px,2.4vw,28px);',
      '  border:1px solid rgba(125,211,252,.27);',
      '  border-radius:22px;',
      '  background:linear-gradient(135deg,rgba(3,105,161,.34) 0%,rgba(14,165,233,.16) 42%,rgba(2,6,23,.76) 100%);',
      '  box-shadow:0 18px 48px rgba(2,6,23,.28),inset 0 1px 0 rgba(255,255,255,.05),0 0 32px rgba(14,165,233,.07);',
      '  -webkit-backdrop-filter:blur(16px) saturate(125%);',
      '  backdrop-filter:blur(16px) saturate(125%);',
      '}',
      '.atlas-story-card::before{',
      '  content:"";',
      '  position:absolute;',
      '  inset:0 0 auto 0;',
      '  height:1px;',
      '  background:linear-gradient(90deg,transparent,rgba(125,211,252,.8),rgba(34,211,238,.55),transparent);',
      '  z-index:-1;',
      '}',
      '.atlas-story-card::after{',
      '  content:"";',
      '  position:absolute;',
      '  width:240px;',
      '  height:240px;',
      '  border-radius:50%;',
      '  right:-115px;',
      '  top:-135px;',
      '  background:radial-gradient(circle,rgba(56,189,248,.16) 0%,rgba(14,165,233,.06) 42%,transparent 72%);',
      '  pointer-events:none;',
      '  z-index:-1;',
      '}',
      '.atlas-story-card--2{width:min(90%,900px);}',
      '.atlas-story-card--2:nth-child(even){align-self:flex-end;}',
      '.atlas-story-card--2:nth-child(odd){align-self:flex-start;}',
      '.atlas-story-card--tone-2{background:linear-gradient(145deg,rgba(2,132,199,.27) 0%,rgba(8,47,73,.38) 48%,rgba(2,6,23,.79) 100%);}',
      '.atlas-story-card--tone-3{background:linear-gradient(128deg,rgba(14,116,144,.30) 0%,rgba(6,78,120,.24) 44%,rgba(2,6,23,.80) 100%);}',
      '.atlas-story-card--tone-4{background:linear-gradient(150deg,rgba(3,105,161,.30) 0%,rgba(30,64,175,.15) 46%,rgba(2,6,23,.80) 100%);}',
      '.atlas-story-card--tone-5{background:linear-gradient(132deg,rgba(8,145,178,.25) 0%,rgba(14,116,144,.20) 46%,rgba(2,6,23,.79) 100%);}',
      '.atlas-story-paragraph{',
      '  position:relative;',
      '  z-index:1;',
      '  margin:0;',
      '  color:rgba(248,250,252,.96);',
      '  font-size:clamp(1rem,.97rem + .16vw,1.08rem);',
      '  font-weight:430;',
      '  line-height:1.78;',
      '  letter-spacing:.006em;',
      '  text-wrap:pretty;',
      '  text-shadow:0 1px 8px rgba(2,6,23,.42);',
      '}',
      '.atlas-story-paragraph:first-child{',
      '  color:#ffffff;',
      '  font-size:clamp(1.05rem,1rem + .22vw,1.14rem);',
      '  font-weight:600;',
      '  line-height:1.72;',
      '}',
      '.atlas-story-paragraph + .atlas-story-paragraph{',
      '  margin-top:15px;',
      '  padding-top:15px;',
      '  border-top:1px solid rgba(125,211,252,.11);',
      '}',
      '.atlas-story-paragraph--signoff{',
      '  color:#bae6fd!important;',
      '  font-size:clamp(.94rem,.91rem + .12vw,1rem)!important;',
      '  font-weight:560!important;',
      '  font-style:italic;',
      '  letter-spacing:.015em;',
      '}',
      '.atlas-story-toggle{',
      '  display:block;',
      '  margin:10px auto 24px;',
      '  padding:12px 24px;',
      '  background:linear-gradient(135deg,rgba(29,73,105,.92),rgba(3,105,161,.72));',
      '  color:#fff;',
      '  border:1px solid #4192cc;',
      '  border-radius:10px;',
      '  font-size:16px;',
      '  font-weight:600;',
      '  cursor:pointer;',
      '  transition:all .25s ease;',
      '  -webkit-backdrop-filter:blur(6px);',
      '  backdrop-filter:blur(6px);',
      '  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      '  box-shadow:0 8px 28px rgba(2,6,23,.24);',
      '}',
      '.atlas-story-toggle:hover{background:#0096ff;box-shadow:0 0 15px rgba(0,150,255,.6);}',
      '[dir="rtl"] .atlas-story-paragraph,.atlas-story-cards[dir="rtl"] .atlas-story-paragraph{text-align:right;}',
      '@media (max-width:767px){',
      '  .atlas-story-cards{gap:14px;margin:14px auto 26px;}',
      '  .atlas-story-card,.atlas-story-card--2{width:100%;align-self:stretch;padding:18px 17px;border-radius:18px;}',
      '  .atlas-story-paragraph{font-size:.98rem;line-height:1.72;}',
      '  .atlas-story-paragraph:first-child{font-size:1.04rem;}',
      '  .atlas-story-paragraph + .atlas-story-paragraph{margin-top:13px;padding-top:13px;}',
      '  .atlas-story-toggle{padding:10px 16px;font-size:14px;margin-bottom:20px;}',
      '}',
      '@media (prefers-reduced-motion:no-preference){',
      '  .atlas-story-card{transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;}',
      '  .atlas-story-card:hover{transform:translateY(-2px);border-color:rgba(125,211,252,.42);box-shadow:0 20px 54px rgba(2,6,23,.32),0 0 38px rgba(14,165,233,.10);}',
      '}'
    ].join('\n');

    (document.head || document.documentElement).appendChild(style);
  }

  function splitByDoubleBreak(paragraph) {
    if (!paragraph) return [];
    return String(paragraph.innerHTML || '')
      .split(/(?:<br\s*\/?>(?:\s|&nbsp;)*){2,}/i)
      .map(function (part) { return part.trim(); })
      .filter(Boolean);
  }

  function makeGroups(parts) {
    var groups = [];
    var cursor = 0;
    var patternIndex = 0;

    while (cursor < parts.length) {
      var remaining = parts.length - cursor;
      var take;

      if (remaining <= 3) {
        take = remaining;
      } else {
        take = GROUP_PATTERN[patternIndex % GROUP_PATTERN.length];
        if (remaining - take === 1) take = take === 3 ? 2 : 3;
      }

      if (take < 2) {
        if (groups.length) groups[groups.length - 1].push(parts[cursor]);
        break;
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

  function removeLegacyToggleArtifacts(root) {
    var oldButton = document.getElementById('toggleBtn');
    if (oldButton) oldButton.remove();

    var oldStyle = document.getElementById('text-toggle-css');
    if (oldStyle) oldStyle.remove();

    var legacyWrapper = root && root.querySelector(':scope > #textContent');
    return legacyWrapper || null;
  }

  function blockOldTextToggle(wrapper) {
    var oldStyle = document.getElementById('text-toggle-css');
    if (oldStyle) oldStyle.remove();

    var firstParagraph = wrapper && wrapper.querySelector('.atlas-story-paragraph');
    if (firstParagraph && !document.getElementById('textContent')) firstParagraph.id = 'textContent';
  }

  function ensureStoryToggle(wrapper) {
    if (!wrapper || !wrapper.parentNode) return;

    injectStyles();

    var strings = STRINGS[detectLanguage()] || STRINGS.tr;
    var oldButton = document.getElementById('toggleBtn');
    if (oldButton) oldButton.remove();

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

    // Keep the hint above the button so the AR button itself sits directly above the MP3 player.
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

  function upgradeExistingStory(root, wrapper) {
    if (!wrapper) return;
    wrapper.id = STORY_ID;
    wrapper.setAttribute('data-atlas-story-enhanced', 'true');
    blockOldTextToggle(wrapper);
    ensureStoryToggle(wrapper);
    watchScannerAndPlayer(root);
    root.setAttribute('data-atlas-story-root', 'true');
  }

  function enhanceRoot(root) {
    if (!root || !root.querySelector('model-viewer')) return;

    var existing = root.querySelector(':scope > .atlas-story-cards');
    if (existing) {
      upgradeExistingStory(root, existing);
      return;
    }

    var directChildren = Array.prototype.slice.call(root.children || []);
    var viewerIndex = directChildren.findIndex(function (el) {
      return el && el.tagName && el.tagName.toLowerCase() === 'model-viewer';
    });

    var legacyWrapper = directChildren.find(function (el, index) {
      return el && el.id === 'textContent' && (viewerIndex < 0 || index < viewerIndex) && el.querySelector('p');
    }) || null;

    var candidateParagraphs = directChildren.filter(function (el, index) {
      return el && el.tagName === 'P' && (viewerIndex < 0 || index < viewerIndex);
    });

    if (legacyWrapper) {
      var wrappedParagraph = legacyWrapper.querySelector('p');
      if (wrappedParagraph) candidateParagraphs.unshift(wrappedParagraph);
    }

    var sourceNodes = [];
    var parts = [];
    var insertionAnchor = null;

    candidateParagraphs.some(function (p) {
      var split = splitByDoubleBreak(p);
      if (split.length >= 4) {
        var parentLegacy = p.closest && p.closest('#textContent');
        if (parentLegacy && parentLegacy.parentNode === root) {
          sourceNodes = [parentLegacy];
          insertionAnchor = parentLegacy;
        } else {
          sourceNodes = [p];
          insertionAnchor = p;
        }
        parts = split;
        return true;
      }
      return false;
    });

    if (!parts.length) {
      var directParagraphs = candidateParagraphs.filter(function (p) { return p.parentNode === root; });
      if (directParagraphs.length >= 4) {
        sourceNodes = directParagraphs;
        insertionAnchor = directParagraphs[0];
        parts = directParagraphs
          .map(function (p) { return String(p.innerHTML || '').trim(); })
          .filter(Boolean);
      }
    }

    if (parts.length < 4 || !sourceNodes.length || !insertionAnchor) return;

    removeLegacyToggleArtifacts(root);

    var wrapper = buildCards(parts);
    insertionAnchor.parentNode.insertBefore(wrapper, insertionAnchor);
    sourceNodes.forEach(function (node) {
      if (node.parentNode) node.parentNode.removeChild(node);
    });

    blockOldTextToggle(wrapper);
    ensureStoryToggle(wrapper);
    watchScannerAndPlayer(root);
    root.setAttribute('data-atlas-story-root', 'true');
  }

  function enhanceAtlasStories() {
    if (!document.querySelector('model-viewer')) return;

    var roots = [];
    document.querySelectorAll('model-viewer').forEach(function (viewer) {
      var root = viewer.closest('.container') || viewer.parentElement;
      if (root && roots.indexOf(root) === -1) roots.push(root);
    });

    roots.forEach(enhanceRoot);
  }

  window.AlbaStoryCards = window.AlbaStoryCards || {};
  window.AlbaStoryCards.refresh = enhanceAtlasStories;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAtlasStories, { once: true });
  } else {
    enhanceAtlasStories();
  }
})();
