/**
 * Model Viewer Error Handler
 * Attaches error handling to model-viewer elements
 * FIX: Removed infinite reload loop. Shows zaglushka.glb as fallback on 404.
 */
(function() {
  'use strict';

  const FALLBACK_MODEL = '/assets/models/zaglushka.glb';

  // Function to enhance a model-viewer element
  const enhanceViewer = (viewer) => {
    if (!viewer || viewer.__enhanced) return;
    viewer.__enhanced = true;
    let errorCount = 0;

    // Add error listener
    viewer.addEventListener('error', (event) => {
      errorCount++;
      const src = viewer.getAttribute('src');

      // FIX: Don't retry if it's already the fallback, or after 1 attempt
      if (errorCount > 1 || src === FALLBACK_MODEL) {
        console.warn('[model-viewer] Model failed to load, giving up:', src);
        viewer.dispatchEvent(new CustomEvent('model-load-failed', { bubbles: true }));
        return;
      }

      console.warn('[model-viewer] Model not found, loading fallback:', src, '→', FALLBACK_MODEL);
      // FIX: Load zaglushka instead of retrying the same broken URL
      viewer.setAttribute('src', FALLBACK_MODEL);
    }, false);

    // Add load listener
    viewer.addEventListener('load', (event) => {
      console.log('[model-viewer] Model loaded successfully');
      // Hide loading overlay if present
      const overlay = viewer.parentNode && viewer.parentNode.querySelector('.mv-loading-overlay');
      if (overlay) overlay.style.display = 'none';
    }, false);

    // Add progress listener
    viewer.addEventListener('progress', (event) => {
      if (event.detail && typeof event.detail.totalProgress === 'number') {
        const percent = Math.round(event.detail.totalProgress * 100);
        if (percent === 100) {
          console.log('[model-viewer] Loading complete: 100%');
        }
      }
    }, false);
  };

  // Enhance existing viewers
  const enhanceAllViewers = () => {
    const viewers = document.querySelectorAll('model-viewer');
    viewers.forEach(enhanceViewer);
  };

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAllViewers, { once: true });
  } else {
    setTimeout(enhanceAllViewers, 100);
  }

  // Also watch for dynamically added viewers
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.tagName === 'MODEL-VIEWER') {
              enhanceViewer(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('model-viewer').forEach(enhanceViewer);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  const loadFallbackModelViewer = (src) => {
    if (window.customElements && window.customElements.get('model-viewer')) return;
    if (document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.setAttribute('crossorigin', 'anonymous');
    script.onload = () => console.log('[model-viewer] Loaded fallback model-viewer script:', src);
    script.onerror = () => console.warn('[model-viewer] Failed to load fallback model-viewer script:', src);
    document.head.appendChild(script);
  };

  const tryModelViewerRecovery = () => {
    if (window.customElements && window.customElements.get('model-viewer')) return;
    loadFallbackModelViewer('/assets/js/model-viewer.min.js');
    setTimeout(() => {
      if (!window.customElements || !window.customElements.get('model-viewer')) {
        console.warn('[model-viewer] Recovery attempt did not register model-viewer');
      }
    }, 5000);
  };

  window.addEventListener('error', (event) => {
    const message = event && event.message ? String(event.message) : '';
    if (/Content Security Policy/i.test(message) && /eval/i.test(message)) {
      console.warn('[model-viewer] CSP eval block detected, attempting local fallback');
      tryModelViewerRecovery();
    }
  });

  setTimeout(() => {
    if (document.querySelector('model-viewer') && !(window.customElements && window.customElements.get('model-viewer'))) {
      console.warn('[model-viewer] model-viewer custom element not registered yet, trying local fallback');
      tryModelViewerRecovery();
    }
  }, 12000);

  window.__modelViewerEnhanced = true;
  console.log('[model-viewer] Error handler initialized');

})();
