(function(){
  'use strict';

  const VERSION='20260905-0855';
  const LANGS=new Set(['tr','ru']);

  function currentLang(){
    const raw=(document.documentElement.lang||'').toLowerCase();
    if(raw.startsWith('ru'))return 'ru';
    if(raw.startsWith('tr'))return 'tr';
    return '';
  }

  function artIndex(el){
    const inline=el.style.getPropertyValue('--pass-art-y');
    const computed=getComputedStyle(el).getPropertyValue('--pass-art-y');
    const value=parseFloat(inline||computed||'0');
    if(!Number.isFinite(value))return 0;
    return Math.max(0,Math.min(4,Math.round(value/25)));
  }

  function sourcesFor(lang){
    return [
      `/assets/images/pass-cards/${lang}-sprite.webp?v=${VERSION}`,
      `/assets/images/pass/${lang}/pass-cards.webp?v=${VERSION}`,
      `https://raw.githubusercontent.com/StingerUA/Website_10.0/main/assets/images/pass-cards/${lang}-sprite.webp?v=${VERSION}`
    ];
  }

  function mount(el){
    if(!el||el.dataset.passImgFix==='1')return;
    const lang=currentLang();
    if(!LANGS.has(lang))return;

    const index=artIndex(el);
    const sources=sourcesFor(lang);
    const img=document.createElement('img');
    let sourceIndex=0;

    img.className='pass-product-art-img';
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.decoding='async';
    img.loading='eager';
    img.draggable=false;

    img.addEventListener('load',()=>{
      el.classList.add('pass-product-art-img-loaded');
      el.classList.remove('pass-product-art-img-error');
    });

    img.addEventListener('error',()=>{
      sourceIndex+=1;
      if(sourceIndex<sources.length){
        img.src=sources[sourceIndex];
        return;
      }
      el.classList.add('pass-product-art-img-error');
    });

    el.dataset.passImgFix='1';
    el.classList.add('pass-product-art-img-ready',`pass-product-art-img-${index}`);
    el.replaceChildren(img);
    img.src=sources[0];
  }

  function scan(root){
    if(!root)return;
    if(root.nodeType===1&&root.matches?.('.pass-product-art'))mount(root);
    root.querySelectorAll?.('.pass-product-art').forEach(mount);
  }

  function init(){
    scan(document);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType===1)scan(node);
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
