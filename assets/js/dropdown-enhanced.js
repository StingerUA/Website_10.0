/**
 * Enhanced Dropdown Menu Handler
 * Fixes positioning and z-index issues on mobile and desktop
 * Date: April 12, 2026
 */

(function initEnhancedDropdowns() {
  // Wait for DOM to be ready
  const nav = document.querySelector('.main-nav');
  
  if (!nav) {
    setTimeout(initEnhancedDropdowns, 300);
    return;
  }
  
  // Prevent multiple initializations
  if (nav.dataset.enhancedDropdownInit === '1') return;
  nav.dataset.enhancedDropdownInit = '1';

  /**
   * Initialize dropdown visibility on hover (desktop)
   */
  function initDesktopDropdowns() {
    const dropdowns = nav.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!trigger || !menu) return;
      
      // Hover IN
      dropdown.addEventListener('mouseenter', function() {
        if (window.innerWidth > 1023) {
          menu.style.visibility = 'visible';
          menu.style.opacity = '1';
          menu.style.pointerEvents = 'auto';
        }
      });
      
      // Hover OUT
      dropdown.addEventListener('mouseleave', function() {
        if (window.innerWidth > 1023) {
          menu.style.visibility = 'hidden';
          menu.style.opacity = '0';
          menu.style.pointerEvents = 'none';
        }
      });
    });
  }

  /**
   * Initialize dropdown touch/click on mobile
   */
  function initMobileDropdowns() {
    const triggers = nav.querySelectorAll('.dropdown-trigger');
    
    triggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        if (window.innerWidth <= 1023) {
          e.preventDefault();
          e.stopPropagation();
          
          const dropdown = trigger.parentElement;
          const isActive = dropdown.classList.contains('active');
          
          // Close all other dropdowns
          triggers.forEach(otherTrigger => {
            const otherDropdown = otherTrigger.parentElement;
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove('active');
              otherTrigger.setAttribute('aria-expanded', 'false');
            }
          });
          
          // Toggle current dropdown
          if (isActive) {
            dropdown.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');
          } else {
            dropdown.classList.add('active');
            trigger.setAttribute('aria-expanded', 'true');
            
            // Position dropdown menu properly
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu) {
              positionMobileDropdown(dropdown, menu);
            }
          }
        }
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 1023) {
        if (!nav.contains(e.target)) {
          triggers.forEach(trigger => {
            trigger.parentElement.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');
          });
        }
      }
    });
  }

  /**
   * Position mobile dropdown menu
   */
  function positionMobileDropdown(dropdown, menu) {
    // Use fixed positioning to escape container constraints
    const rect = dropdown.getBoundingClientRect();
    
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 10) + 'px';
    menu.style.left = (rect.left) + 'px';
    menu.style.minWidth = rect.width + 'px';
    menu.style.zIndex = '99999';
    
    // Ensure menu doesn't go off-screen to the right
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth - 10) {
      menu.style.left = 'auto';
      menu.style.right = '10px';
    }
  }

  /**
   * Handle window resize
   */
  window.addEventListener('resize', function() {
    // Close mobile dropdowns on resize to desktop
    if (window.innerWidth > 1023) {
      const triggers = nav.querySelectorAll('.dropdown-trigger');
      triggers.forEach(trigger => {
        trigger.parentElement.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Initialize
  initDesktopDropdowns();
  initMobileDropdowns();
  
  console.log('✅ Enhanced Dropdown Handler initialized');
})();
