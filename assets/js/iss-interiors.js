/* AlbaSpace ISS interior explorer v2. No replacement viewer: works with #mainViewer. */
(() => {
  'use strict';
  const panel = document.getElementById('iss-interior-explorer');
  const viewer = document.getElementById('mainViewer');
  if (!panel || !viewer) return;

  const quality = panel.querySelector('#iss-interior-quality');
  const status = panel.querySelector('#iss-interior-status');
  const list = panel.querySelector('#iss-available-list');
  const count = panel.querySelector('#iss-ready-count');
  const exteriorButton = panel.querySelector('#iss-interior-outside');
  const mapNodes = [...panel.querySelectorAll('[data-iss-module]')];
  const exteriorURL = '/assets/models/iss.glb';
  const directory = '/assets/models/interior/';
  const modules = {
    destiny: {label:'Destiny',description:'ABD araştırma laboratuvarı',symbol:'⚗',orbit:'0deg 90deg 0.30m',target:'0m 0m 0m',fov:'80deg'},
    cupola: {label:'Cupola',description:'7 pencereli Dünya gözlem kubbesi',symbol:'◉',orbit:'180deg 88deg 0.40m',target:'0m 0.78m 0m',fov:'80deg'},
    harmony: {label:'Harmony',description:'Mürettebat yaşam bölümü',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'},
    columbus: {label:'Columbus',description:'Avrupa araştırma laboratuvarı',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'},
    kibo: {label:'Kibō',description:'Japon araştırma laboratuvarı',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'},
    tranquility: {label:'Tranquility',description:'Yaşam destek sistemleri',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'},
    unity: {label:'Unity',description:'Bağlantı modülü',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'},
    zarya: {label:'Zarya',description:'Fonksiyonel kargo bloğu',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'},
    zvezda: {label:'Zvezda',description:'Servis modülü',symbol:'◇',orbit:'0deg 90deg 0.4m',target:'0m 0m 0m',fov:'75deg'}
  };
  const versions = new Map();
  let current = 'exterior';
  let activeQuality = 'optimized';
  let activeSrc = exteriorURL;
  let transaction = 0;

  const modelPath = (key, kind) => directory + key + '_' + kind + '.glb';
  const message = (text, kind = 'info') => {status.textContent = text; status.dataset.kind = kind;};
  async function exists(url) {
    try {
      const r = await fetch(url, {method:'HEAD', cache:'no-store'});
      const type = (r.headers.get('content-type') || '').toLowerCase();
      return r.ok && !type.includes('text/html');
    } catch (error) {
      console.warn('[ISS interior] Model check failed:', url, error);
      return false;
    }
  }
  function ready(key, kind = quality.value) {
    return Boolean(versions.get(key)?.[kind]);
  }
  function repaint() {
    const names = Object.keys(modules).filter(key => ready(key));
    count.textContent = String(names.length).padStart(2,'0');
    for (const node of mapNodes) {
      const key = node.dataset.issModule;
      const isReady = ready(key);
      node.classList.toggle('is-ready',isReady);
      node.classList.toggle('is-pending',!isReady);
      node.classList.toggle('is-active',current === key);
      node.setAttribute('aria-label',modules[key].label + (isReady ? ': 3D modülü aç' : ': Yakında, model henüz yüklenmedi'));
    }
    list.replaceChildren();
    if (!names.length) {
      const placeholder=document.createElement('div');
      placeholder.className='iss-explorer-placeholder';
      placeholder.textContent='Bu kalitede henüz modül bulunamadı. Diğer kaliteyi deneyin.';
      list.appendChild(placeholder);
    }
    for (const key of names) {
      const module=modules[key];
      const card=document.createElement('button');
      card.type='button';
      card.className='iss-module-card';
      card.dataset.issGo=key;
      card.classList.toggle('is-active',current === key);
      const glyph=document.createElement('span'); glyph.className='iss-card-icon'; glyph.textContent=module.symbol;
      const copy=document.createElement('span'); copy.className='iss-card-copy';
      const title=document.createElement('span'); title.className='iss-card-name'; title.textContent=module.label;
      const subtitle=document.createElement('span');subtitle.className='iss-card-desc';subtitle.textContent=module.description;
      const arrow=document.createElement('span');arrow.className='iss-card-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
      copy.append(title,subtitle);card.append(glyph,copy,arrow);
      card.setAttribute('aria-label',module.label + ' 3D modelini göster');
      card.addEventListener('click',()=>select(key));
      list.appendChild(card);
    }
    exteriorButton.setAttribute('aria-pressed',String(current === 'exterior'));
  }
  async function scan() {
    await Promise.all(Object.keys(modules).map(async key => {
      const [optimized,detailed]=await Promise.all([
        exists(modelPath(key,'optimized')),
        exists(modelPath(key,'detailed'))
      ]);
      versions.set(key,{optimized,detailed});
      repaint();
    }));
    const n=Object.keys(modules).filter(key => ready(key)).length;
    if (current === 'exterior') message(n ? n + ' modül hazır. Soldan seçerek içine girebilirsiniz.' : 'Henüz hazır modül bulunamadı. Ana ISS modeli kullanılabilir.',n?'success':'info');
  }
  function positionCamera(key) {
    if (key === 'exterior') {
      viewer.setAttribute('camera-target','auto auto auto');
      viewer.setAttribute('camera-orbit','35deg 65deg 110%');
      viewer.setAttribute('field-of-view','45deg');
      viewer.setAttribute('ar-scale','auto');
    } else {
      const m=modules[key];
      viewer.setAttribute('camera-target',m.target);
      viewer.setAttribute('camera-orbit',m.orbit);
      viewer.setAttribute('field-of-view',m.fov);
      viewer.setAttribute('ar-scale','fixed');
    }
    viewer.setAttribute('min-camera-orbit','auto auto 0.005m');
    if (typeof viewer.jumpCameraToGoal === 'function') viewer.jumpCameraToGoal();
    viewer.dispatchEvent(new CustomEvent('iss-explorer-camera-changed'));
  }
  function revealViewer() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => viewer.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}));
  }
  function showCurrent() {
    const label=current==='exterior'?'Tüm istasyon':modules[current].label;
    message(label + ' — 3D görünüm hazır. Modeli döndürüp yakınlaştırabilirsiniz.','success');
  }
  async function select(key) {
    if (key!=='exterior' && !modules[key]) return;
    const id=++transaction;
    let kind=quality.value;
    let url=exteriorURL;
    if (key!=='exterior') {
      message(modules[key].label + ' modeli kontrol ediliyor…');
      let found=await exists(modelPath(key,kind));
      if (id!==transaction) return;
      versions.set(key,{...(versions.get(key)||{}),[kind]:found});
      if (!found) {
        const other=kind==='optimized'?'detailed':'optimized';
        if (ready(key,other) || await exists(modelPath(key,other))) {
          if (id!==transaction) return;
          versions.set(key,{...(versions.get(key)||{}),[other]:true});
          quality.value=other;
          kind=other;
          message(modules[key].label + ' yalnızca ' + (kind==='optimized'?'optimize':'detaylı') + ' kalitede mevcut; otomatik seçildi.','warning');
        } else {
          if (id!==transaction) return;
          repaint();
          message(modules[key].label + ' henüz hazır değil. Dosyayı assets/models/interior/' + key + '_' + kind + '.glb konumuna ekleyin.','warning');
          return;
        }
      }
      url=modelPath(key,kind);
    }
    current=key;
    activeQuality=kind;
    activeSrc=url;
    viewer.setAttribute('data-src',url);
    repaint();
    if (key==='exterior') message('İstasyonun dış görünümüne dönülüyor…');
    else message(modules[key].label + ' — 3D model yükleniyor…');
    if (viewer.getAttribute('src')===url && viewer.loaded) {
      positionCamera(key);
      showCurrent();
    } else {
      viewer.setAttribute('src',url);
    }
    revealViewer();
  }
  viewer.addEventListener('load',() => {
    // Asynchronous loads may complete after a newer selection.
    if (viewer.getAttribute('src')!==activeSrc) return;
    positionCamera(current);
    showCurrent();
  });
  viewer.addEventListener('error',() => {
    if (viewer.getAttribute('src')!==activeSrc) return;
    message((current==='exterior'?'ISS':modules[current].label) + ' dosyası yüklenemedi. Ağ bağlantısını ve GLB dosyasını kontrol edin.','warning');
  });
  exteriorButton.addEventListener('click',() => select('exterior'));
  quality.addEventListener('change',() => {
    repaint();
    if (current!=='exterior') select(current);
    else message('Kalite değiştirildi. Keşfedilebilir modüllerden birini seçin.');
  });
  for (const node of mapNodes) {
    const key=node.dataset.issModule;
    node.addEventListener('click',()=>select(key));
    node.addEventListener('keydown',e=> {
      if (e.key==='Enter'||e.key===' ') {e.preventDefault();select(key);}
    });
  }
  // Coordinates for 3D hotspots are deliberately not invented. Calibrate against the actual ISS GLB first.
  scan();
})();
