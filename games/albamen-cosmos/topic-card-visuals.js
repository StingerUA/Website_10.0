(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const VERSION='20261008-1';
let installed=false,manifest=null,queued=false;

function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync();});
}
async function loadManifest(){
  const r=await fetch(BASE+'assets/topic-images/manifest.json?v='+VERSION,{cache:'no-cache'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const data=await r.json();
  if(!data.quiz||!data.cards)throw new Error('Invalid image manifest');
  return data;
}
function ensureStyle(){
  if(document.getElementById('cosmos-topic-images-style'))return;
  const style=document.createElement('style');
  style.id='cosmos-topic-images-style';
  style.textContent=`
    .cosmos-topic-image{width:100%;aspect-ratio:1/1;border-radius:16px;overflow:hidden;background:#0b1028;border:1px solid rgba(120,150,255,.28);margin:0 0 14px;display:block;flex:0 0 auto}
    .cosmos-topic-image[hidden]{display:none}
    .cosmos-topic-image img{width:100%!important;height:100%!important;display:block;object-fit:contain;object-position:center}
    .flash-face{justify-content:flex-start;padding-top:48px}
    .flash-face .cosmos-topic-image{margin:0 0 16px}
  `;
  document.head.appendChild(style);
}
function removeImage(host){host?.querySelector(':scope > .cosmos-topic-image')?.remove();}
function putImage(host,relativePath,itemId,before){
  if(!host||!relativePath){removeImage(host);return;}
  const path='assets/topic-images/'+relativePath.split('/').map(encodeURIComponent).join('/');
  const src=BASE+path+'?v='+VERSION;
  let box=host.querySelector(':scope > .cosmos-topic-image');
  if(!box){
    box=document.createElement('div');box.className='cosmos-topic-image';
    if(before&&before.parentNode===host)host.insertBefore(box,before);else host.prepend(box);
  }
  box.dataset.itemId=itemId;
  if(box.dataset.src===src&&box.querySelector('img'))return;
  box.dataset.src=src;box.hidden=false;
  const img=document.createElement('img');
  img.alt='';img.draggable=false;img.decoding='async';
  let retried=false;
  img.onerror=()=>{
    if(!retried){
      retried=true;
      img.src='https://raw.githubusercontent.com/StingerUA/Website_10.0/main/games/albamen-cosmos/'+path+'?v='+VERSION;
      return;
    }
    box.hidden=true;queue();
    console.warn('[ALBAMEN Cosmos] image failed',relativePath);
  };
  img.onload=queue;
  img.src=src;box.replaceChildren(img);
}
function naturalFaceHeight(face){
  const style=getComputedStyle(face);
  const pixels=value=>Number.parseFloat(value)||0;
  let height=pixels(style.paddingTop)+pixels(style.paddingBottom),children=0;
  for(const child of face.children){
    const s=getComputedStyle(child);
    if(s.position==='absolute'||s.position==='fixed'||s.display==='none')continue;
    height+=child.offsetHeight+pixels(s.marginTop)+pixels(s.marginBottom);
    children++;
  }
  return height+Math.max(0,children-1)*pixels(style.rowGap);
}
function syncQuiz(){
  document.querySelectorAll('.question-card[data-question-id]').forEach(panel=>{
    const id=panel.dataset.questionId;
    const entry=manifest.quiz[id];
    const side=panel.querySelector('.feedback')?'back':'front';
    putImage(panel,entry?.[side],id,panel.querySelector('.question-text'));
  });
}
function syncCards(){
  document.querySelectorAll('.flash-card[data-card-id]').forEach(card=>{
    const id=card.dataset.cardId,entry=manifest.cards[id];
    const front=card.querySelector('.flash-front'),back=card.querySelector('.flash-back');
    if(!front||!back)return;
    putImage(front,entry?.front,id,front.querySelector('h2'));
    putImage(back,entry?.back,id,back.querySelector('.flash-answer'));
    if(!entry){card.style.removeProperty('min-height');return;}
    const height=Math.ceil(Math.max(330,naturalFaceHeight(front),naturalFaceHeight(back)));
    const value=height+'px';
    if(card.style.minHeight!==value)card.style.minHeight=value;
  });
}
function sync(){
  if(!manifest)return;
  try{syncQuiz();syncCards();}
  catch(error){console.error('[ALBAMEN Cosmos] topic image sync failed',error);}
}
function install(){
  if(installed)return;
  installed=true;ensureStyle();
  loadManifest().then(data=>{manifest=data;queue();}).catch(error=>console.error('[ALBAMEN Cosmos] image manifest failed',error));
  const root=document.getElementById('root')||document.body;
  new MutationObserver(queue).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',queue,true);
  window.addEventListener('resize',queue,{passive:true});
  document.fonts?.ready.then(queue);
}
window.AlbamenTopicCardVisuals={install,decorate:sync,version:VERSION};
})();
