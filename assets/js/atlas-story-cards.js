// Atlas model pages: turn Albaman's long narrative into readable translucent story cards.
// The source text is preserved; only presentation/paragraph grouping is changed.
(function () {
  'use strict';

  var path = String((window.location && window.location.pathname) || '').toLowerCase();
  if (path.indexOf('/atlas/') === -1) return;

  var GROUP_PATTERN = [3, 2, 3, 3, 2];
  var STYLE_ID = 'atlas-story-cards-styles';

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
      '  color:#bae6fd !important;',
      '  font-size:clamp(.94rem,.91rem + .12vw,1rem) !important;',
      '  font-weight:560 !important;',
      '  font-style:italic;',
      '  letter-spacing:.015em;',
      '}',
      '[dir="rtl"] .atlas-story-paragraph,.atlas-story-cards[dir="rtl"] .atlas-story-paragraph{text-align:right;}',
      '@media (max-width:767px){',
      '  .atlas-story-cards{gap:14px;margin:14px auto 26px;}',
      '  .atlas-story-card,.atlas-story-card--2{',
      '    width:100%;',
      '    align-self:stretch;',
      '    padding:18px 17px;',
      '    border-radius:18px;',
      '  }',
      '  .atlas-story-paragraph{font-size:.98rem;line-height:1.72;}',
      '  .atlas-story-paragraph:first-child{font-size:1.04rem;}',
      '  .atlas-story-paragraph + .atlas-story-paragraph{margin-top:13px;padding-top:13px;}',
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
        // Never leave a final one-paragraph card: switch 3<->2 when needed.
        if (remaining - take === 1) take = take === 3 ? 2 : 3;
      }

      if (take < 2) {
        if (groups.length) {
          groups[groups.length - 1].push(parts[cursor]);
        }
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
    wrapper.className = 'atlas-story-cards';
    wrapper.setAttribute('data-atlas-story-enhanced', 'true');

    var direction = document.documentElement.getAttribute('dir') || document.body.getAttribute('dir');
    if (direction) wrapper.setAttribute('dir', direction);

    makeGroups(parts).forEach(function (group, index) {
      var card = document.createElement('div');
      var tone = (index % 5) + 1;
      card.className = 'atlas-story-card atlas-story-card--' + group.length + ' atlas-story-card--tone-' + tone;

      group.forEach(function (html) {
        var p = document.createElement('p');
        p.className = 'atlas-story-paragraph';
        p.innerHTML = html;
        if (/vael-khrun/i.test(p.textContent || '')) {
          p.classList.add('atlas-story-paragraph--signoff');
        }
        card.appendChild(p);
      });

      wrapper.appendChild(card);
    });

    return wrapper;
  }

  function enhanceRoot(root) {
    if (!root || root.getAttribute('data-atlas-story-root') === 'true') return;
    if (!root.querySelector('model-viewer')) return;

    var directChildren = Array.prototype.slice.call(root.children || []);
    var viewerIndex = directChildren.findIndex(function (el) {
      return el && el.tagName && el.tagName.toLowerCase() === 'model-viewer';
    });

    var candidateParagraphs = directChildren.filter(function (el, index) {
      return el && el.tagName === 'P' && (viewerIndex < 0 || index < viewerIndex);
    });

    var sourceNodes = [];
    var parts = [];

    // Most Atlas pages keep the whole Albaman story in one <p> separated by <br><br>.
    candidateParagraphs.some(function (p) {
      var split = splitByDoubleBreak(p);
      if (split.length >= 4) {
        sourceNodes = [p];
        parts = split;
        return true;
      }
      return false;
    });

    // Also support Atlas pages where the story is already split into separate <p> elements.
    if (!parts.length && candidateParagraphs.length >= 4) {
      sourceNodes = candidateParagraphs;
      parts = candidateParagraphs
        .map(function (p) { return String(p.innerHTML || '').trim(); })
        .filter(Boolean);
    }

    if (parts.length < 2 || !sourceNodes.length) return;

    var first = sourceNodes[0];
    var wrapper = buildCards(parts);
    first.parentNode.insertBefore(wrapper, first);
    sourceNodes.forEach(function (node) {
      if (node.parentNode) node.parentNode.removeChild(node);
    });

    root.setAttribute('data-atlas-story-root', 'true');
  }

  function enhanceAtlasStories() {
    if (!document.querySelector('model-viewer')) return;
    injectStyles();

    var roots = [];
    document.querySelectorAll('model-viewer').forEach(function (viewer) {
      var root = viewer.closest('.container') || viewer.parentElement;
      if (root && roots.indexOf(root) === -1) roots.push(root);
    });

    roots.forEach(enhanceRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAtlasStories, { once: true });
  } else {
    enhanceAtlasStories();
  }
})();
