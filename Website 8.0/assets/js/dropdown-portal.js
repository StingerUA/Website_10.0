/**
 * DROPDOWN PORTAL - NUCLEAR SOLUTION
 * Date: April 12, 2026
 * 
 * PROBLEM: Dropdown menus are trapped inside containers with overflow:hidden
 * SOLUTION: Dynamically move dropdown-menu elements to body using portal pattern
 * This completely escapes all container constraints
 */

(function() {
  'use strict';

  // Wait for page to be ready
  function initDropdownPortal() {
    // Find all dropdowns
    const dropdowns = document.querySelectorAll('.dropdown');
    
    if (dropdowns.length === 0) return;

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!trigger || !menu) return;

      // Move menu to body (portal pattern)
      moveMenuToBody(dropdown, trigger, menu);
      
      // Handle click events
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu(dropdown, trigger, menu);
      });

      // Handle hover on desktop
      if (window.innerWidth > 1023) {
        dropdown.addEventListener('mouseenter', () => {
          showMenu(dropdown, trigger, menu);
        });

        dropdown.addEventListener('mouseleave', () => {
          hideMenu(dropdown, trigger, menu);
        });
      }

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('active')) {
          hideMenu(dropdown, trigger, menu);
        }
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
          hideMenu(dropdown, trigger, menu);
        }
      });
    });
  }

  function moveMenuToBody(dropdown, trigger, menu) {
    // Mark menu as portal so we know it's been moved
    menu.setAttribute('data-portal', 'true');
    
    // If not already in body, move it
    if (menu.parentElement !== document.body) {
      // Clone menu to body
      const clone = menu.cloneNode(true);
      clone.setAttribute('data-portal-clone', 'true');
      document.body.appendChild(clone);
      
      // Hide original menu
      menu.style.display = 'none';
      
      // Store reference to clone
      menu._portalClone = clone;
      
      // Update menu reference to point to clone
      updateMenuHandlers(dropdown, trigger, clone);
    }
  }

  function updateMenuHandlers(dropdown, trigger, menu) {
    // Position the menu relative to trigger
    function positionMenu() {
      const rect = trigger.getBoundingClientRect();
      
      menu.style.position = 'fixed';
      menu.style.top = (rect.bottom + 5) + 'px';
      menu.style.left = rect.left + 'px';
      menu.style.zIndex = '2147483647';
      menu.style.minWidth = '200px';
    }

    // Position on show
    const observer = new MutationObserver(() => {
      if (menu.classList.contains('active') || dropdown.classList.contains('active')) {
        positionMenu();
      }
    });

    observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });
    observer.observe(menu, { attributes: true, attributeFilter: ['class'] });

    // Initial position
    positionMenu();

    // Update on window resize
    window.addEventListener('resize', positionMenu);
  }

  function toggleMenu(dropdown, trigger, menu) {
    const portalClone = menu._portalClone;
    const targetMenu = portalClone || menu;

    if (dropdown.classList.contains('active')) {
      hideMenu(dropdown, trigger, menu);
    } else {
      showMenu(dropdown, trigger, menu);
    }
  }

  function showMenu(dropdown, trigger, menu) {
    const portalClone = menu._portalClone;
    const targetMenu = portalClone || menu;

    dropdown.classList.add('active');
    trigger.setAttribute('aria-expanded', 'true');
    
    targetMenu.classList.add('active', 'visible');
    targetMenu.style.visibility = 'visible';
    targetMenu.style.opacity = '1';
    targetMenu.style.pointerEvents = 'auto';
    targetMenu.style.display = 'flex';
    targetMenu.style.flexDirection = 'column';
  }

  function hideMenu(dropdown, trigger, menu) {
    const portalClone = menu._portalClone;
    const targetMenu = portalClone || menu;

    dropdown.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
    
    targetMenu.classList.remove('active', 'visible');
    targetMenu.style.visibility = 'hidden';
    targetMenu.style.opacity = '0';
    targetMenu.style.pointerEvents = 'none';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdownPortal);
  } else {
    initDropdownPortal();
  }

  // Re-initialize after page changes
  window.addEventListener('load', initDropdownPortal);
  
  // Support for dynamically added content
  const observer = new MutationObserver(() => {
    initDropdownPortal();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
})();
