const CACHE='alba-staff-offline-v4';
const QR_DECODER_URL='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
const PRECACHE=[
  '/staff-pass.html','/eng/staff-pass.html','/rus/staff-pass.html',
  '/header-tr.html','/header-en.html','/header-ru.html',
  '/footer-tr.html','/footer-en.html','/footer-ru.html',
  '/assets/css/site.css','/assets/css/fix-layout.css','/assets/css/pass.css',
  '/assets/js/include.js','/assets/js/menu-toggle.js','/assets/js/mobile-header-cart.js',
  '/assets/js/worker-auth.js','/assets/js/pass-api.js','/assets/js/pass-locale.js',
  '/assets/js/barcode-detector-qr-polyfill.js','/assets/js/pass-offline.js','/assets/js/pass-staff.js',
  '/assets/icons/AlbaLogo.png','/assets/icons/alien.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(PRECACHE.map(async url=>{
      const response=await fetch(url,{cache:'reload'});
      if(response.ok)await cache.put(url,response.clone());
    }));
    await Promise.allSettled([
      (async()=>{
        const request=new Request(QR_DECODER_URL,{mode:'no-cors',cache:'reload'});
        const response=await fetch(request);
        await cache.put(request,response.clone());
      })()
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('alba-staff-offline-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  if(url.href===QR_DECODER_URL){
    event.respondWith(cacheFirst(request));
    return;
  }

  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/'))return;

  const isStaffPage=['/staff-pass.html','/eng/staff-pass.html','/rus/staff-pass.html'].includes(url.pathname);
  // The worker has root scope so it can reopen each localized staff page offline,
  // but it must never take over unrelated site assets. Only the explicit staff
  // precache is handled cache-first here.
  const isStaffAsset=PRECACHE.includes(url.pathname);
  if(!isStaffPage&&!isStaffAsset)return;

  if(isStaffPage){
    event.respondWith(networkFirst(request));
  }else{
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))||(await cache.match(new URL(request.url).pathname))||Response.error();
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request)||await cache.match(new URL(request.url).pathname);
  if(cached){
    fetch(request).then(response=>{if(response.ok||response.type==='opaque')cache.put(request,response.clone());}).catch(()=>{});
    return cached;
  }
  const response=await fetch(request);
  if(response.ok||response.type==='opaque')await cache.put(request,response.clone());
  return response;
}
