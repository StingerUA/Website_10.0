(function () {
  // Bug fix: use [data-lang] selector (matches actual header HTML), not .lang-flag
  window.setupLangSwitch = function () {
    const path = window.location.pathname || '/';
    let fileName = path.split('/').pop();
    if (!fileName || path.endsWith('/')) fileName = 'index.html';

    const container = document.querySelector('.top-lang-switch');
    if (!container) return;

    container.querySelectorAll('[data-lang]').forEach(a => {
      const lang = a.dataset.lang;
      if (!lang) return;

      // Set correct href for each language
      let targetHref;
      if (lang === 'tr') {
        targetHref = '/' + fileName;
      } else if (lang === 'en') {
        targetHref = '/eng/' + fileName;
      } else if (lang === 'ru') {
        targetHref = '/rus/' + fileName;
      } else {
        return;
      }
      a.href = targetHref;

      // Active state
      const isEng = path.startsWith('/eng/');
      const isRus = path.startsWith('/rus/');
      const isTr  = !isEng && !isRus;
      a.classList.toggle('active',
        (lang === 'en' && isEng) ||
        (lang === 'ru' && isRus) ||
        (lang === 'tr' && isTr)
      );
    });
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupLangSwitch);
  } else {
    window.setupLangSwitch();
  }

  // Bug fix: observer disconnects once header is found — no need to watch forever
  var _observerActive = true;
  var observer = new MutationObserver(function () {
    if (!_observerActive) return;
    if (document.querySelector('.top-lang-switch')) {
      window.setupLangSwitch();
      // Stop observing — include.js also calls setupLangSwitch after header injection,
      // and the guard in that function prevents duplicate listener attachment.
      _observerActive = false;
      observer.disconnect();
    }
  });

  // Only start observer if header isn't already in the DOM
  if (!document.querySelector('.top-lang-switch')) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
