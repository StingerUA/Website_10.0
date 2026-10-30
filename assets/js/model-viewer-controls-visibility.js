/**
 * Keep legacy model-viewer pages compatible without overriding the component's
 * native Shadow DOM buttons or falsely displaying AR on unsupported phones.
 * Android Scene Viewer priority is applied by android-ar-recovery.js.
 */
(() => {
  'use strict';
  const android = /Android/i.test(navigator.userAgent);
  const seen = new WeakSet();
  const enhance = (viewer) => {
    if (seen.has(viewer)) return;
    seen.add(viewer);
    if (viewer.hasAttribute('ar') && !viewer.hasAttribute('ar-modes')) {
      viewer.setAttribute('ar-modes', android
        ? 'scene-viewer webxr quick-look'
        : 'webxr scene-viewer quick-look');
    }
  };
  const scan = (root = document) => {
    if (root.nodeType === 1 && root.matches?.('model-viewer')) enhance(root);
    root.querySelectorAll?.('model-viewer').forEach(enhance);
  };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => scan(), {once:true});
  else scan();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes)
        if (node.nodeType === 1) scan(node);
    }
  }).observe(document.documentElement, {childList:true,subtree:true});
})();
