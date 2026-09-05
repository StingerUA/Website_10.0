(function(){
  'use strict';

  const VERSION='20260905-textless-hero-v1';
  const HERO_FILES=[
    'sun-observation.svg',
    'moon-observation.svg',
    'vr-mission-iss.svg',
    'telescope-vr-1day.svg',
    'telescope-vr-2day.svg'
  ];

  function artIndex(el){
    const inline=el.style.getPropertyValue('--pass-art-y');
    const computed=getComputedStyle(el).getPropertyValue('--pass-art-y');
    const value=parseFloat(inline||computed||'0');
    if(!Number.isFinite(value))return 0;
    return Math.max(0,Math.min(4,Math.round(value/25)));
  }

  function mount(el){
    if(!el||el.dataset.passImgFix==='1')return;
    const file=HERO_FILES[artIndex(el)];
    if(!file)return;

    const img=document.createElement('img');
    img.className='pass-product-art-img';
    img.alt=el.getAttribute('aria-label')||'ALBA Space experience';
    img.decoding='async';
    img.loading='lazy';
    img.draggable=false;

    img.addEventListener('load',()=>{
      el.classList.add('pass-product-art-img-loaded');
      el.classList.remove('pass-product-art-img-error');
    });
    img.addEventListener('error',()=>{
      el.classList.add('pass-product-art-img-error');
    });

    el.dataset.passImgFix='1';
    el.classList.add('pass-product-art-img-ready');
    el.replaceChildren(img);
    img.src=`/assets/images/pass/hero/${file}?v=${VERSION}`;
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
