/**
 * Model Viewer Debug Script
 * Diagnostic tool to check what's happening with model-viewer loading
 */

(function() {
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
