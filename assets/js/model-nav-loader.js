// model-nav-loader.js
// Model navigation buttons remain disabled per user request.
// This loader starts the shared Albaman story-card presentation on educational model pages.
(function () {
  'use strict';

  function isExcludedModelPage(path) {
    return /\/(?:ar-restaurant|game|games|scanner)(?:\/|$)/.test(path) ||
      /\/(?:shop|cart|account|favorites|orders)(?:\.html|\/|$)/.test(path) ||
      /\/product-[^/]+(?:\.html|\/|$)/.test(path) ||
      /\/found-models\.html$/.test(path);
  }

  function loadAtlasStoryCards() {
    var path = String((window.location && window.location.pathname) || '').toLowerCase();
    if (isExcludedModelPage(path)) return;
    if (!document.querySelector('model-viewer')) return;

    var existing = Array.prototype.slice.call(document.scripts).find(function (script) {
      return String(script.src || '').indexOf('/assets/js/atlas-story-cards.js') !== -1;
    });

    if (existing) {
      if (window.AlbaStoryCards && typeof window.AlbaStoryCards.refresh === 'function') {
        window.AlbaStoryCards.refresh();
      }
      return;
    }

    var script = document.createElement('script');
    script.src = '/assets/js/atlas-story-cards.js?v=20260904-5';
    script.defer = true;
    script.setAttribute('data-atlas-story-cards', 'true');
    (document.head || document.documentElement).appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAtlasStoryCards, { once: true });
  } else {
    loadAtlasStoryCards();
  }
})();
