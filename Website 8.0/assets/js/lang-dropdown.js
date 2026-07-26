/**
 * Language Dropdown Menu
 * Handles toggle, close, and current language display
 */

(function() {
  // Get current language from URL path
  function getCurrentLanguage() {
    const path = window.location.pathname;
    if (path.startsWith('/eng/')) return 'en';
    if (path.startsWith('/rus/')) return 'ru';
    return 'tr'; // Default to Turkish for root paths
  }

  // Get flag image for a language
  function getFlagImage(lang) {
    const flags = {
      'tr': '/assets/icons/flag-tr.png',
      'en': '/assets/icons/flag-us.png',
      'ru': '/assets/icons/flag-rus.png'
    };
    return flags[lang] || flags['tr'];
  }

  // Toggle language dropdown menu
  window.toggleLangDropdown = function(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.target.closest('.lang-dropdown-toggle');
    if (!button) return;

    const wrapper = button.closest('.lang-dropdown-wrapper');
    if (!wrapper) return;

    const menu = wrapper.querySelector('.lang-dropdown-menu');
    if (!menu) return;

    const isHidden = menu.hasAttribute('hidden');

    // Close all other dropdowns first
    document.querySelectorAll('.lang-dropdown-menu').forEach(m => {
      m.setAttribute('hidden', '');
    });
    document.querySelectorAll('.lang-dropdown-toggle').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
    });

    // Toggle current menu
    if (isHidden) {
      menu.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
    } else {
      menu.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
    }
  };

  // Close language dropdown menu
  window.closeLangDropdown = function() {
    document.querySelectorAll('.lang-dropdown-menu').forEach(menu => {
      menu.setAttribute('hidden', '');
    });
    document.querySelectorAll('.lang-dropdown-toggle').forEach(button => {
      button.setAttribute('aria-expanded', 'false');
    });
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    // Don't close if clicking inside a language dropdown
    const wrapper = event.target.closest('.lang-dropdown-wrapper');
    if (wrapper) return;

    // Close all language dropdowns
    document.querySelectorAll('.lang-dropdown-menu').forEach(menu => {
      if (!menu.closest('.lang-dropdown-wrapper').contains(event.target)) {
        menu.setAttribute('hidden', '');
      }
    });

    document.querySelectorAll('.lang-dropdown-toggle').forEach(button => {
      if (!button.closest('.lang-dropdown-wrapper').contains(event.target)) {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Initialize current language flag on page load
  function initializeLangDropdown() {
    const currentLang = getCurrentLanguage();
    const currentFlag = document.getElementById('currentLangFlag');

    if (currentFlag) {
      currentFlag.src = getFlagImage(currentLang);
      currentFlag.alt = currentLang;
    }

    // Mark currently active language option
    document.querySelectorAll('.lang-option').forEach(option => {
      const optionLang = option.getAttribute('data-lang');
      if (optionLang === currentLang) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLangDropdown);
  } else {
    initializeLangDropdown();
  }

  // Watch for header changes (dynamic loading)
  const observer = new MutationObserver(function() {
    if (document.querySelector('.lang-dropdown-wrapper') && !window.langDropdownInitialized) {
      window.langDropdownInitialized = true;
      initializeLangDropdown();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Keyboard support - close dropdown with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      window.closeLangDropdown();
    }
  });
})();
