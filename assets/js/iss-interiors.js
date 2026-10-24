/* AlbaSpace ISS explorer — Blender Stage 1 / 2026-10-24. */
(async()=>{
'use strict';
const panel=document.getElementById('iss-interior-explorer'),viewer=document.getElementById('mainViewer');if(!panel||!viewer)return;
const $=s=>panel.querySelector(s),lang=(document.documentElement.lang||'tr').slice(0,2);
const messages={
tr:{outside:'Tüm istasyon',ready:n=>`${n} modül hazır. Bir modül seçerek içine girin.`,loading:n=>`${n} — 3D model yükleniyor…`,loaded:n=>`${n} — İç görünüm hazır. Etrafınıza bakmak için sürükleyin.`,error:n=>`${n} yüklenemedi. Yeniden seçerek deneyin.`,catalogError:'Modül listesi yüklenemedi. Sayfayı yenileyin.',open:': iç görünümü aç',render:'Blender renderını aç',base:'Temel · Aşama 1',next:'Detaylı · Sonraki aşama',note:'Aşama 1: temel 3D rekonstrüksiyonlar. Ayrıntılı ve fotogerçekçi sürümler bir sonraki aşamada.',cupola:'Cupola’ya geç',corridor:'Tranquility’ye dön'},
en:{outside:'Entire station',ready:n=>`${n} modules ready. Select a module to explore inside.`,loading:n=>`Loading ${n} 3D model…`,loaded:n=>`${n} — Interior ready. Drag to look around.`,error:n=>`Could not load ${n}. Select it again to retry.`,catalogError:'Could not load the module list. Refresh the page.',open:': open interior',render:'Open Blender render',base:'Base · Stage 1',next:'Detailed · Next stage',note:'Stage 1: base 3D reconstructions. Detailed, photorealistic versions are the next stage.',cupola:'Go to Cupola',corridor:'Back to Tranquility'},
ru:{outside:'Вся станция',ready:n=>`Готово модулей: ${n}. Выберите модуль для осмотра изнутри.`,loading:n=>`${n} — загружается 3D-модель…`,loaded:n=>`${n} — интерьер готов. Перетаскивайте, чтобы оглядеться.`,error:n=>`Не удалось загрузить ${n}. Выберите модуль ещё раз.`,catalogError:'Не удалось загрузить список модулей. Обновите страницу.',open:': открыть интерьер',render:'Открыть рендер Blender',base:'Базовое · Этап 1',next:'Детальное · Следующий этап',note:'Этап 1: базовые 3D-реконструкции. Детальные фотореалистичные версии — следующий этап.',cupola:'Перейти в Cupola',corridor:'Вернуться в Tranquility'}};
const ui=messages[lang]||messages.tr;
const list=$('#iss-available-list'),status=$('#iss-interior-status'),count=$('#iss-ready-count'),quality=$('#iss-interior-quality'),route=$('#iss-tranquility-route'),outside=$('#iss-interior-outside');
let modules=new Map(),current='exterior',activeSrc='';const exteriorURL='/assets/models/iss.glb';
const msg=(text,kind='info')=>{status.textContent=text;status.dataset.kind=kind;};
quality.replaceChildren(new Option(ui.base,'optimized'),new Option(ui.next,'detailed'));quality.options[1].disabled=true;quality.value='optimized';
const note=document.createElement('p');note.className='iss-stage-note';note.textContent=ui.note;panel.querySelector('.iss-explorer-heading').insertAdjacentElement('afterend',note);
$('#iss-look-cupola').textContent=ui.cupola;$('#iss-back-corridor').textContent=ui.corridor;
const renderLink=document.createElement('a');renderLink.className='iss-render-link';renderLink.textContent=ui.render;renderLink.target='_blank';renderLink.rel='noopener';renderLink.hidden=true;status.insertAdjacentElement('afterend',renderLink);
const saved={};for(const a of ['camera-orbit','camera-target','field-of-view','max-camera-orbit','min-camera-orbit','exposure','shadow-intensity','environment-image','ar-scale','auto-rotate'])saved[a]=viewer.getAttribute(a);
function repaint(){
 for(const el of panel.querySelectorAll('[data-iss-go],[data-iss-module]')){const key=el.dataset.issGo||el.dataset.issModule;el.classList.toggle('is-active',key===current);if(el.matches('button'))el.setAttribute('aria-pressed',String(key===current));}
 outside.setAttribute('aria-pressed',String(current==='exterior'));route.hidden=!['tranquility','cupola'].includes(current);renderLink.hidden=current==='exterior';if(current!=='exterior')renderLink.href=modules.get(current).render;
}
function position(key){
 if(key==='exterior'){
  for(const [a,v] of Object.entries(saved)){if(v===null)viewer.removeAttribute(a);else viewer.setAttribute(a,v);}
  viewer.setAttribute('camera-target','auto auto auto');viewer.setAttribute('camera-orbit','35deg 65deg 110%');viewer.setAttribute('field-of-view','45deg');viewer.setAttribute('min-camera-orbit','auto auto 0.005m');
 }else{
  const m=modules.get(key);viewer.setAttribute('camera-target',m.cameraTarget);viewer.setAttribute('camera-orbit',m.cameraOrbit);viewer.setAttribute('field-of-view','82deg');viewer.setAttribute('min-camera-orbit','auto auto 0.005m');viewer.setAttribute('max-camera-orbit','auto auto 0.5m');viewer.setAttribute('exposure','1.15');viewer.setAttribute('shadow-intensity','0');viewer.setAttribute('ar-scale','fixed');viewer.removeAttribute('auto-rotate');
 }
 viewer.jumpCameraToGoal?.();viewer.dispatchEvent(new CustomEvent('iss-explorer-camera-changed'));
}
function loaded(){if(viewer.getAttribute('src')!==activeSrc)return;position(current);msg(current==='exterior'?ui.outside:ui.loaded(modules.get(current).name),'success');}
function select(key){
 if(key!=='exterior'&&!modules.has(key))return;current=key;const m=modules.get(key);activeSrc=m?m.glb:exteriorURL;repaint();msg(ui.loading(m?m.name:ui.outside));viewer.setAttribute('data-src',activeSrc);viewer.setAttribute('data-model-name',m?'iss-'+key:'iss');position(key);
 if(viewer.getAttribute('src')===activeSrc&&viewer.loaded)loaded();else viewer.setAttribute('src',activeSrc);
 requestAnimationFrame(()=>viewer.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'}));
}
viewer.addEventListener('load',loaded);viewer.addEventListener('error',()=>{if(viewer.getAttribute('src')===activeSrc)msg(ui.error(modules.get(current)?.name||'ISS'),'warning');});
outside.addEventListener('click',()=>select('exterior'));$('#iss-look-cupola').addEventListener('click',()=>select('cupola'));$('#iss-back-corridor').addEventListener('click',()=>select('tranquility'));
try{
 const response=await fetch('/assets/models/interior/catalog-stage1.json?v=20261024');if(!response.ok)throw new Error(response.status);const catalog=await response.json();modules=new Map(catalog.map(m=>[m.id,m]));list.replaceChildren();
 for(const m of catalog){
  const card=document.createElement('button');card.type='button';card.className='iss-module-card';card.dataset.issGo=m.id;card.setAttribute('aria-label',m.name+ui.open);
  const thumb=document.createElement('img');thumb.className='iss-card-thumb';thumb.src=m.render;thumb.alt='';thumb.loading='lazy';thumb.width=70;thumb.height=48;
  const copy=document.createElement('span');copy.className='iss-card-copy';const title=document.createElement('span');title.className='iss-card-name';title.textContent=m.name;const desc=document.createElement('span');desc.className='iss-card-desc';desc.textContent=m.description[lang]||m.description.tr;
  copy.append(title,desc);card.append(thumb,copy);card.addEventListener('click',()=>select(m.id));list.append(card);
 }
 for(const node of panel.querySelectorAll('[data-iss-module]')){const m=modules.get(node.dataset.issModule);if(!m)continue;node.classList.add('is-ready');node.classList.remove('is-pending');node.setAttribute('aria-label',m.name+ui.open);node.addEventListener('click',()=>select(m.id));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(m.id);}});}
 count.textContent=String(catalog.length);msg(ui.ready(catalog.length),'success');repaint();const initial=new URLSearchParams(location.search).get('module');if(modules.has(initial))select(initial);
}catch(e){console.error('[ISS explorer]',e);msg(ui.catalogError,'warning');}
})();
