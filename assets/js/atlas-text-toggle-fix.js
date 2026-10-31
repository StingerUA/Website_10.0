/**
 * AlbaSpace Atlas character pages: stable three-line story preview.
 * Works with explicit markup and CSS on all Neil Armstrong / Albamen pages.
 * The story only is collapsible; the hero, 3D and camera remain visible.
 */
(() => {
  'use strict';
  const i18n = {
    tr: { show: 'Metni göster', hide: 'Metni gizle' },
    en: { show: 'Show text', hide: 'Hide text' },
    ru: { show: 'Показать текст', hide: 'Скрыть текст' },
    ar: { show: 'إظهار النص', hide: 'إخفاء النص' }
  };

  function initialize() {
    const main = document.querySelector('main.neil-shell');
    const story = main?.querySelector(':scope > .neil-story[data-character-story]');
    const button = main?.querySelector('.atlas-character-story-toggle');
    if (!main || !story || !button || button.dataset.storyBound === 'true') return;

    // Clean up the old global text toggle if the browser cached it.
    const oldContent = main.querySelector('#textContent');
    if (oldContent && oldContent.contains(main.querySelector('.neil-lead'))) {
      oldContent.replaceWith(...Array.from(oldContent.childNodes));
    }
    main.querySelectorAll('#toggleBtn').forEach((node) => {
      if (node !== button) node.remove();
    });

    const language = (document.documentElement.lang || 'tr').slice(0, 2).toLowerCase();
    const strings = i18n[language] || i18n.tr;
    story.classList.remove('is-expanded');
    story.id = 'characterNarration';
    button.id = 'toggleBtn';
    button.setAttribute('aria-controls', story.id);
    button.dataset.storyBound = 'true';

    const setExpanded = (expanded) => {
      story.classList.toggle('is-expanded', expanded);
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? strings.hide : strings.show;
    };

    setExpanded(false);
    button.addEventListener('click', () => {
      setExpanded(!story.classList.contains('is-expanded'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
