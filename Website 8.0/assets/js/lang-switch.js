
(function(){
  window.setupLangSwitch = function() {
    const path = window.location.pathname || '/';
    // Get filename, handling both root files and subdirectories
    let fileName = path.split('/').pop();
    if (!fileName) fileName = 'index.html'; // Handle root path '/'
    
    // Safety check for empty filename (e.g. trailing slash)
    if (path.endsWith('/')) fileName = 'index.html';

    const container = document.querySelector('.top-lang-switch');
    if(!container) return;

    container.querySelectorAll('.lang-flag').forEach(a => {
      const lang = a.dataset.lang;
      if(!lang) return;
      
      let targetHref = '/index.html';
      
      if (lang === 'tr') {
        // Turkish is root
        targetHref = '/' + fileName;
      } else if (lang === 'en') {
        targetHref = '/eng/' + fileName;
      } else if (lang === 'ru') {
        targetHref = '/rus/' + fileName;
      }

      a.href = targetHref;
      
      // Active state
      const isEng = path.startsWith('/eng/');
      const isRus = path.startsWith('/rus/');
      const isTr = !isEng && !isRus;
      
      a.classList.toggle('active', (lang === 'en' && isEng) || (lang === 'ru' && isRus) || (lang === 'tr' && isTr));
    });
  };

  // Run on load
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupLangSwitch);
  } else {
    window.setupLangSwitch();
  }

  // Observer for dynamic changes (like header injection)
  const observer = new MutationObserver((mutations, obs) => {
    if(document.querySelector('.top-lang-switch')){
      window.setupLangSwitch();
      // Don't disconnect, as header might be re-injected or changed
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
