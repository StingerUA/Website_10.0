(function(){
  'use strict';

  var raw=(document.documentElement.lang||'tr').toLowerCase();
  var lang=raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':'tr';
  if(lang==='tr')return;

  var target=lang==='ru'
    ?'/rus/etkinlikler/ham5a-sehirden-kacis-2026.html'
    :'/eng/etkinlikler/ham5a-sehirden-kacis-2026.html';

  function fix(){
    document.querySelectorAll('#events-grid .events-card').forEach(function(card){
      var img=card.querySelector('img');
      var src=img?String(img.getAttribute('src')||''):'';
      if(src.indexOf('ham5a-sehirden-kacis-2026')!==-1){
        card.setAttribute('href',target);
      }
    });
  }

  function init(){
    var grid=document.getElementById('events-grid');
    if(!grid)return;
    fix();
    new MutationObserver(fix).observe(grid,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
