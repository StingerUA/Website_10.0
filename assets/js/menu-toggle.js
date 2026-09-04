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

  const HEADER_MENU_SPEC = {
    tr: {
      services: [
        { href: '/hizmetler.html', label: 'HİZMETLER' },
        { href: '/etkinlikler.html', label: 'Yaklaşan Etkinlikler' },
        { href: 'https://albaspace.com.tr/hyperclub', label: 'Hyper Club', external: true },
        { href: '/kubesat.html', label: 'KubeSat' }
      ],
      albamen: [
        { href: '/albamen.html', label: 'ALBAMEN' },
        { href: '/tr/orbital-atlas.html', label: 'YÖRÜNGE ATLASI' },
        { href: '/atlas.html', label: 'ATLAS' },
        { href: '/games/index.html', label: 'OYUNLAR' }
      ],
      about: [
        { href: '/hakkimizda.html', label: 'HAKKIMIZDA' },
        { href: '/basindabiz.html', label: 'BASINDA BİZ' },
        { href: '/galeri.html', label: 'GALERİ' },
        { href: '/iletisim.html', label: 'İLETİŞİM' }
      ]
    },
    en: {
      services: [
        { href: '/eng/hizmetler.html', label: 'SERVICES' },
        { href: '/eng/etkinlikler.html', label: 'Upcoming Events' },
        { href: 'https://albaspace.com.tr/hyperclub', label: 'Hyper Club', external: true },
        { href: '/eng/kupsat.html', label: 'KubeSat' }
      ],
      albamen: [
        { href: '/eng/albamen.html', label: 'ALBAMAN' },
        { href: '/eng/orbital-atlas.html', label: 'ORBITAL ATLAS' },
        { href: '/eng/atlas.html', label: 'ATLAS' },
        { href: '/eng/games.html', label: 'GAMES' }
      ],
      about: [
        { href: '/eng/hakkimizda.html', label: 'ABOUT US' },
        { href: '/eng/basindabiz.html', label: 'PRESS' },
        { href: '/eng/galeri.html', label: 'GALLERY' },
        { href: '/eng/iletisim.html', label: 'CONTACT' }
      ]
    },
    ru: {
      services: [
        { href: '/rus/hizmetler.html', label: 'УСЛУГИ' },
        { href: '/rus/etkinlikler.html', label: 'Предстоящие мероприятия' },
        { href: 'https://albaspace.com.tr/hyperclub', label: 'Hyper Club', external: true },
        { href: '/rus/kupsat.html', label: 'КубСат' }
      ],
      albamen: [
        { href: '/rus/albamen.html', label: 'АЛЬБАМЕН' },
        { href: '/orbital-atlas.html', label: 'ОРБИТАЛЬНЫЙ АТЛАС' },
        { href: '/rus/atlas.html', label: 'АТЛАС' },
        { href: '/rus/games.html', label: 'ИГРЫ' }
      ],
      about: [
        { href: '/rus/hakkimizda.html', label: 'О НАС' },
        { href: '/rus/basindabiz.html', label: 'ПРЕССА' },
        { href: '/rus/galeri.html', label: 'ГАЛЕРЕЯ' },
        { href: '/rus/iletisim.html', label: 'КОНТАКТЫ' }
      ]
    },
    ar: {
      services: [
        { href: '/ar/hizmetler.html', label: 'الخدمات' },
        { href: '/ar/etkinlikler.html', label: 'الفعاليات القادمة' },
        { href: 'https://albaspace.com.tr/ar/hyperclub', label: 'Hyper Club', external: true },
        { href: '/ar/kubesat.html', label: 'KubeSat' }
      ],
      albamen: [
        { href: '/ar/albamen.html', label: 'ALBAMEN' },
        { href: '/ar/orbital-atlas.html', label: 'ORBITAL ATLAS' },
        { href: '/ar/atlas.html', label: 'ATLAS' },
        { href: '/ar/games.html', label: 'الألعاب' }
      ],
      about: [
        { href: '/ar/hakkimizda.html', label: 'من نحن' },
        { href: '/ar/basindabiz.html', label: 'الصحافة' },
        { href: '/ar/galeri.html', label: 'المعرض' },
        { href: '/ar/iletisim.html', label: 'اتصل بنا' }
      ]
    }
  };

  function detectHeaderLocale() {
    const path = String(window.location.pathname || '').toLowerCase();
    if (path.startsWith('/eng/')) return 'en';
    if (path.startsWith('/rus/')) return 'ru';
    if (path.startsWith('/ar/')) return 'ar';
    return 'tr';
  }

  function renderMenuItems(menu, items) {
    if (!menu || !Array.isArray(items)) return;
    menu.replaceChildren(...items.map(item => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (item.external) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      return link;
    }));
  }

  /**
   * Keep all localized header fragments structurally identical to the
   * Turkish navigation. This runs for both normal and white/shop headers,
   * including dynamically included legacy fragments.
   */
  function syncHeaderMenus() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    const spec = HEADER_MENU_SPEC[detectHeaderLocale()] || HEADER_MENU_SPEC.tr;
    nav.querySelectorAll(':scope > .dropdown').forEach(dropdown => {
      const trigger = dropdown.querySelector(':scope > .dropdown-trigger');
      const menu = dropdown.querySelector(':scope > .dropdown-menu');
      if (!trigger || !menu) return;

      const href = String(trigger.getAttribute('href') || '').toLowerCase();
      if (href.includes('hizmetler.html')) renderMenuItems(menu, spec.services);
      else if (href.includes('albamen.html')) renderMenuItems(menu, spec.albamen);
      else if (href.includes('hakkimizda.html')) renderMenuItems(menu, spec.about);
    });
  }

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

    // Normalize the dropdown contents before listeners and mobile sizing are applied.
    syncHeaderMenus();
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
    const navTriggers = nav.querySelectorAll(':scope > a, :scope > .dropdown > .dropdown-trigger');
    if (hidden) {
      nav.style.setProperty('visibility', 'hidden', 'important');
      nav.style.setProperty('pointer-events', 'none', 'important');
      // Some legacy CSS rules force child visibility back to visible. Hide only
      // the trigger row so the active fixed dropdown panel remains visible.
      navTriggers.forEach(trigger => trigger.style.setProperty('visibility', 'hidden', 'important'));
    } else {
      nav.style.removeProperty('visibility');
      nav.style.removeProperty('pointer-events');
      navTriggers.forEach(trigger => trigger.style.removeProperty('visibility'));
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
      ['position', 'top', 'left', 'right', 'width', 'max-width', 'display', 'flex-direction', 'flex-wrap', 'justify-content', 'gap', 'padding', 'background', 'border', 'border-radius', 'transform', 'z-index']
        .forEach(prop => menu.style.removeProperty(prop));
      items.forEach(item => {
        ['width', 'max-width', 'flex', 'white-space', 'padding', 'font-size', 'height', 'line-height'].forEach(prop => item.style.removeProperty(prop));
      });
      return;
    }

    const logo = document.querySelector('.main-center-logo');
    const isBlackHeader = !!document.querySelector('.site-header--black');
    const gap = 8;
    const raise = 68; // all mobile headers: move down about 2 mm (96 dpi ≈ 7.6 px) — lands the
                       // panel in the empty gap between the logo and the
                       // real nav row instead of directly on top of it.
    const expandUp = 11; // 3 mm at the CSS 96 dpi reference (3 × 96 / 25.4 ≈ 11.3 px)
    const top = logo
      ? Math.round(logo.getBoundingClientRect().bottom) + gap - raise - expandUp
      : 60 - expandUp;

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
    set('transform', 'none');
    set('display', 'flex');
    set('flex-direction', 'row');
    set('flex-wrap', 'nowrap');
    set('justify-content', 'center');
    set('gap', '3px');
    // Add the same amount to the top padding that we subtract from top, so the
    // lower edge and the button row stay in place while the panel grows upward.
    set('padding', 'calc(3px + 3mm) 3px 3px');
    // Opaque background so nothing behind the panel (e.g. the real nav
    // row, which sits in this same spot) can show through the gaps
    // around/between the pills.
    set('background', isBlackHeader ? '#ffffff' : '#0a1628');
    if (isBlackHeader) {
      set('border', '1px solid rgba(0, 0, 0, 0.12)');
    }
    set('border-radius', '8px');
    set('z-index', '2147483647');

    // Four items per row (25% each), all in one horizontal line, extra compact
    items.forEach(item => {
      const setItem = (prop, value) => item.style.setProperty(prop, value, 'important');
      setItem('flex', '0 0 calc(25% - 3px)');
      setItem('width', 'calc(25% - 3px)');
      setItem('max-width', 'calc(25% - 3px)');
      setItem('height', '30px');
      setItem('padding', '2px 3px');
      setItem('font-size', '9px');
      setItem('line-height', '1.1');
      setItem('box-sizing', 'border-box');
      setItem('white-space', 'normal');
      setItem('display', 'flex');
      setItem('align-items', 'center');
      setItem('justify-content', 'center');
      setItem('text-align', 'center');
      if (isBlackHeader) {
        setItem('color', '#111827');
      }
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
