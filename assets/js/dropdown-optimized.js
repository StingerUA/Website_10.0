/**
 * OPTIMIZED DROPDOWN HANDLER
 * Simple, fast, memory-efficient dropdown menu handler
 * No conflicting libraries, no position calculations, no forced layouts
 */

(function initDropdowns() {
  'use strict';

  // Configuration
  const CONFIG = {
    desktop_breakpoint: 1024,
    debug: false
  };

  let initialized = false;
  let lastWindowWidth = window.innerWidth;

  /**
   * Initialize dropdown menu handlers
   */
  function init() {
    if (initialized) return;
    initialized = true;

    const nav = document.querySelector('.main-nav');
    if (!nav) {
      // Retry if nav not found yet
      requestAnimationFrame(init);
      return;
    }

    const dropdowns = nav.querySelectorAll('.dropdown');
    if (dropdowns.length === 0) {
      log('No dropdowns found');
      return;
    }

    // Setup each dropdown
    dropdowns.forEach(dropdown => {
      setupDropdown(dropdown);
    });

    // Setup event delegation for closing
    setupDocumentListeners();
    setupWindowResize();

    log(`✅ Initialized ${dropdowns.length} dropdowns`);
  }

  /**
   * Setup individual dropdown
   */
  function setupDropdown(dropdown) {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');

    if (!trigger || !menu) return;

    const isDesktop = window.innerWidth >= CONFIG.desktop_breakpoint;

    if (isDesktop) {
      // Desktop: hover controlled by CSS, just prevent default
      trigger.addEventListener('click', e => e.preventDefault(), { once: false });
    } else {
      // Mobile: click to toggle
      trigger.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown(dropdown, trigger, menu);
      });
    }
  }

  /**
   * Toggle dropdown visibility on mobile
   */
  function toggleDropdown(dropdown, trigger, menu) {
    const isActive = dropdown.classList.contains('active');

    // Close all other dropdowns
    document.querySelectorAll('.dropdown.active').forEach(openDropdown => {
      if (openDropdown !== dropdown) {
        openDropdown.classList.remove('active');
        const openTrigger = openDropdown.querySelector('.dropdown-trigger');
        if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle current dropdown
    if (isActive) {
      dropdown.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      dropdown.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Close dropdowns when clicking outside
   */
  function setupDocumentListeners() {
    document.addEventListener('click', e => {
      // Only on mobile
      if (window.innerWidth < CONFIG.desktop_breakpoint) {
        const nav = document.querySelector('.main-nav');
        if (nav && !nav.contains(e.target)) {
          document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
            const trigger = dropdown.querySelector('.dropdown-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
          });
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
          dropdown.classList.remove('active');
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  /**
   * Handle window resize
   */
  function setupWindowResize() {
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      const wasDesktop = lastWindowWidth >= CONFIG.desktop_breakpoint;
      const isDesktop = currentWidth >= CONFIG.desktop_breakpoint;

      // If crossing desktop/mobile boundary, reset active dropdowns
      if (wasDesktop !== isDesktop) {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
          dropdown.classList.remove('active');
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });

        lastWindowWidth = currentWidth;
        initialized = false;
        init();
      }
    });
  }

  /**
   * Debug logging
   */
  function log(message) {
    if (CONFIG.debug) {
      console.log('[Dropdowns]', message);
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    requestAnimationFrame(init);
  }
})();
