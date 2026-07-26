/**
 * MODERN DROPDOWN MENU CONTROLLER
 * Enhanced dropdown functionality with smooth animations and touch support
 * Compatible with modern-dropdown.css
 */

(function initModernDropdowns() {
  'use strict';

  // Wait for DOM and navigation to be ready
  let waitAttempts = 0;
  const maxWaitAttempts = 50; // ~5 seconds max wait

  function waitForNav() {
    const nav = document.querySelector('.main-nav');
    if (!nav) {
      if (waitAttempts++ < maxWaitAttempts) {
        // Use requestAnimationFrame for better performance, fallback to setTimeout
        if ('requestAnimationFrame' in window) {
          requestAnimationFrame(() => setTimeout(waitForNav, 100));
        } else {
          setTimeout(waitForNav, 100);
        }
      } else {
        console.warn('[modern-dropdown.js] Navigation not found after maximum wait attempts');
      }
      return;
    }
    initializeDropdowns(nav);
  }

  function initializeDropdowns(nav) {
    // Prevent multiple initializations
    if (nav.dataset.modernDropdownInit === '1') return;
    nav.dataset.modernDropdownInit = '1';

    const dropdowns = nav.querySelectorAll('.dropdown');
    let activeDropdown = null;
    let closeTimeout = null;

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const menu = dropdown.querySelector('.dropdown-menu');

      if (!trigger || !menu) return;

      // Enhanced click handler for mobile/tablet
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isMobile = window.innerWidth <= 1024;
        const isActive = dropdown.classList.contains('active');

        // Close other dropdowns
        if (activeDropdown && activeDropdown !== dropdown) {
          closeDropdown(activeDropdown);
        }

        if (isActive) {
          closeDropdown(dropdown);
          activeDropdown = null;
        } else {
          openDropdown(dropdown);
          activeDropdown = dropdown;

          // Auto-close on mobile after interaction
          if (isMobile) {
            setTimeout(() => {
              if (activeDropdown === dropdown) {
                closeDropdown(dropdown);
                activeDropdown = null;
              }
            }, 5000); // 5 seconds
          }
        }

        // Update ARIA attributes
        trigger.setAttribute('aria-expanded', !isActive);
      });

      // Enhanced hover handlers for desktop
      if (window.innerWidth > 1024) {
        dropdown.addEventListener('mouseenter', function() {
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
          }

          if (activeDropdown && activeDropdown !== dropdown) {
            closeDropdown(activeDropdown);
          }

          openDropdown(dropdown);
          activeDropdown = dropdown;
        });

        dropdown.addEventListener('mouseleave', function() {
          closeTimeout = setTimeout(() => {
            if (activeDropdown === dropdown) {
              closeDropdown(dropdown);
              activeDropdown = null;
            }
          }, 150); // Small delay for smooth UX
        });
      }

      // Touch support for mobile devices
      let touchStartY = 0;
      let touchStartX = 0;

      trigger.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      trigger.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        const deltaX = Math.abs(touchEndX - touchStartX);

        // Only trigger if it's a tap (not a scroll)
        if (deltaY < 10 && deltaX < 10) {
          // Simulate click
          trigger.click();
        }
      });
    });

    // Global click handler to close dropdowns
    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target)) {
        if (activeDropdown) {
          closeDropdown(activeDropdown);
          activeDropdown = null;
        }
      }
    });

    // Keyboard navigation support
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          closeDropdown(activeDropdown);
          activeDropdown = null;
        }
      }

      // Arrow key navigation within open dropdown
      if (activeDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const menu = activeDropdown.querySelector('.dropdown-menu');
        const items = Array.from(menu.querySelectorAll('a, button, [role="menuitem"]'));
        const focusedIndex = items.findIndex(item => item === document.activeElement);

        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0;
        } else {
          nextIndex = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1;
        }

        items[nextIndex].focus();
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Close all dropdowns on resize to prevent layout issues
        if (activeDropdown) {
          closeDropdown(activeDropdown);
          activeDropdown = null;
        }

        // Re-initialize hover handlers based on screen size
        const isDesktop = window.innerWidth > 1024;
        dropdowns.forEach((dropdown) => {
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
          }
        });
      }, 250);
    });

    // Focus management
    document.addEventListener('focusin', function(e) {
      const focusedElement = e.target;
      const dropdown = focusedElement.closest('.dropdown');

      if (dropdown && dropdown !== activeDropdown) {
        if (activeDropdown) {
          closeDropdown(activeDropdown);
        }
        openDropdown(dropdown);
        activeDropdown = dropdown;
      }
    });
  }

  function openDropdown(dropdown) {
    dropdown.classList.add('active');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');

    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    // Focus first menu item for accessibility
    setTimeout(() => {
      const firstItem = menu.querySelector('a, button, [role="menuitem"]');
      if (firstItem) {
        firstItem.focus();
      }
    }, 100);

    // Add visual feedback
    dropdown.style.transform = 'translateY(-2px)';
    setTimeout(() => {
      dropdown.style.transform = '';
    }, 150);
  }

  function closeDropdown(dropdown) {
    dropdown.classList.remove('active');
    const trigger = dropdown.querySelector('.dropdown-trigger');

    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }

    // Remove focus from menu items
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) {
      const focusedItem = menu.querySelector(':focus');
      if (focusedItem) {
        focusedItem.blur();
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForNav);
  } else {
    waitForNav();
  }

  // Re-initialize after dynamic content loads (for include.js)
  window.addEventListener('load', function() {
    setTimeout(waitForNav, 500);
  });

})();