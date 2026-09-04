// model-nav-loader.js
// Model navigation buttons remain disabled per user request.
// This loader now also starts the shared Atlas story-card presentation on Atlas model pages.
(function () {
  'use strict';

  function loadAtlasStoryCards() {
    var path = String((window.location && window.location.pathname) || '').toLowerCase();
    if (path.indexOf('/atlas/') === -1) return;
    if (!document.querySelector('model-viewer')) return;
    if (document.querySelector('script[data-atlas-story-cards]')) return;

    var script = document.createElement('script');
    script.src = '/assets/js/atlas-story-cards.js?v=20260904-1';
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
