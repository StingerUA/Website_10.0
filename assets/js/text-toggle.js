/**
 * text-toggle.js
 * Legacy text disclosure for model-viewer pages.
 * Story-card pages are controlled by atlas-story-cards.js so the whole story can collapse together.
 */
(function () {
  'use strict';

  function extrasDisabled() {
    return document.body && document.body.dataset.disableModelExtras === 'true';
  }

  if (extrasDisabled()) return;

  const STRINGS = {
    tr: { show: 'Metni göster', hide: 'Metni gizle' },
    en: { show: 'Show text', hide: 'Show less' },
    ru: { show: 'Показать текст', hide: 'Скрыть' },
    ar: { show: 'إظهار النص', hide: 'إخفاء النص' }
  };

  function detectLanguage() {
    const pathname = (window.location && window.location.pathname) || '';
    if (pathname.startsWith('/eng/')) return 'en';
    if (pathname.startsWith('/rus/')) return 'ru';
    if (pathname.startsWith('/ar/')) return 'ar';
    return 'tr';
  }

  function ensureLegacyStyles() {
    if (document.getElementById('text-toggle-css')) return;
    const style = document.createElement('style');
    style.id = 'text-toggle-css';
    style.textContent = `
      #textContent{display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
      #textContent.expanded{display:block}
      .toggle-btn{display:block;margin:10px auto 30px;padding:12px 24px;background-color:rgb(29,73,105);color:#fff;border:1px solid #4192cc;border-radius:8px;font-size:16px;cursor:pointer;transition:all .3s ease;backdrop-filter:blur(4px);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .toggle-btn:hover{background-color:#0096ff;box-shadow:0 0 15px rgba(0,150,255,.6)}
      @media(max-width:480px){.toggle-btn{padding:10px 16px;font-size:14px}}
    `;
    document.head.appendChild(style);
  }

  function initTextToggle() {
    if (extrasDisabled() || !document.querySelector('model-viewer')) return;

    // New Albaman story cards own their disclosure control. Never wrap an inner card paragraph.
    const story = document.querySelector('.atlas-story-cards,[data-atlas-story-enhanced="true"]');
    if (story) {
      if (window.AlbaStoryCards && typeof window.AlbaStoryCards.refresh === 'function') {
        window.AlbaStoryCards.refresh();
      }
      return;
    }

    const lang = detectLanguage();
    const strings = STRINGS[lang] || STRINGS.tr;
    const mainP = document.querySelector('main p, .container p, p');
    if (!mainP) return;

    // atlas-story-cards.js uses this id as a sentinel against an older cached copy of this script.
    if (mainP.id === 'textContent' && mainP.classList.contains('atlas-story-paragraph')) return;
    if (document.getElementById('toggleBtn')) return;

    let wrapper = document.getElementById('textContent');
    if (!wrapper || wrapper === mainP) {
      wrapper = document.createElement('div');
      wrapper.id = 'textContent';
      mainP.parentNode.insertBefore(wrapper, mainP);
      wrapper.appendChild(mainP);
    }

    ensureLegacyStyles();

    const button = document.createElement('button');
    button.id = 'toggleBtn';
    button.className = 'toggle-btn';
    button.type = 'button';
    button.textContent = strings.show;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'textContent');
    wrapper.parentNode.insertBefore(button, wrapper.nextSibling);

    button.addEventListener('click', function () {
      const isExpanded = wrapper.classList.contains('expanded');
      wrapper.classList.toggle('expanded');
      button.setAttribute('aria-expanded', (!isExpanded).toString());
      button.textContent = isExpanded ? strings.show : strings.hide;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextToggle, { once: true });
  } else {
    initTextToggle();
  }

  // A story enhancer may be injected just after this legacy script. Give it a chance to take ownership.
  setTimeout(function () {
    if (window.AlbaStoryCards && typeof window.AlbaStoryCards.refresh === 'function') {
      window.AlbaStoryCards.refresh();
    }
  }, 500);
})();
