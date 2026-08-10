/**
 * model-viewer-fullscreen.js
 * Adds a small expand button on the model-viewer (mobile only, ≤768px).
 * Clicking it opens a fullscreen overlay with the same model-viewer.
 * A close (×) button dismisses the overlay.
 */
(function () {
  'use strict';

  var CSS = `
    /* ── Expand button ── */
    .mv-expand-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 20;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(0, 194, 255, 0.5);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      transition: background 0.18s, transform 0.15s;
      backdrop-filter: blur(4px);
      -webkit-tap-highlight-color: transparent;
      padding: 0;
    }
    .mv-expand-btn:active { transform: scale(0.92); background: rgba(0,194,255,0.25); }
    .mv-expand-btn svg { width: 18px; height: 18px; stroke: #fff; fill: none; stroke-width: 2; }

    /* Tight wrapper we create ourselves around just the model-viewer, so the
       expand button is always anchored to the model itself — not whatever
       bigger block (heading, description, audio player...) happens to be
       its parent on a given page. */
    .mv-btn-anchor {
      position: relative;
      display: block;
    }
    /* Hide the expand button while its model is inside the fullscreen overlay */
    .mv-fs-overlay .mv-expand-btn { display: none; }

    /* ── Fullscreen overlay (model-viewer is MOVED into this, not cloned) ── */
    .mv-fs-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #020617;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .mv-fs-overlay.open {
      display: flex;
    }
    .mv-fs-overlay model-viewer {
      width: 100vw !important;
      height: 100vh !important;
      display: block !important;
    }

    /* ── Close button ── */
    .mv-fs-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      color: #fff;
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100001;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.18s;
      padding: 0;
    }
    .mv-fs-close:active { background: rgba(255,255,255,0.28); }
  `;

  /* Inject CSS */
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // Bug fix: single shared Escape handler — prevents N listeners accumulating
  // when there are N model-viewer elements on the same page
  var _activeClose = null;
  if (!document.__mvFsEscHandler) {
    document.__mvFsEscHandler = true;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _activeClose) {
        _activeClose();
      }
    });
  }

  /* Wait until DOM + model-viewer elements are ready */
  function init() {
    var viewers = document.querySelectorAll('model-viewer');
    if (!viewers.length) return;

    viewers.forEach(function (mv) {
      if (mv.__mvFsWired) return; // avoid wiring the same viewer twice
      mv.__mvFsWired = true;
      wireViewer(mv);
    });
  }

  function wireViewer(mv) {
      /* IMPORTANT: a separate, independently-timed script (model-preloader.js)
         asynchronously wraps this <model-viewer> in its own ".viewer-wrapper"
         div (used for the loading-spinner overlay) shortly after page load.
         If we anchor the expand button to mv's ORIGINAL parent (e.g. the big
         page ".container" that also holds the heading, description, audio
         player, etc.) the button ends up positioned relative to that whole
         block — landing near the top of the page instead of over the model.
         And if we wait for the other script's wrapper before wiring, we're
         racing it, which previously made the button silently unresponsive.

         Fix: create OUR OWN tight wrapper around just the model-viewer,
         synchronously, right now — before anything else can touch it. This
         wrapper shrinks to exactly the model-viewer's own box (same trick
         model-preloader.js uses for its overlay), so the button is always
         anchored to the model itself. If model-preloader.js later wraps
         again, it'll just nest its wrapper inside ours — harmless, since
         both are plain non-sized "position:relative" boxes. */
      var anchor = document.createElement('div');
      anchor.className = 'mv-btn-anchor';
      mv.parentNode.insertBefore(anchor, mv);
      anchor.appendChild(mv);

      /* Create expand button — anchored to our tight wrapper, not the page */
      var btn = document.createElement('button');
      btn.className = 'mv-expand-btn';
      btn.setAttribute('aria-label', 'Tam ekran');
      btn.title = 'Tam ekran';
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
      anchor.appendChild(btn);

      /* Create overlay (initially empty — model-viewer is moved into it on open) */
      var overlay = document.createElement('div');
      overlay.className = 'mv-fs-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      /* Close button */
      var closeBtn = document.createElement('button');
      closeBtn.className = 'mv-fs-close';
      closeBtn.setAttribute('aria-label', 'Kapat');
      closeBtn.innerHTML = '&times;';
      overlay.appendChild(closeBtn);

      document.body.appendChild(overlay);

      /* Remember where mv originally lived so we can put it back */
      var placeholder = document.createComment('mv-fs-original-slot');
      var savedInlineWidth = mv.style.width;
      var savedInlineHeight = mv.style.height;

      /* Защита от «phantom tap» — блокируем клики первые 600мс после создания кнопки */
      var btnReady = false;
      setTimeout(function () { btnReady = true; }, 600);

      var isOpen = false;

      /* Open — move the REAL model-viewer (already loaded) into the overlay.
         We never clone or recreate the element, so there's no re-loading of
         the .glb and no empty/blank viewer — it's the exact same live
         WebGL canvas the user was already looking at, just resized. */
      function openOverlay() {
        if (isOpen) return;
        isOpen = true;
        mv.parentNode.insertBefore(placeholder, mv);
        overlay.appendChild(mv);
        overlay.classList.add('open');
        _activeClose = closeOverlay;
        document.body.style.overflow = 'hidden';
        /* trigger resize so model-viewer's internal renderer picks up the new size */
        setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
      }

      /* Close — move model-viewer back to its original spot in the page */
      function closeOverlay() {
        if (!isOpen) return;
        isOpen = false;
        mv.style.width = savedInlineWidth;
        mv.style.height = savedInlineHeight;
        placeholder.parentNode.insertBefore(mv, placeholder);
        placeholder.remove();
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        if (_activeClose === closeOverlay) _activeClose = null;
        setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
      }

      btn.addEventListener('click', function (e) {
        /* Блокируем: не от реального пользователя, или слишком рано */
        if (!e.isTrusted || !btnReady) return;
        openOverlay();
      });

      closeBtn.addEventListener('click', closeOverlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeOverlay();
      });
      // Escape is handled by the single shared listener above
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* Small delay so model-viewer custom element can register and phantom taps dissipate */
    setTimeout(init, 800);
  }
}());