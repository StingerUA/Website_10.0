// model-nav-loader.js
// DISABLED: Navigation buttons have been removed per user request
// This lightweight loader ensures that the neon navigation buttons are injected
// on pages with 3D models. Because header/footer fragments are loaded via
// innerHTML (which doesn't execute embedded scripts), we need to programmatically
// inject the model-nav script after the DOM is ready. This loader checks
// for the presence of a <model-viewer> element and then appends
// /assets/js/model-nav.js to the document head exactly once.

/*
(() => {
  let loaded = false;
  function loadModelNav() {
    if (loaded) return;
    const hasViewer = !!document.querySelector('model-viewer');
    if (!hasViewer) return;
    // If the nav script is already present (via a data attribute), skip
    if (document.querySelector('script[data-model-nav]')) {
      loaded = true;
      return;
    }
    const script = document.createElement('script');
    script.src = '/assets/js/model-nav.js';
    script.defer = true;
    script.dataset.modelNav = 'true';
    document.head.appendChild(script);
    loaded = true;
  }

  // Run as soon as the DOM is interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModelNav);
  } else {
    loadModelNav();
  }
})();
*/
