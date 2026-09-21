(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const VERSION='20260922-1';
const DATA_FILES=['data.001.b64','data.002.b64','data.003.1.b64','data.003.2.b64','data.003.3.b64','data.003.4.b64','data.003.5.b64','data.003.6.b64','data.003.7.b64','data.003.8.b64'];
const FOLDERS=['01-solar-system','02-planets','03-moon','04-stars','05-asteroids-comets','06-topic-06','07-topic-07','08-topic-08','09-topic-09','10-topic-10'];
let installed=false,DATA=null,timer=null;
let categoryIds=[],categoryFolder=new Map(),labelToCid=new Map(),questionMap=new Map(),cardIdsByCid=new Map(),cardTextMap=new Map(),cardTerms=[];
let manualSide='F',lastCardKey='';
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
async function getText(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return (await r.text()).trim();}
async function loadData(){const parts=await Promise.all(DATA_FILES.map(n=>getText(BASE+n+'?v='+VERSION)));const b64=parts.join('').replace(/\s+/g,'');const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());}
function lang(){const l=(document.documentElement.lang||'tr').toLowerCase();return l.startsWith('ru')?'ru':l.startsWith('en')?'en':'tr';}
function translations(){return DATA?.translations?.[lang()]||DATA?.translations?.tr||DATA?.translations?.en||DATA?.translations?.ru||{};}
function buildMaps(){
  const cats=DATA?.categories||{};
  const pref=cats.en||cats.tr||cats.ru||cats[Object.keys(cats)[0]]||{};
  categoryIds=Object.keys(pref).slice(0,10);
  categoryIds.forEach((cid,i)=>categoryFolder.set(cid,FOLDERS[i]||`topic-${i+1}`));
  labelToCid.clear();questionMap.clear();cardIdsByCid.clear();cardTextMap.clear();cardTerms=[];
  for(const table of Object.values(cats))for(const [cid,label] of Object.entries(table||{})){const k=norm(label);if(k)labelToCid.set(k,cid);}
  for(const cid of categoryIds){
    const fids=Object.keys(DATA.fcmeta||{}).filter(id=>DATA.fcmeta[id]?.cid===cid).slice(0,10);
    const qids=Object.keys(DATA.qmeta||{}).filter(id=>DATA.qmeta[id]?.cid===cid).slice(0,10);
    cardIdsByCid.set(cid,fids);
    for(const table of Object.values(DATA.translations||{})){
      qids.forEach((id,index)=>{const q=norm(table?.[id]?.question);if(q)questionMap.set(q,{cid,index});});
      fids.forEach((id,index)=>{
        const front=norm(table?.[id]?.front),back=norm(table?.[id]?.back),meta={cid,index,id};
        if(front){cardTextMap.set(front,meta);cardTerms.push({text:front,...meta});}
        if(back){cardTextMap.set(back,meta);cardTerms.push({text:back,...meta});}
      });
    }
  }
  cardTerms.sort((a,b)=>b.text.length-a.text.length);
  console.info('[ALBAMEN Cosmos] unified data ready',{categories:categoryIds.length,cards:[...cardIdsByCid.values()].reduce((n,x)=>n+x.length,0),cardTexts:cardTextMap.size});
}
function cidFromText(v){const x=norm(v);let best='',len=0;for(const [label,cid] of labelToCid){if(label.length>len&&(x===label||x.includes(label))){best=cid;len=label.length;}}return best;}
function counterIndex(card){
  for(const n of document.querySelectorAll('.section-title small,.section-title span,.q-count,[class*="count"]')){
    const m=txt(n).match(/\b(10|[1-9])\s*\/\s*10\b/);
    if(m)return Number(m[1])-1;
  }
  const scope=card?.parentElement||card;
  const m=txt(scope).match(/\b(10|[1-9])\s*\/\s*10\b/);
  return m?Number(m[1])-1:-1;
}
function originalCard(){
  const candidates=[document.getElementById('flash'),document.getElementById('flash-card'),...document.querySelectorAll('.flash-card')].filter(Boolean);
  return candidates.find(visible)||null;
}
function categoryCid(card){return cidFromText(document.querySelector('.section-title')?.textContent)||cidFromText(card?.textContent)||'';}
function currentRecord(card){
  if(!DATA)return null;
  const nodes=card?[...card.querySelectorAll('h1,h2,h3,h4,p,div,span,strong')]:[];
  let matched=null;
  for(const node of nodes){
    const e=cardTextMap.get(norm(node.textContent));
    if(e){matched=e;break;}
  }
  if(!matched&&card){
    const all=norm(card.textContent);
    for(const term of cardTerms){
      if(term.text.length>=5&&all.includes(term.text)){matched=term;break;}
    }
  }
  if(matched){
    const row=translations()?.[matched.id]||{};
    return{cid:matched.cid,index:matched.index,id:matched.id,front:String(row.front||''),back:String(row.back||''),explanation:String(row.explanation||'')};
  }
  const cid=categoryCid(card),index=counterIndex(card);
  if(!cid||index<0)return null;
  const id=cardIdsByCid.get(cid)?.[index];
  if(!id)return{cid,index,id:null,front:'',back:''};
  const row=translations()?.[id]||{};
  return{cid,index,id,front:String(row.front||''),back:String(row.back||''),explanation:String(row.explanation||'')};
}
function visibleTopicFolder(){
  const text=norm([
    document.querySelector('.section-title')?.textContent,
    document.querySelector('.badge')?.textContent,
    document.querySelector('.quiz-meta')?.textContent,
    document.querySelector('#card-filter option:checked')?.textContent
  ].filter(Boolean).join(' '));
  if(/asteroid|comet|asteroit|kuyruk|астеро|комет/.test(text))return'05-asteroids-comets';
  if(/solar system|güneş sistemi|солнечн/.test(text))return'01-solar-system';
  if(/planet|gezegen|планет/.test(text))return'02-planets';
  if(/(^|\\s)(moon|ay|луна|луны)(\\s|$)/.test(text))return'03-moon';
  if(/star|yıldız|звезд/.test(text))return'04-stars';
  return'';
}
function cardImageTarget(record,side){
  const card=originalCard();
  const forcedFolder=visibleTopicFolder();
  const visibleIndex=counterIndex(card);
  const folder=forcedFolder||(record?categoryFolder.get(record.cid):'');
  const index=visibleIndex>=0?visibleIndex:(record?.index??-1);
  if(!folder||index<0)return null;
  return{folder,index,side};
}
function folderFromText(v){
  const text=norm(v);
  if(/asteroid|comet|asteroit|kuyruk|астеро|комет/.test(text))return'05-asteroids-comets';
  if(/solar system|güneş sistemi|солнечн/.test(text))return'01-solar-system';
  if(/planet|gezegen|планет/.test(text))return'02-planets';
  if(/(^|\s)(moon|ay|луна|луны)(\s|$)/.test(text))return'03-moon';
  if(/star|yıldız|звезд/.test(text))return'04-stars';
  return'';
}
function quizVisibleFolder(q){
  const panel=q?.closest('section.panel')||q?.closest('section')||q?.parentElement;
  const candidates=[
    document.querySelector('.quiz-meta')?.textContent,
    panel?.querySelector('.badge')?.textContent,
    panel?.querySelector('[class*="meta"]')?.textContent,
    panel?.querySelector('[class*="category"]')?.textContent,
    ...Array.from(panel?.querySelectorAll('small')||[]).map(x=>x.textContent)
  ].filter(Boolean);
  for(const value of candidates){const folder=folderFromText(value);if(folder)return folder;}
  const questionFolder=folderFromText(q?.textContent||'');
  if(questionFolder)return questionFolder;
  const cid=cidFromText(candidates.join(' '));
  return cid?categoryFolder.get(cid)||'':'';
}
function quizImageTarget(entry,side,q){
  const folder=quizVisibleFolder(q)||categoryFolder.get(entry?.cid);
  const index=entry?.index??-1;
  if(!folder||index<0)return null;
  return{folder,index,side};
}
function targetFile(target){return target?(String(target.index+1).padStart(2,'0')+' '+target.side+'.png'):'';}
function targetPath(target){if(!target)return'';return BASE+'assets/topic-images/'+target.folder+'/'+encodeURIComponent(targetFile(target))+'?v='+VERSION;}
function targetRawPath(target){if(!target)return'';return 'https://raw.githubusercontent.com/StingerUA/Website_10.0/main/games/albamen-cosmos/assets/topic-images/'+target.folder+'/'+encodeURIComponent(targetFile(target))+'?v='+VERSION;}
function imageFile(record,side){return record?`${String(record.index+1).padStart(2,'0')} ${side}.png`:'';}
function imagePath(record,side){if(!record)return'';const folder=categoryFolder.get(record.cid);if(!folder)return'';const file=imageFile(record,side);return `${BASE}assets/topic-images/${folder}/${encodeURIComponent(file)}?v=${VERSION}`;}
function rawImagePath(record,side){if(!record)return'';const folder=categoryFolder.get(record.cid);if(!folder)return'';const file=imageFile(record,side);return `https://raw.githubusercontent.com/StingerUA/Website_10.0/main/games/albamen-cosmos/assets/topic-images/${folder}/${encodeURIComponent(file)}?v=${VERSION}`;}
function dispatchClick(el){if(!el)return false;try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return true}catch{try{el.click();return true}catch{return false}}}
function exactStatusButton(status){return document.querySelector(`.card-actions [data-status="${status}"]`)||document.querySelector(`[data-status="${status}"]`)}
function exactNavButton(dir){return document.getElementById(dir==='prev'?'prev-card':'next-card')}
function exactFlipCard(){return document.getElementById('flash')||document.getElementById('flash-card')||document.querySelector('.flash-card')}
function ensureStyle(){document.getElementById('cosmos-topic-visual-style')?.remove();document.getElementById('cosmos-unified-style')?.remove();const s=document.createElement('style');s.id='cosmos-unified-style';s.textContent=`
html.cosmos-unified-mode #flash,html.cosmos-unified-mode #flash-card,html.cosmos-unified-mode .flash-wrap>.flash-card,html.cosmos-unified-mode .card-actions,html.cosmos-unified-mode .pager,html.cosmos-unified-mode #prev-card,html.cosmos-unified-mode #next-card{display:none!important}
.cosmos-unified-card{box-sizing:border-box;width:100%;max-width:100%;display:flex;flex-direction:column;gap:14px;padding:16px;margin:0;border:1px solid rgba(50,215,255,.22);border-radius:22px;background:linear-gradient(180deg,rgba(18,28,68,.98),rgba(15,23,58,.98));box-shadow:0 0 24px rgba(0,205,255,.10);position:relative!important;inset:auto!important;overflow:hidden;transform:none!important}
.cosmos-unified-card *{box-sizing:border-box;transform:none!important;backface-visibility:visible!important}
.cosmos-unified-image{width:100%;aspect-ratio:1/1;border-radius:16px;overflow:hidden;background:#0b1028;border:1px solid rgba(120,150,255,.28);display:grid;place-items:center;color:#8393c9;font:700 12px Montserrat,sans-serif;position:relative!important;inset:auto!important;cursor:pointer}
.cosmos-unified-image img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
.cosmos-unified-copy{text-align:center;padding:2px 8px 0;cursor:pointer}
.cosmos-unified-title{margin:0;color:#f4f6ff;font:800 clamp(20px,5vw,28px)/1.18 Montserrat,sans-serif}
.cosmos-unified-sub{margin:10px 0 0;color:#7f8eb8;font:500 12px/1.45 Montserrat,sans-serif;min-height:17px}
.cosmos-unified-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.cosmos-unified-actions button,.cosmos-unified-nav button{min-width:0;border:1px solid rgba(110,140,230,.28);border-radius:13px;background:#18244f;color:#f4f6ff;font:700 11px/1.2 Montserrat,sans-serif;padding:12px 6px;cursor:pointer;position:static!important;transition:.16s ease}
.cosmos-unified-actions button[data-status="learned"].active{border-color:#22c55e!important;background:rgba(34,197,94,.20)!important;box-shadow:0 0 0 1px rgba(34,197,94,.22) inset}
.cosmos-unified-actions button[data-status="review"].active{border-color:#fbbf24!important;background:rgba(251,191,36,.16)!important;box-shadow:0 0 0 1px rgba(251,191,36,.20) inset}
.cosmos-unified-actions button[data-status="hard"].active{border-color:#fb7185!important;background:rgba(251,113,133,.16)!important;box-shadow:0 0 0 1px rgba(251,113,133,.20) inset}
.cosmos-unified-nav{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cosmos-unified-nav button{font-size:18px;padding:13px}
@media(max-width:520px){.cosmos-unified-card{padding:14px;border-radius:20px;gap:12px}.cosmos-unified-image{border-radius:14px}.cosmos-unified-actions button{font-size:10px;padding:11px 4px}}
`;document.head.appendChild(s);}
function setUnifiedMode(on){document.documentElement.classList.toggle('cosmos-unified-mode',!!on)}
function fallbackLabels(){const l=lang();return l==='ru'?['✅ Выучено','🔄 Повторить','😊 Сложно']:l==='en'?['✅ Learned','🔄 Review','😊 Hard']:['✅ Öğrendim','🔄 Tekrar Et','😊 Zor'];}
function toggleCard(){manualSide=manualSide==='F'?'B':'F';dispatchClick(exactFlipCard());setTimeout(sync,0);}
function ensureUnified(card){const parent=card?.parentElement;if(!parent)return null;let ui=parent.querySelector(':scope > .cosmos-unified-card');if(!ui){document.querySelectorAll('.cosmos-unified-card').forEach(x=>x.remove());ui=document.createElement('article');ui.className='cosmos-unified-card';ui.innerHTML='<div class="cosmos-unified-image">IMAGE</div><div class="cosmos-unified-copy"><h2 class="cosmos-unified-title"></h2><p class="cosmos-unified-sub"></p></div><div class="cosmos-unified-actions"></div><div class="cosmos-unified-nav"></div>';parent.insertBefore(ui,card);ui.querySelector('.cosmos-unified-image').addEventListener('click',toggleCard);ui.querySelector('.cosmos-unified-copy').addEventListener('click',toggleCard);}return ui;}
function syncImage(ui,record){
  const box=ui.querySelector('.cosmos-unified-image');
  const target=cardImageTarget(record,manualSide);
  const path=targetPath(target),fallback=targetRawPath(target);
  if(!path){box.dataset.src='none';box.replaceChildren();box.textContent='IMAGE';console.warn('[ALBAMEN Cosmos] no image target',{record,topic:visibleTopicFolder(),counter:counterIndex(originalCard())});return;}
  if(box.dataset.src===path&&box.querySelector('img'))return;
  box.dataset.src=path;box.replaceChildren();
  const img=document.createElement('img');img.alt='';img.draggable=false;
  let triedFallback=false;
  img.onerror=()=>{if(!triedFallback&&fallback){triedFallback=true;console.warn('[ALBAMEN Cosmos] same-origin image failed, trying GitHub raw',path);img.src=fallback;return;}box.replaceChildren();box.textContent='IMAGE';console.warn('[ALBAMEN Cosmos] image failed',path,fallback,target);};
  img.src=path;box.appendChild(img);
  console.info('[ALBAMEN Cosmos] card image target',target,path);
}
function syncCopy(ui,record,card){let title='',sub='';if(record){title=manualSide==='B'?(record.back||record.front):(record.front||'');sub=manualSide==='B'?(record.explanation||''):(lang()==='ru'?'Нажмите на карточку, чтобы увидеть ответ':lang()==='en'?'Tap the card to see the answer':'Cevabı görmek için karta dokun');}if(!title){if(manualSide==='B'){const box=card?.querySelector('.flash-back,.answer-side,[class*="answer-side"]');title=txt(box?.querySelector('.flash-answer,h1,h2,h3,strong')||box);sub=sub||txt(box?.querySelector('.flash-explain,.explain,[class*="explain"]'));}else{const front=card?.querySelector('.flash-front')||card;title=txt(front?.querySelector('h1,h2,h3'));}}ui.querySelector('.cosmos-unified-title').textContent=title;ui.querySelector('.cosmos-unified-sub').textContent=sub;ui.classList.toggle('cosmos-back',manualSide==='B');}
function triggerRating(status){const b=exactStatusButton(status);if(!b){console.warn('[ALBAMEN Cosmos] rating button not found',status);return;}manualSide='F';dispatchClick(b);setTimeout(sync,0);setTimeout(sync,60);}
function triggerNav(dir){const b=exactNavButton(dir);if(!b){console.warn('[ALBAMEN Cosmos] nav button not found',dir);return;}manualSide='F';lastCardKey='';dispatchClick(b);setTimeout(sync,0);setTimeout(sync,60);}
function nativeStatusIsActive(status){const b=exactStatusButton(status);if(!b)return false;return b.classList.contains('active')||/border-color\s*:/i.test(b.getAttribute('style')||'')||b.getAttribute('aria-pressed')==='true';}
function syncControls(ui){const actions=ui.querySelector('.cosmos-unified-actions');const nav=ui.querySelector('.cosmos-unified-nav');const labels=fallbackLabels(),states=['learned','review','hard'];if(actions.dataset.ready!=='1'){actions.dataset.ready='1';labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.dataset.status=states[i];b.textContent=label;b.onclick=e=>{e.stopPropagation();triggerRating(states[i])};actions.appendChild(b);});}states.forEach(status=>actions.querySelector(`[data-status="${status}"]`)?.classList.toggle('active',nativeStatusIsActive(status)));if(nav.dataset.ready!=='1'){nav.dataset.ready='1';[['←','prev'],['→','next']].forEach(([label,dir])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=e=>{e.stopPropagation();triggerNav(dir)};nav.appendChild(b);});}}
function syncCard(){const card=originalCard();if(!card){setUnifiedMode(false);document.querySelectorAll('.cosmos-unified-card').forEach(x=>x.remove());return false;}setUnifiedMode(true);const record=currentRecord(card);const key=record?`${record.cid}:${record.index}`:'';if(key&&key!==lastCardKey){lastCardKey=key;manualSide='F';}const ui=ensureUnified(card);if(!ui)return false;syncCopy(ui,record,card);syncImage(ui,record);syncControls(ui);return true;}
function findQuizQuestion(){
  const candidates=[...document.querySelectorAll('.question,[class*="question"],h1,h2,h3')].filter(visible);
  for(const q of candidates){
    const key=norm(q.textContent);
    if(questionMap.has(key))return{q,entry:questionMap.get(key)};
  }
  return null;
}
function syncQuiz(){
  setUnifiedMode(false);
  document.querySelectorAll('.cosmos-unified-card').forEach(x=>x.remove());
  if(!DATA)return false;
  const found=findQuizQuestion();
  if(!found){document.querySelectorAll('.cosmos-quiz-image').forEach(x=>x.remove());return false;}
  const {q,entry}=found;
  const panel=q.closest('section.panel')||q.closest('section')||q.parentElement;
  if(!panel)return false;
  let box=panel.querySelector(':scope > .cosmos-quiz-image');
  if(!box){
    box=document.createElement('div');
    box.className='cosmos-unified-image cosmos-quiz-image';
    panel.insertBefore(box,q);
  }
  const answered=!!panel.querySelector('.feedback,[class*="feedback"]');
  const side=answered?'B':'F';
  const target=quizImageTarget(entry,side,q),path=targetPath(target),fallback=targetRawPath(target);
  if(!path){box.dataset.src='';box.replaceChildren();box.textContent='IMAGE';return true;}
  if(box.dataset.src!==path||!box.querySelector('img')){
    box.dataset.src=path;box.replaceChildren();
    const img=document.createElement('img');img.alt='';img.draggable=false;
    let triedFallback=false;
    img.onerror=()=>{if(!triedFallback&&fallback){triedFallback=true;img.src=fallback;return;}box.replaceChildren();box.textContent='IMAGE';console.warn('[ALBAMEN Cosmos] quiz image failed',path,fallback,target);};
    img.src=path;box.appendChild(img);
  }
  return true;
}
function sync(){try{
  const card=originalCard();
  if(card){syncCard();return;}
  syncQuiz();
}catch(e){console.error('[ALBAMEN Cosmos] visual sync failed',e);}}
function install(){
  if(installed)return;installed=true;ensureStyle();window.__albamenTopicImagesVersion=VERSION;
  console.info('[ALBAMEN Cosmos] unified card renderer installed',VERSION);
  loadData().then(d=>{DATA=d;buildMaps();sync();}).catch(e=>console.error('[ALBAMEN Cosmos] image data failed',e));
  const root=document.getElementById('root')||document.body;
  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});};
  const observer=new MutationObserver(queue);
  observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
  document.addEventListener('click',()=>setTimeout(sync,0),true);
  timer=setInterval(sync,1200);
  sync();
}
window.AlbamenTopicCardVisuals={install,decorate:sync,version:VERSION};
})();