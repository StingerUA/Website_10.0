/**
 * Character stories: reveal/collapse the entire narration on Albamen and
 * Neil Armstrong pages, without touching the model-viewer or camera tools.
 * Works alongside the site's legacy text-toggle.js.
 */
(() => {
  'use strict';
  if (!/(?:^|\/)atlas-(?:albamen|neil-armstrong)(?:\/|$)/i.test(location.pathname)) return;

  const labels = {
    tr: ['Metni göster', 'Metni gizle'],
    en: ['Show text', 'Hide text'],
    ru: ['Показать текст', 'Скрыть текст'],
    ar: ['عرض النص', 'إخفاء النص']
  };
  const lang = (document.documentElement.lang || 'tr').slice(0, 2).toLowerCase();
  const copy = labels[lang] || labels.tr;

  function init() {
    const main = document.querySelector('main.neil-shell');
    const story = main?.querySelector(':scope > section.neil-story');
    const model = main?.querySelector('section.neil-model-panel model-viewer');
    if (!main || !story || !model || story.dataset.characterToggleReady === '1') return;
    if (story.compareDocumentPosition(model) & Node.DOCUMENT_POSITION_PRECEDING) return;

    // Legacy text-toggle.js used to wrap the hero subtitle, not the narration.
    // Undo that unrelated clamp if it was already installed.
    const oldContainer = main.querySelector('#textContent');
    if (oldContainer?.contains(main.querySelector('.neil-lead'))) {
      oldContainer.replaceWith(...Array.from(oldContainer.childNodes));
    }

    // Remove old listeners by replacing the legacy button. The new button
    // becomes the one and only owner of the character story disclosure.
    const legacy = document.getElementById('toggleBtn');
    if (legacy && main.contains(legacy)) legacy.remove();
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'toggleBtn';
    button.className = 'toggle-btn atlas-character-story-toggle';
    button.setAttribute('aria-controls', 'characterNarration');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = copy[0];
    button.style.cssText = 'display:block;margin:20px auto 12px;padding:12px 24px;background:#164669;border:1px solid #4192cc;border-radius:10px;color:#fff;font:600 16px system-ui,sans-serif;cursor:pointer;';

    story.id = 'characterNarration';
    story.hidden = true;
    story.setAttribute('aria-hidden', 'true');
    story.dataset.characterToggleReady = '1';
    main.insertBefore(button, story);

    button.addEventListener('click', () => {
      const expand = story.hidden;
      story.hidden = !expand;
      story.setAttribute('aria-hidden', String(!expand));
      button.setAttribute('aria-expanded', String(expand));
      button.textContent = copy[expand ? 1 : 0];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else init();

  // Header and shared scripts are injected asynchronously on legacy pages.
  const observer = new MutationObserver(() => {
    if (document.querySelector('.neil-story[data-character-toggle-ready="1"]')) {
      observer.disconnect();
    } else init();
  });
  observer.observe(document.documentElement, {childList: true, subtree: true});
})();
