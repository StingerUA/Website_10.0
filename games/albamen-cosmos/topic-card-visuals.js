(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const VERSION='20260915-2';
const DATA_FILES=['data.001.b64','data.002.b64','data.003.1.b64','data.003.2.b64','data.003.3.b64','data.003.4.b64','data.003.5.b64','data.003.6.b64','data.003.7.b64','data.003.8.b64'];
const FOLDERS=['01-solar-system','02-planets','03-moon','04-stars','05-asteroids-comets','06-topic-06','07-topic-07','08-topic-08','09-topic-09','10-topic-10'];
let installed=false,DATA=null;
let categoryIds=[],categoryFolder=new Map(),labelToCid=new Map(),flashMap=new Map(),questionMap=new Map();
let assetCache=new Map(),lastCardLog='',lastQuizLog='';
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none';};
async function text(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return (await r.text()).trim();}
async function loadData(){const parts=await Promise.all(DATA_FILES.map(n=>text(BASE+n+'?v='+VERSION)));const b64=parts.join('').replace(/\s+/g,'');const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());}
function buildMaps(){const cats=DATA?.categories||{};const pref=cats.en||cats.tr||cats.ru||cats[Object.keys(cats)[0]]||{};categoryIds=Object.keys(pref).slice(0,10);categoryIds.forEach((cid,i)=>categoryFolder.set(cid,FOLDERS[i]||`topic-${i+1}`));for(const table of Object.values(cats))for(const [cid,label] of Object.entries(table||{})){const k=norm(label);if(k)labelToCid.set(k,cid);}for(const cid of categoryIds){const qids=Object.keys(DATA.qmeta||{}).filter(id=>DATA.qmeta[id]?.cid===cid).slice(0,10);const fids=Object.keys(DATA.fcmeta||{}).filter(id=>DATA.fcmeta[id]?.cid===cid).slice(0,10);for(const table of Object.values(DATA.translations||{})){qids.forEach((id,index)=>{const s=norm(table?.[id]?.question);if(s)questionMap.set(s,{cid,index});});fids.forEach((id,index)=>{const f=norm(table?.[id]?.front),b=norm(table?.[id]?.back);if(f)flashMap.set(f,{cid,index,side:'F'});if(b)flashMap.set(b,{cid,index,side:'B'});});}}console.info('[ALBAMEN Cosmos] topic image map ready',{categories:categoryIds.length,questions:questionMap.size,cards:flashMap.size});}
function cidFromText(v){const x=norm(v);let best='',len=0;for(const [label,cid] of labelToCid){if(label.length>len&&(x===label||x.includes(label))){best=cid;len=label.length;}}return best;}
function visibleCounterIndex(){for(const n of document.querySelectorAll('.section-title span,.q-count,[class*="count"]')){if(!visible(n))continue;const m=String(n.textContent||'').match(/\b(10|[1-9])\s*\/\s*10\b/);if(m)return Number(m[1])-1;}return -1;}
function isHintText(t){return /cevabı görmek için karta dokun|tap the card|нажмите[^.]{0,40}карточ|нажми[^.]{0,40}карточ/.test(norm(t));}
function getCard(){
  const direct=[document.getElementById('flash-card'),document.getElementById('flash'),...document.querySelectorAll('.flash-card')].filter(Boolean);
  for(const el of direct)if(visible(el))return el;
  let hint=null;
  for(const el of document.querySelectorAll('p,span,div,small')){if(visible(el)&&isHintText(el.textContent)){hint=el;break;}}
  if(!hint)return null;
  let p=hint.parentElement,best=null;
  for(let i=0;p&&i<6;i++,p=p.parentElement){
    const r=p.getBoundingClientRect();
    if(r.width>=220&&r.width<=700&&r.height>=160&&p.querySelector('h1,h2,h3')&&p.querySelector('.badge,[class*="badge"]')){best=p;break;}
  }
  return best;
}
function getCardMainText(host){for(const el of host?.querySelectorAll('h1,h2,h3,.answer-side,[class*="answer-side"]')||[]){if(!visible(el))continue;const t=norm(el.textContent);if(t&&t.length>2)return t;}return '';}
function currentCategoryCid(host){const candidates=[document.querySelector('.section-title')?.textContent,host?.querySelector('.badge,[class*="badge"]')?.textContent,host?.textContent];for(const x of candidates){const cid=cidFromText(x);if(cid)return cid;}return '';}
function isBack(host){return [...host.querySelectorAll('.answer-side,[class*="answer-side"],.explain,[class*="explain"]')].some(visible);}
function pathFor(entry,side){const folder=categoryFolder.get(entry.cid);if(!folder)return'';return `${BASE}assets/topic-images/${folder}/${String(entry.index+1).padStart(2,'0')} ${side}.webp`;}
async function resolveAsset(entry,side){const path=pathFor(entry,side);if(!path)return null;const key=path+'|'+VERSION;if(assetCache.has(key))return assetCache.get(key);const p=(async()=>{const r=await fetch(path+'?v='+VERSION,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}: ${path}`);return{url:URL.createObjectURL(await r.blob()),path};})().catch(e=>{console.warn('[ALBAMEN Cosmos] topic image load failed',e);return null;});assetCache.set(key,p);return p;}
function ensureStyle(){if(document.getElementById('cosmos-topic-visual-style'))return;const s=document.createElement('style');s.id='cosmos-topic-visual-style';s.textContent=`
.cosmos-card-host{height:auto!important;min-height:0!important;max-height:none!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important;transform:none!important;transform-style:flat!important;backface-visibility:visible!important;padding:14px 16px 22px!important}
.cosmos-card-host>.badge,.cosmos-card-host>[class*="badge"]{display:none!important}
.cosmos-card-host>.cosmos-topic-visual{order:1!important}
.cosmos-card-host>h1,.cosmos-card-host>h2,.cosmos-card-host>h3,.cosmos-card-host>.answer-side,.cosmos-card-host>[class*="answer-side"]{order:2!important;position:static!important;transform:none!important;rotate:none!important;scale:1!important;backface-visibility:visible!important;text-align:center!important;margin:10px 0 0!important;padding:0 8px!important}
.cosmos-card-host>.tiny,.cosmos-card-host>.explain,.cosmos-card-host>[class*="explain"]{order:3!important;position:static!important;transform:none!important;rotate:none!important;scale:1!important;backface-visibility:visible!important;text-align:center!important;margin:10px 0 0!important;padding:0 8px!important}
.cosmos-topic-visual,.cosmos-topic-visual *{transform:none!important;rotate:none!important;scale:1!important;backface-visibility:visible!important}
.card-actions{display:grid!important;grid-template-columns:repeat(3,1fr)!important;position:static!important;transform:none!important}
`;document.head.appendChild(s);}
function cleanup(keep=null){for(const v of document.querySelectorAll('.cosmos-topic-visual'))if(v!==keep)v.remove();for(const h of document.querySelectorAll('.cosmos-card-host'))if(!keep||h!==keep.parentElement)h.classList.remove('cosmos-card-host');}
function visual(host,kind){
  let v=host.querySelector(':scope > .cosmos-topic-visual');
  if(v){v.dataset.kind=kind;cleanup(v);return v;}
  cleanup();
  v=document.createElement('div');v.className='cosmos-topic-visual';v.dataset.kind=kind;
  v.style.cssText='display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;overflow:hidden!important;width:min(88%,340px)!important;aspect-ratio:1/1!important;flex:0 0 auto!important;margin:0 auto 18px!important;border:1px solid rgba(120,150,255,.45)!important;border-radius:16px!important;background:#0b1028!important;color:#8291c9!important;font:600 12px Montserrat,sans-serif!important;box-shadow:0 8px 22px rgba(0,0,0,.22)!important;pointer-events:none!important;z-index:2!important;';
  v.textContent='IMAGE';
  const anchor=[...host.querySelectorAll('h1,h2,h3,.answer-side,[class*="answer-side"]')].find(visible);
  if(anchor)anchor.insertAdjacentElement('beforebegin',v);else host.prepend(v);
  return v;
}
function paint(v,a){if(!v)return;if(!a){if(!v.querySelector('img'))v.textContent='IMAGE';return;}if(v.dataset.key===a.path&&v.querySelector('img'))return;v.dataset.key=a.path;v.replaceChildren();const img=document.createElement('img');img.alt='';img.draggable=false;img.src=a.url;img.style.cssText='display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;transform:none!important;rotate:none!important;scale:1!important;backface-visibility:visible!important;';img.onerror=()=>{v.replaceChildren();v.textContent='IMAGE';console.warn('[ALBAMEN Cosmos] image decode failed',a.path)};v.appendChild(img);}
async function card(host=getCard()){
  if(!host)return false;
  host.classList.add('cosmos-card-host');
  const v=visual(host,'card');
  if(!DATA){paint(v,null);return true;}
  const main=getCardMainText(host);let e=flashMap.get(main);const side=isBack(host)?'B':'F';
  if(!e){const cid=currentCategoryCid(host),i=visibleCounterIndex();if(cid&&i>=0)e={cid,index:i,side};}
  if(!e){paint(v,null);return true;}
  const a=await resolveAsset(e,side);paint(v,a);
  const log=`${e.cid}:${e.index}:${side}:${a?.path||'none'}`;if(log!==lastCardLog){lastCardLog=log;console.info('[ALBAMEN Cosmos] card image applied',{category:e.cid,index:e.index+1,side,path:a?.path||''});}
  return true;
}
async function quiz(){
  if(!DATA)return false;
  for(const el of document.querySelectorAll('.question,[class*="question"],h1,h2,h3')){
    if(!visible(el))continue;const e=questionMap.get(norm(el.textContent));if(!e)continue;
    const host=el.closest('section.panel')||el.closest('section')||el.parentElement;if(!host)return false;
    const v=visual(host,'quiz');const side=[...host.querySelectorAll('.feedback,[class*="feedback"]')].some(visible)?'B':'F';
    const a=await resolveAsset(e,side);paint(v,a);
    const log=`${e.cid}:${e.index}:${side}:${a?.path||'none'}`;if(log!==lastQuizLog){lastQuizLog=log;console.info('[ALBAMEN Cosmos] quiz image applied',{category:e.cid,index:e.index+1,side,path:a?.path||''});}
    return true;
  }
  return false;
}
function decorate(){
  const host=getCard();
  if(host){card(host).catch(e=>console.error('[ALBAMEN Cosmos] card image error',e));return;}
  cleanup();
  quiz().catch(e=>console.error('[ALBAMEN Cosmos] quiz image error',e));
}
function install(){if(installed)return;installed=true;ensureStyle();cleanup();window.__albamenTopicImagesVersion=VERSION;console.info('[ALBAMEN Cosmos] topic image renderer installed',VERSION);decorate();loadData().then(d=>{DATA=d;buildMaps();decorate();}).catch(e=>console.error('[ALBAMEN Cosmos] topic image data failed',e));const timer=setInterval(decorate,500);setTimeout(()=>clearInterval(timer),600000);document.addEventListener('click',()=>setTimeout(decorate,0),true);document.addEventListener('visibilitychange',decorate);}
window.AlbamenTopicCardVisuals={install,decorate,version:VERSION};
})();