(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const VERSION='20260913-4';
const DATA_FILES=['data.001.b64','data.002.b64','data.003.1.b64','data.003.2.b64','data.003.3.b64','data.003.4.b64','data.003.5.b64','data.003.6.b64','data.003.7.b64','data.003.8.b64'];
const FOLDERS=['01-solar-system','02-planets','03-moon','04-stars','05-asteroids-comets','06-topic-06','07-topic-07','08-topic-08','09-topic-09','10-topic-10'];
let installed=false,DATA=null;
let categoryIds=[],categoryFolder=new Map(),labelToCid=new Map(),flashMap=new Map(),questionMap=new Map();
let flashTerms=[],questionTerms=[],assetCache=new Map(),lastCardLog='',lastQuizLog='';
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
async function text(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return (await r.text()).trim();}
async function loadData(){const parts=await Promise.all(DATA_FILES.map(n=>text(BASE+n+'?v='+VERSION)));const b64=parts.join('').replace(/\s+/g,'');const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());}
function buildMaps(){
  const cats=DATA?.categories||{};
  const pref=cats.en||cats.tr||cats.ru||cats[Object.keys(cats)[0]]||{};
  categoryIds=Object.keys(pref).slice(0,10);
  categoryIds.forEach((cid,i)=>categoryFolder.set(cid,FOLDERS[i]||`topic-${i+1}`));
  for(const table of Object.values(cats))for(const [cid,label] of Object.entries(table||{})){const k=norm(label);if(k)labelToCid.set(k,cid);}
  for(const cid of categoryIds){
    const qids=Object.keys(DATA.qmeta||{}).filter(id=>DATA.qmeta[id]?.cid===cid).slice(0,10);
    const fids=Object.keys(DATA.fcmeta||{}).filter(id=>DATA.fcmeta[id]?.cid===cid).slice(0,10);
    for(const table of Object.values(DATA.translations||{})){
      qids.forEach((id,index)=>{const s=norm(table?.[id]?.question);if(s){const e={cid,index};questionMap.set(s,e);questionTerms.push({text:s,...e});}});
      fids.forEach((id,index)=>{
        const f=norm(table?.[id]?.front),b=norm(table?.[id]?.back);
        if(f){const e={cid,index,side:'F'};flashMap.set(f,e);flashTerms.push({text:f,...e});}
        if(b){const e={cid,index,side:'B'};flashMap.set(b,e);flashTerms.push({text:b,...e});}
      });
    }
  }
  flashTerms.sort((a,b)=>b.text.length-a.text.length);
  questionTerms.sort((a,b)=>b.text.length-a.text.length);
  console.info('[ALBAMEN Cosmos] topic image map ready',{categories:categoryIds.length,questions:questionMap.size,cards:flashMap.size});
}
function cidFromText(v){const x=norm(v);let best='',bestLen=0;for(const [label,cid] of labelToCid){if(label.length>bestLen&&(x===label||x.includes(label))){best=cid;bestLen=label.length;}}return best;}
function visibleCounterIndex(context){
  for(const n of document.querySelectorAll('.section-title span,.q-count,[class*="count"]')){const m=String(n.textContent||'').match(/\b(10|[1-9])\s*\/\s*10\b/);if(m)return Number(m[1])-1;}
  const m=String(context?.parentElement?.textContent||context?.textContent||'').match(/\b(10|[1-9])\s*\/\s*10\b/);return m?Number(m[1])-1:-1;
}
function getCard(){return document.getElementById('flash-card')||document.getElementById('flash')||document.querySelector('section.flash-card,.flash-card');}
function findFlash(host){
  if(!host)return null;
  const nodes=[host,...host.querySelectorAll('h1,h2,h3,h4,p,div,span,strong')];
  for(const n of nodes){const t=norm(n.textContent);const e=flashMap.get(t);if(e)return e;}
  const all=norm(host.textContent);
  for(const term of flashTerms)if(term.text.length>=5&&all.includes(term.text))return term;
  return null;
}
function findQuestion(){
  const nodes=[...document.querySelectorAll('.question,[class*="question"],h1,h2,h3,h4,p')];
  for(const n of nodes){const t=norm(n.textContent);const e=questionMap.get(t);if(e)return{node:n,entry:e};}
  for(const n of nodes){const all=norm(n.textContent);for(const term of questionTerms)if(term.text.length>=8&&all===term.text)return{node:n,entry:term};}
  return null;
}
function pathFor(entry,side){const folder=categoryFolder.get(entry.cid);if(!folder)return'';return `${BASE}assets/topic-images/${folder}/${String(entry.index+1).padStart(2,'0')} ${side}.webp`;}
async function resolveAsset(entry,side){
  const path=pathFor(entry,side);if(!path)return null;
  const key=path+'|'+VERSION;if(assetCache.has(key))return assetCache.get(key);
  const p=(async()=>{const r=await fetch(path+'?v='+VERSION,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}: ${path}`);const blob=await r.blob();return{url:URL.createObjectURL(blob),path};})().catch(e=>{console.warn('[ALBAMEN Cosmos] topic image load failed',e);return null;});
  assetCache.set(key,p);return p;
}
function visual(host,kind){
  let v=host.querySelector(':scope > .cosmos-topic-visual');if(v)return v;
  v=document.createElement('div');v.className='cosmos-topic-visual';v.setAttribute('aria-hidden','true');
  v.style.cssText=`display:block;position:relative;overflow:hidden;width:min(${kind==='quiz'?'70%':'76%'},260px);aspect-ratio:1/1;flex:0 0 auto;margin:12px auto 14px;border-radius:14px;background:#0b1028;box-shadow:0 8px 22px rgba(0,0,0,.22);pointer-events:none;z-index:5;`;
  if(kind==='card'&&host.firstElementChild)host.firstElementChild.insertAdjacentElement('afterend',v);else host.prepend(v);
  return v;
}
function paint(v,a){if(!v||!a)return;const key=a.path;if(v.dataset.key===key)return;v.dataset.key=key;v.replaceChildren();const img=document.createElement('img');img.alt='';img.draggable=false;img.src=a.url;img.style.cssText='display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none;';img.onerror=()=>console.warn('[ALBAMEN Cosmos] image decode failed',a.path);v.appendChild(img);}
async function card(){
  const host=getCard();if(!host||!DATA)return;
  let e=findFlash(host);
  if(!e){const cid=cidFromText(host.textContent),i=visibleCounterIndex(host);if(cid&&i>=0)e={cid,index:i,side:host.querySelector('.answer-side,[class*="answer-side"],[class*="explain"]')?'B':'F'};}
  if(!e)return;
  host.style.setProperty('justify-content','flex-start','important');
  const a=await resolveAsset(e,e.side||'F');paint(visual(host,'card'),a);
  const log=`${e.cid}:${e.index}:${e.side||'F'}:${a?.path||'none'}`;if(log!==lastCardLog){lastCardLog=log;console.info('[ALBAMEN Cosmos] card image applied',{category:e.cid,index:e.index+1,side:e.side||'F',path:a?.path||''});}
}
async function quiz(){
  if(!DATA)return;const found=findQuestion();if(!found)return;
  const q=found.node,e=found.entry;const host=q.closest('section.panel')||q.closest('section')||q.parentElement;if(!host)return;
  const side=host.querySelector('.feedback,[class*="feedback"],[data-answer][disabled],button.answer[disabled]')?'B':'F';
  const a=await resolveAsset(e,side);paint(visual(host,'quiz'),a);
  const log=`${e.cid}:${e.index}:${side}:${a?.path||'none'}`;if(log!==lastQuizLog){lastQuizLog=log;console.info('[ALBAMEN Cosmos] quiz image applied',{category:e.cid,index:e.index+1,side,path:a?.path||''});}
}
function decorate(){card().catch(e=>console.error('[ALBAMEN Cosmos] card image error',e));quiz().catch(e=>console.error('[ALBAMEN Cosmos] quiz image error',e));}
function install(){if(installed)return;installed=true;window.__albamenTopicImagesVersion=VERSION;console.info('[ALBAMEN Cosmos] topic image renderer installed',VERSION);loadData().then(d=>{DATA=d;buildMaps();decorate();}).catch(e=>console.error('[ALBAMEN Cosmos] topic image data failed',e));const timer=setInterval(decorate,400);setTimeout(()=>clearInterval(timer),300000);document.addEventListener('click',()=>setTimeout(decorate,0),true);document.addEventListener('visibilitychange',decorate);}
window.AlbamenTopicCardVisuals={install,decorate,version:VERSION};
})();