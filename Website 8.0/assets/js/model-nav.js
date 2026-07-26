(function(){
  // Insert neon prev/next buttons around H1 titles when a model-viewer is present
  function createBtn(side){
    var btn = document.createElement('button');
    btn.className = 'model-nav__btn ' + (side === 'prev' ? 'prev' : 'next');
    btn.setAttribute('aria-label', side === 'prev' ? 'Previous model' : 'Next model');
    btn.setAttribute('type','button');
    btn.innerHTML = side === 'prev' ? '&#x276E;' : '&#x276F;'; // chevrons
    // keyboard support
    btn.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    return btn;
  }

  // atlas data will be loaded dynamically from the generated file 
  var atlasTR = [];
  var atlasEN = [];
  import('/assets/data/atlas-pages.generated.js').then(function(mod){
    atlasTR = mod.atlasTR || [];
    atlasEN = mod.atlasEN || [];
  }).catch(function(){
    atlasTR = [];
    atlasEN = [];
  });

  function normalizePath(p){
    var path = String(p || location.pathname || '').split(/[?#]/)[0];
    if (!path.startsWith('/')) path = '/' + path;
    if (path.endsWith('/')) path = path + 'index.html';
    // if it's a folderless URL like '/index.html' leave it
    return path;
  }

  function findIndexInList(list, current){
    var i = list.indexOf(current);
    if (i !== -1) return i;
    // fallback: try to match by folder name
    var segs = current.split('/').filter(Boolean);
    var last = segs[segs.length-1] === 'index.html' && segs.length>1 ? segs[segs.length-2] : segs[segs.length-1];
    for (var j=0;j<list.length;j++){
      if (list[j].indexOf('/' + last + '/') !== -1 || list[j].endsWith('/' + last) || list[j].indexOf('/' + last + '/index.html') !== -1) return j;
    }
    return -1;
  }

  function navigate(direction){
    var lang = (location.pathname || '').startsWith('/eng/') ? 'en' : 'tr';
    var list = lang === 'en' ? atlasEN : atlasTR;
    if (!list || !list.length) return;
    var curr = normalizePath(location.pathname);
    var idx = findIndexInList(list, curr);
    if (idx === -1) {
      // not in the atlas list, nothing to do
      return;
    }
    var targetIdx = direction === 'prev' ? (idx - 1 + list.length) % list.length : (idx + 1) % list.length;
    var target = list[targetIdx];
    if (target) {
      // navigate to the target (relative to site root)
      window.location.assign(target);
    }
  }

  function wireButton(btn, side){
    btn.addEventListener('click', function(e){
      // Try to trigger existing gallery lightbox buttons if present
      var fallbackPrev = document.getElementById('lightboxPrev');
      var fallbackNext = document.getElementById('lightboxNext');
      if (side === 'prev'){
        if (fallbackPrev){ fallbackPrev.click(); return; }
        navigate('prev');
      } else {
        if (fallbackNext){ fallbackNext.click(); return; }
        navigate('next');
      }
    });
  }

  function init(){
    var titles = Array.from(document.querySelectorAll('h1'));
    titles.forEach(function(h1){
      // decide whether this H1 is a model title: check if there's a nearby model-viewer
      // search up to 6 DOM siblings/parents
      var hasModel = false;
      var el = h1;
      for (var i=0;i<6 && el;i++){
        if (el.querySelector && el.querySelector('model-viewer')) { hasModel = true; break; }
        el = el.nextElementSibling || el.parentElement;
      }
      if (!hasModel){
        // also check previous siblings
        el = h1.previousElementSibling;
        for (var j=0;j<6 && el;j++){
          if (el.querySelector && el.querySelector('model-viewer')) { hasModel = true; break; }
          el = el.previousElementSibling || el.parentElement;
        }
      }
      if (!hasModel) return;

      // Already wrapped?
      if (h1.parentElement && h1.parentElement.classList && h1.parentElement.classList.contains('model-title-wrap')) return;

      var wrap = document.createElement('div');
      wrap.className = 'model-title-wrap';

      var prev = createBtn('prev');
      var next = createBtn('next');
      prev.classList.add('pulse'); // subtle pulse to attract attention
      next.classList.add('pulse');

      wireButton(prev, 'prev');
      wireButton(next, 'next');

      // replace h1 with wrapper
      h1.parentNode.insertBefore(wrap, h1);
      wrap.appendChild(prev);
      wrap.appendChild(h1);
      wrap.appendChild(next);
    });

    // keyboard shortcuts when focus is inside the page
    document.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft'){
        navigate('prev');
      } else if (e.key === 'ArrowRight'){
        navigate('next');
      }
    });

    // allow other code to request navigation via custom events
    window.addEventListener('model-nav', function(e){
      var dir = e && e.detail && e.detail.direction;
      if (dir === 'prev' || dir === 'prev-key') navigate('prev');
      else if (dir === 'next' || dir === 'next-key') navigate('next');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
