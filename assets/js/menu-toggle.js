/**
 * MENU TOGGLE - Mobile & Desktop Dropdown Handler
 * Optimized for performance and accessibility
 */

(function initDropdowns() {
  'use strict';

  const CONFIG = {
    desktop_breakpoint: 1024,
    debug: false
  };

  let initialized = false;
  let documentListenersInitialized = false;
  let resizeListenerInitialized = false;
  let lastWindowWidth = window.innerWidth;

  /**
   * Initialize dropdown menu handlers
   */
  function init() {
    if (initialized) return;

    const nav = document.querySelector('.main-nav');
    if (!nav) {
      requestAnimationFrame(init);
      return;
    }

    initialized = true;

    const dropdowns = nav.querySelectorAll('.dropdown');
    if (dropdowns.length === 0) {
      log('No dropdowns found');
      return;
    }

    // Setup each dropdown
    dropdowns.forEach(dropdown => {
      setupDropdown(dropdown);
    });

    // Setup event delegation
    setupDocumentListeners();
    setupWindowResize();
    
    // Ensure backdrop class is cleared on init
    updateBackdropClass();

    log(`✅ Initialized ${dropdowns.length} dropdowns`);
  }

  /**
   * Setup individual dropdown
   */
  function setupDropdown(dropdown) {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');

    if (!trigger || !menu) return;

    // Avoid binding duplicate listeners when dynamic headers re-initialize dropdowns.
    // Duplicate handlers toggle the same menu twice on a single tap, which makes
    // mobile dropdowns appear as if they do not open at all.
    if (trigger.dataset.dropdownToggleBound === 'true') return;
    trigger.dataset.dropdownToggleBound = 'true';

    // Click to toggle for both desktop and mobile
    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(dropdown, trigger, menu);
    });
  }

  /**
   * Toggle dropdown visibility
   */
  function toggleDropdown(dropdown, trigger, menu) {
    const isActive = dropdown.classList.contains('active');

    // Close other dropdowns - ensure they are fully disabled
    document.querySelectorAll('.dropdown.active').forEach(openDropdown => {
      if (openDropdown !== dropdown) {
        const closingMenu = openDropdown.querySelector('.dropdown-menu');
        openDropdown.classList.remove('active');
        const openTrigger = openDropdown.querySelector('.dropdown-trigger');
        if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
        
        // Explicitly disable pointer events on the closed menu
        if (closingMenu) {
          closingMenu.style.pointerEvents = 'none';
          // Also disable pointer events on all children to prevent hidden button clicks
          closingMenu.querySelectorAll('*').forEach(child => {
            child.style.pointerEvents = 'none';
          });
        }
      }
    });

    // Toggle current dropdown
    if (isActive) {
      dropdown.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
      
      // Disable pointer events on closed menu
      if (menu) {
        menu.style.pointerEvents = 'none';
        menu.querySelectorAll('*').forEach(child => {
          child.style.pointerEvents = 'none';
        });
      }
      // Only reveal the real nav row once no dropdown is left open
      if (!document.querySelector('.dropdown.active')) {
        setMobileNavRowHidden(false);
      }
      updateBackdropClass();
    } else {
      dropdown.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
      
      // Restore pointer events on opened menu
      if (menu) {
        menu.style.pointerEvents = 'auto';
        menu.querySelectorAll('*').forEach(child => {
          child.style.pointerEvents = 'auto';
        });
      }
      setMobileNavRowHidden(true);
      positionMobileMenu(menu);
      updateBackdropClass();
    }
  }

  /**
   * The floating mobile dropdown panel is positioned fixed, right below
   * the logo — which is exactly where the real .main-nav row (HİZMETLER
   * MAĞAZA BLOG ALBAMEN HAKKIMIZDA) also sits in normal flow. The panel's
   * background is only opaque behind each pill, so the real nav labels
   * bleed through in the gaps/margins around the pills. Hiding the real
   * nav row while any dropdown is open removes that bleed-through; it's
   * restored the moment every dropdown is closed.
   */
  function setMobileNavRowHidden(hidden) {
    if (window.innerWidth >= CONFIG.desktop_breakpoint) return;
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    if (hidden) {
      nav.style.setProperty('visibility', 'hidden', 'important');
      nav.style.setProperty('pointer-events', 'none', 'important');
    } else {
      nav.style.removeProperty('visibility');
      nav.style.removeProperty('pointer-events');
    }
  }

  /**
   * On mobile, force the dropdown to render as a horizontal row anchored
   * right below the ALBASPACE logo (above the nav row), via inline styles.
   * Inline styles always beat stylesheet rules, so this can't be pulled out
   * of position by any competing CSS block.
   */
  function positionMobileMenu(menu) {
    const items = menu.querySelectorAll('a, button');

    if (window.innerWidth >= CONFIG.desktop_breakpoint) {
      // Desktop: let the normal CSS (flyout under the trigger) handle it.
      ['position', 'top', 'left', 'right', 'width', 'max-width', 'display', 'flex-direction', 'flex-wrap', 'justify-content', 'gap', 'padding', 'background', 'border-radius', 'z-index']
        .forEach(prop => menu.style.removeProperty(prop));
      items.forEach(item => {
        ['width', 'max-width', 'flex', 'white-space', 'padding', 'font-size', 'height'].forEach(prop => item.style.removeProperty(prop));
      });
      return;
    }

    const logo = document.querySelector('.main-center-logo');
    const gap = 8;
    // Position BELOW the logo (not above)
    const top = logo ? Math.round(logo.getBoundingClientRect().bottom) + gap : 120;

    // setProperty(..., 'important') is required here: this codebase's
    // stylesheets are full of `!important` rules for .dropdown-menu, and a
    // plain inline style (element.style.x = ...) loses to any of them.
    // Only an inline !important reliably wins, regardless of which
    // stylesheet block happens to match on a given page/viewport.
    const set = (prop, value) => menu.style.setProperty(prop, value, 'important');
    set('position', 'fixed');
    set('top', top + 'px');
    set('left', '8px');
    set('right', '8px');
    set('width', 'auto');
    set('max-width', 'none');
    set('display', 'flex');
    set('flex-direction', 'row');
    set('flex-wrap', 'nowrap');
    set('justify-content', 'center');
    set('gap', '4px');
    set('padding', '4px');
    // Opaque background so nothing behind the panel (e.g. the real nav
    // row, which sits in this same spot) can show through the gaps
    // around/between the pills.
    set('background', '#0a1628');
    set('border-radius', '10px');
    set('z-index', '2147483647');

    // Four items per row (25% each), all in one horizontal line, compact sizing
    items.forEach(item => {
      const setItem = (prop, value) => item.style.setProperty(prop, value, 'important');
      setItem('flex', '0 0 calc(25% - 3px)');
      setItem('width', 'calc(25% - 3px)');
      setItem('max-width', 'calc(25% - 3px)');
      setItem('height', '40px');
      setItem('padding', '6px 4px');
      setItem('font-size', '11px');
      setItem('box-sizing', 'border-box');
      setItem('white-space', 'normal');
      setItem('display', 'flex');
      setItem('align-items', 'center');
      setItem('justify-content', 'center');
      setItem('text-align', 'center');
    });
  }

  /**
   * Update backdrop class on body based on active dropdowns
   */
  function updateBackdropClass() {
    const hasActiveDropdown = document.querySelectorAll('.dropdown.active').length > 0;
    if (hasActiveDropdown) {
      document.body.classList.add('has-active-dropdown');
    } else {
      document.body.classList.remove('has-active-dropdown');
    }
  }

  /**
   * Close dropdowns when clicking outside
   */
  function setupDocumentListeners() {
    if (documentListenersInitialized) return;
    documentListenersInitialized = true;

    document.addEventListener('click', e => {
      const nav = document.querySelector('.main-nav');
      if (nav && !nav.contains(e.target)) {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
          dropdown.classList.remove('active');
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        setMobileNavRowHidden(false);
        updateBackdropClass();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
          dropdown.classList.remove('active');
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        setMobileNavRowHidden(false);
        updateBackdropClass();
      }
    });
  }

  /**
   * Handle window resize
   */
  function setupWindowResize() {
    if (resizeListenerInitialized) return;
    resizeListenerInitialized = true;

    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      const wasDesktop = lastWindowWidth >= CONFIG.desktop_breakpoint;
      const isDesktop = currentWidth >= CONFIG.desktop_breakpoint;

      if (wasDesktop !== isDesktop) {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
          dropdown.classList.remove('active');
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        setMobileNavRowHidden(false);
        updateBackdropClass();

        lastWindowWidth = currentWidth;
        initialized = false;
        init();
      } else {
        // Same side of the breakpoint — just keep an already-open menu
        // anchored under the logo if the viewport size changed.
        const openMenu = document.querySelector('.dropdown.active .dropdown-menu');
        if (openMenu) positionMobileMenu(openMenu);
      }
    });
  }

  /**
   * Debug logging
   */
  function log(message) {
    if (CONFIG.debug) {
      console.log('[MenuToggle]', message);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    requestAnimationFrame(init);
  }

  // Export init function for dynamic header loading
  window.initDropdowns = function() {
    initialized = false; // reset so init() can run again after dynamic header load
    init();
  };
})();

