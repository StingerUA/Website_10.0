(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const VERSION='20260922-2';
const DATA_FILES=['data.001.b64','data.002.b64','data.003.1.b64','data.003.2.b64','data.003.3.b64','data.003.4.b64','data.003.5.b64','data.003.6.b64','data.003.7.b64','data.003.8.b64'];
let installed=false,DATA=null,asteroidCid='',questionMap=new Map(),cardMap=new Map();
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
const isAsteroidText=v=>/asteroid|comet|asteroit|kuyruk|астеро|комет/.test(norm(v));
async function text(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status+': '+url);return (await r.text()).trim();}
async function loadData(){const parts=await Promise.all(DATA_FILES.map(n=>text(BASE+n+'?v='+VERSION)));const b64=parts.join('').replace(/\s+/g,'');const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());}
function buildMaps(){
  const cats=DATA?.categories||{};
  for(const table of Object.values(cats)){
    for(const [cid,label] of Object.entries(table||{})){if(isAsteroidText(label)){asteroidCid=cid;break;}}
    if(asteroidCid)break;
  }
  if(!asteroidCid){console.warn('[ALBAMEN Cosmos] asteroid category not found');return;}
  const qids=Object.keys(DATA.qmeta||{}).filter(id=>DATA.qmeta[id]?.cid===asteroidCid).slice(0,10);
  const fids=Object.keys(DATA.fcmeta||{}).filter(id=>DATA.fcmeta[id]?.cid===asteroidCid).slice(0,10);
  for(const table of Object.values(DATA.translations||{})){
    qids.forEach((id,index)=>{const q=norm(table?.[id]?.question);if(q)questionMap.set(q,index);});
    fids.forEach((id,index)=>{
      const front=norm(table?.[id]?.front),back=norm(table?.[id]?.back);
      if(front)cardMap.set(front,index);
      if(back)cardMap.set(back,index);
    });
  }
}
function file(index,side){return String(index+1).padStart(2,'0')+' '+side+'.png';}
function imgPath(index,side){return BASE+'assets/topic-images/05-asteroids-comets/'+encodeURIComponent(file(index,side))+'?v='+VERSION;}
function rawPath(index,side){return 'https://raw.githubusercontent.com/StingerUA/Website_10.0/main/games/albamen-cosmos/assets/topic-images/05-asteroids-comets/'+encodeURIComponent(file(index,side))+'?v='+VERSION;}
function ensureStyle(){
  if(document.getElementById('cosmos-topic-images-style'))return;
  const s=document.createElement('style');s.id='cosmos-topic-images-style';s.textContent=`
  .cosmos-topic-image{width:100%;aspect-ratio:1/1;border-radius:16px;overflow:hidden;background:#0b1028;border:1px solid rgba(120,150,255,.28);margin:0 0 14px;display:block}
  .cosmos-topic-image img{width:100%;height:100%;display:block;object-fit:cover;object-position:center}
  .flash-card .cosmos-topic-image{margin:10px 0 16px}
  `;document.head.appendChild(s);
}
function putImage(host,index,side,before){
  if(!host||index<0||index>9)return;
  const src=imgPath(index,side),fallback=rawPath(index,side);
  let box=host.querySelector(':scope > .cosmos-topic-image');
  if(!box){
    box=document.createElement('div');box.className='cosmos-topic-image';
    if(before&&before.parentNode===host)host.insertBefore(box,before);else host.prepend(box);
  }
  if(box.dataset.src===src&&box.querySelector('img'))return;
  box.dataset.src=src;box.replaceChildren();
  const img=document.createElement('img');img.alt='';img.draggable=false;
  let retried=false;
  img.onerror=()=>{if(!retried){retried=true;img.src=fallback;return;}box.remove();console.warn('[ALBAMEN Cosmos] image failed',src);};
  img.src=src;box.appendChild(img);
}
function cleanExcept(keep){
  document.querySelectorAll('.cosmos-topic-image').forEach(x=>{if(x!==keep)x.remove();});
}
function syncQuiz(){
  const q=[...document.querySelectorAll('.question')].find(visible);
  if(!q)return false;
  const panel=q.closest('section.panel')||q.closest('section')||q.parentElement;
  if(!panel)return false;
  const meta=panel.parentElement?.querySelector('.quiz-meta')||document.querySelector('.quiz-meta');
  const categoryText=(meta?.textContent||'')+' '+(panel.querySelector('.badge')?.textContent||'');
  let index=questionMap.get(norm(q.textContent));
  if(index===undefined&&isAsteroidText(categoryText)){
    const m=String(document.querySelector('.q-count')?.textContent||'').match(/(\d+)\s*\/\s*10/);
    if(m)index=Math.max(0,Math.min(9,Number(m[1])-1));
  }
  if(index===undefined||!isAsteroidText(categoryText)){panel.querySelector(':scope > .cosmos-topic-image')?.remove();return true;}
  const side=panel.querySelector('.feedback')?'B':'F';
  putImage(panel,index,side,q);
  return true;
}
function syncCards(){
  const card=[...document.querySelectorAll('#flash-card,.flash-card')].find(visible);
  if(!card)return false;
  const badge=card.querySelector('.badge');
  if(!isAsteroidText(badge?.textContent||'')){card.querySelector(':scope > .cosmos-topic-image')?.remove();return true;}
  const nodes=[...card.querySelectorAll('h1,h2,h3,.answer-side,.explain')];
  let index;
  for(const n of nodes){const hit=cardMap.get(norm(n.textContent));if(hit!==undefined){index=hit;break;}}
  if(index===undefined){
    const m=String(document.querySelector('.section-title span')?.textContent||'').match(/(\d+)\s*\/\s*10/);
    if(m)index=Math.max(0,Math.min(9,Number(m[1])-1));
  }
  if(index===undefined)return true;
  const side=card.querySelector('.answer-side')?'B':'F';
  putImage(card,index,side,badge?.nextSibling instanceof Element?badge.nextSibling:null);
  return true;
}
function sync(){
  try{
    if(syncQuiz())return;
    syncCards();
  }catch(e){console.error('[ALBAMEN Cosmos] topic image sync failed',e);}
}
function install(){
  if(installed)return;installed=true;ensureStyle();
  loadData().then(d=>{DATA=d;buildMaps();sync();}).catch(e=>console.error('[ALBAMEN Cosmos] image data failed',e));
  const root=document.getElementById('root')||document.body;
  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});};
  new MutationObserver(queue).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(sync,0),true);
  sync();
}
window.AlbamenTopicCardVisuals={install,decorate:sync,version:VERSION};
})();