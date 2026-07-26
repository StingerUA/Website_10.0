/**
 * Model Viewer Controls Visibility Manager
 * Ensures camera-controls and AR buttons are visible on all model-viewer instances
 * This is a fallback/enhancement for browsers that may not fully support CSS ::part() selectors
 */

(function() {
  'use strict';

  function ensureControlsVisible() {
    const viewers = document.querySelectorAll('model-viewer');
    
    viewers.forEach(viewer => {
      // Ensure basic attributes are present for controls to appear
      if (!viewer.hasAttribute('camera-controls')) {
        viewer.setAttribute('camera-controls', '');
      }
      
      if (!viewer.hasAttribute('ar')) {
        viewer.setAttribute('ar', '');
      }

      // Ensure proper AR modes are set
      if (!viewer.hasAttribute('ar-modes')) {
        viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      }

      // Set up event listener to ensure controls are visible when model loads
      viewer.addEventListener('model-visibility', function() {
        // Force display of controls by checking shadow DOM
        setTimeout(() => {
          try {
            const shadowRoot = viewer.shadowRoot;
            if (shadowRoot) {
              // Try to find and show control elements
              const controls = shadowRoot.querySelectorAll('[class*="controls"], [class*="button"], button');
              controls.forEach(control => {
                control.style.display = '';
                control.style.visibility = '';
                control.style.opacity = '';
              });
            }
          } catch (e) {
            console.debug('Could not access shadow DOM:', e);
          }
        }, 100);
      });

      // Also trigger on load event
      viewer.addEventListener('load', function() {
        console.log('[Model-Viewer] Controls should be visible on loaded model');
      });
    });
  }

  // Run immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureControlsVisible);
  } else {
    ensureControlsVisible();
  }

  // Also run after a small delay to catch dynamically added viewers
  setTimeout(ensureControlsVisible, 1000);

  // Watch for dynamically added model-viewer elements
  if (window.MutationObserver) {
    const observer = new MutationObserver(mutations => {
      let hasNewViewer = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.tagName === 'MODEL-VIEWER' || 
                (node.querySelectorAll && node.querySelectorAll('model-viewer').length > 0)) {
              hasNewViewer = true;
            }
          });
        }
      });
      if (hasNewViewer) {
        ensureControlsVisible();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
