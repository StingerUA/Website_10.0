/**
 * Model Viewer Debug Script
 * Diagnostic tool to check what's happening with model-viewer loading.
 *
 * Narration routing:
 * - Turkish paid /atlas/atlas-* pages use atlas-narrations-tr.js.
 * - Regular non-Atlas model pages use model-narrations-i18n.js (TR/EN/RU).
 * - MP3-synchronised demo pages gokturk-1, rasat, opportunity, sojourner and
 *   sputnik are deliberately left completely untouched.
 */

(function() {
  try {
    const path = (window.location.pathname || '').replace(/\/index\.html$/i, '/');
    const normalized = path.toLowerCase();
    const isPaidTurkishAtlasPage = /^\/atlas\/atlas-[^/]+\/$/i.test(path);
    const isExistingModelLanguage = !/^\/ar\//i.test(path);
    const isRegularNonAtlasPage = !/\/atlas\//i.test(path) && isExistingModelLanguage;
    const isMp3Demo = /^\/(?:eng\/|rus\/)?(?:gokturk-1|rasat|opportunity|sojourner|sputnik)\/$/i.test(path);

    let narrationSrc = '';
    if (isPaidTurkishAtlasPage) {
      narrationSrc = '/assets/js/atlas-narrations-tr.js?v=20260830-1';
    } else if (isRegularNonAtlasPage && !isMp3Demo) {
      narrationSrc = '/assets/js/model-narrations-i18n.js?v=20260830-1';
    }

    if (narrationSrc && !Array.from(document.scripts).some((s) => (s.src || '').includes(narrationSrc.split('?')[0]))) {
      const narrationScript = document.createElement('script');
      narrationScript.src = narrationSrc;
      narrationScript.async = false;
      narrationScript.dataset.albamenNarrationLoader = 'true';
      document.head.appendChild(narrationScript);
    }
  } catch (error) {
    console.warn('[Albamen Narration] Failed to initialize narration loader:', error);
  }

  console.log('[Model-Viewer Debug] Starting diagnostic...');
  
  // 1. Check if model-viewer element exists
  const viewers = document.querySelectorAll('model-viewer');
  console.log(`[Model-Viewer Debug] Found ${viewers.length} model-viewer elements`);
  
  viewers.forEach((viewer, idx) => {
    console.log(`[Model-Viewer Debug] Viewer ${idx}:`, {
      src: viewer.getAttribute('src'),
      width: viewer.offsetWidth,
      height: viewer.offsetHeight,
      visible: viewer.offsetWidth > 0 && viewer.offsetHeight > 0
    });
  });
  
  // 2. Check if model-viewer custom element is registered
  const isRegistered = window.customElements && window.customElements.get('model-viewer');
  console.log(`[Model-Viewer Debug] Custom element registered: ${!!isRegistered}`);
  
  // 3. Check for errors in window
  window.__modelViewerErrors = [];
  const originalError = console.error;
  console.error = function(...args) {
    window.__modelViewerErrors.push(args);
    originalError.apply(console, args);
  };
  
  // 4. Monitor model-viewer events
  viewers.forEach((viewer, idx) => {
    viewer.addEventListener('load', () => {
      console.log(`[Model-Viewer Debug] Viewer ${idx} LOADED successfully`);
    });
    
    viewer.addEventListener('error', (e) => {
      console.error(`[Model-Viewer Debug] Viewer ${idx} ERROR:`, e);
    });
    
    viewer.addEventListener('progress', (e) => {
      if (e.detail && e.detail.totalProgress) {
        const percent = Math.round(e.detail.totalProgress * 100);
        console.debug(`[Model-Viewer Debug] Viewer ${idx} progress: ${percent}%`);
      }
    });
  });
  
  // 5. Check include.js status
  console.log('[Model-Viewer Debug] Checking include.js...');
  if (typeof injectUnifiedAiWidget === 'function') {
    console.log('[Model-Viewer Debug] include.js functions available: YES');
  } else {
    console.log('[Model-Viewer Debug] include.js functions available: NO');
  }
  
  // 6. Check model-viewer script load status
  setTimeout(() => {
    console.log('[Model-Viewer Debug] Final status after 2 seconds:');
    viewers.forEach((viewer, idx) => {
      console.log(`  Viewer ${idx} innerHTML length: ${viewer.innerHTML.length}`);
    });
  }, 2000);
  
})();
