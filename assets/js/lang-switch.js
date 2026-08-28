(function () {
  window.setupLangSwitch = function () {
    const path = window.location.pathname || '/';
    let fileName = path.split('/').pop();
    if (!fileName || path.endsWith('/')) fileName = 'index.html';

    const container = document.querySelector('.top-lang-switch');
    if (!container) return;

    const isWhoIsInSpace = fileName === 'orbital-crew.html';

    container.querySelectorAll('[data-lang]').forEach(a => {
      const lang = a.dataset.lang;
      if (!lang) return;

      let targetHref;
      if (isWhoIsInSpace) {
        // Orbital Atlas keeps its legacy Russian page at the root while the
        // Turkish, English and Arabic versions live in language directories.
        if (lang === 'tr') targetHref = '/tr/orbital-crew.html';
        else if (lang === 'en') targetHref = '/eng/orbital-crew.html';
        else if (lang === 'ru') targetHref = '/orbital-crew.html';
        else if (lang === 'ar') targetHref = '/ar/orbital-crew.html';
        else return;
      } else if (lang === 'tr') {
        targetHref = '/' + fileName;
      } else if (lang === 'en') {
        targetHref = '/eng/' + fileName;
      } else if (lang === 'ru') {
        targetHref = '/rus/' + fileName;
      } else if (lang === 'ar') {
        targetHref = '/ar/' + fileName;
      } else {
        return;
      }
      a.href = targetHref;

      const isEng = path.startsWith('/eng/');
      const isRus = isWhoIsInSpace ? path === '/orbital-crew.html' : path.startsWith('/rus/');
      const isAr  = path.startsWith('/ar/');
      const isTr  = isWhoIsInSpace ? path.startsWith('/tr/') : (!isEng && !isRus && !isAr);
      a.classList.toggle('active',
        (lang === 'en' && isEng) ||
        (lang === 'ru' && isRus) ||
        (lang === 'ar' && isAr) ||
        (lang === 'tr' && isTr)
      );
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupLangSwitch);
  } else {
    window.setupLangSwitch();
  }

  var _observerActive = true;
  var observer = new MutationObserver(function () {
    if (!_observerActive) return;
    if (document.querySelector('.top-lang-switch')) {
      window.setupLangSwitch();
      _observerActive = false;
      observer.disconnect();
    }
  });

  if (!document.querySelector('.top-lang-switch')) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
