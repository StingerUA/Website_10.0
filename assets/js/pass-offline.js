(function(){
  const DB_NAME='albaspace-pass-offline-v1';
  const DB_VERSION=1;
  const STORE_STATE='state';
  const STORE_ACTIONS='actions';
  const DEVICE_KEY='albaspace_staff_device_id';
  const ZONE_KEY='albaspace_staff_offline_zone';
  const VALID_ZONES=new Set(['readonly','sun','moon','vr','payments']);
  const WRITE_ZONES=new Set(['sun','moon','vr','payments']);

  let dbPromise=null;
  let current=null;
  let initialized=false;
  let syncing=false;
  let forceOffline=false;
  let timer=null;

  const L={
    tr:{title:'Offline hazırlık',online:'ONLINE',offline:'OFFLINE',expired:'OFFLINE SÜRESİ DOLDU',ready:'Offline hazır',notReady:'Offline snapshot yok',remaining:'kaldı',queued:'bekleyen işlem',conflicts:'çakışma',prepare:'20 dk hazırla',sync:'Şimdi senkronize et',readonly:'Sadece görüntüleme',sun:'Güneş istasyonu',moon:'Ay istasyonu',vr:'VR istasyonu',payments:'Kasa / ödemeler',zoneBusy:'Bu offline istasyon başka bir tablette kullanılıyor.',prepared:'Offline mod hazırlandı.',prepareFailed:'Offline hazırlık başarısız',syncDone:'Senkronizasyon tamamlandı.',syncFailed:'Senkronizasyon başarısız',writeBlocked:'Bu cihazın offline istasyonu bu işlem için yetkili değil.',sessionExpired:'20 dakikalık offline çalışma süresi doldu. İnternet geldiğinde yeniden hazırlayın.',passMissing:'Bu QR offline snapshot içinde yok.',paymentQueued:'Ödeme onayı offline kuyruğa alındı. Pass internet geldikten sonra aktifleşir.'},
    en:{title:'Offline readiness',online:'ONLINE',offline:'OFFLINE',expired:'OFFLINE SESSION EXPIRED',ready:'Offline ready',notReady:'No offline snapshot',remaining:'remaining',queued:'queued actions',conflicts:'conflicts',prepare:'Prepare 20 min',sync:'Sync now',readonly:'Read only',sun:'Sun station',moon:'Moon station',vr:'VR station',payments:'Cashier / payments',zoneBusy:'This offline station is already reserved by another tablet.',prepared:'Offline mode prepared.',prepareFailed:'Offline preparation failed',syncDone:'Synchronization completed.',syncFailed:'Synchronization failed',writeBlocked:'This tablet is not authorized for that offline station action.',sessionExpired:'The 20-minute offline window has expired. Re-prepare when internet is available.',passMissing:'This QR is not present in the offline snapshot.',paymentQueued:'Payment confirmation was queued offline. The Pass will activate after internet returns.'},
    ru:{title:'Подготовка офлайн',online:'ONLINE',offline:'OFFLINE',expired:'ОФЛАЙН-СЕССИЯ ИСТЕКЛА',ready:'Офлайн готов',notReady:'Нет офлайн-снимка',remaining:'осталось',queued:'операций в очереди',conflicts:'конфликтов',prepare:'Подготовить на 20 мин',sync:'Синхронизировать',readonly:'Только просмотр',sun:'Станция Солнце',moon:'Станция Луна',vr:'Станция VR',payments:'Касса / оплаты',zoneBusy:'Эта офлайн-зона уже занята другим планшетом.',prepared:'Офлайн-режим подготовлен.',prepareFailed:'Не удалось подготовить офлайн',syncDone:'Синхронизация завершена.',syncFailed:'Ошибка синхронизации',writeBlocked:'Этот планшет не назначен на эту офлайн-зону.',sessionExpired:'20 минут офлайн-работы истекли. Когда появится интернет, подготовьте режим заново.',passMissing:'Этот QR отсутствует в офлайн-снимке.',paymentQueued:'Подтверждение оплаты поставлено в офлайн-очередь. Pass активируется после возврата интернета.'}
  };

  function lang(){const raw=(document.documentElement.lang||'tr').toLowerCase();return raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':'tr';}
  function tr(key){return L[lang()][key]||L.en[key]||key;}
  function nowSec(){return Math.floor(Date.now()/1000);}
  function deviceId(){
    let value='';
    try{value=localStorage.getItem(DEVICE_KEY)||'';}catch{}
    if(!value){value='dev_'+(crypto.randomUUID?crypto.randomUUID().replace(/-/g,''):Math.random().toString(36).slice(2)+Date.now().toString(36));try{localStorage.setItem(DEVICE_KEY,value);}catch{}}
    return value;
  }
  function storedZone(){let value='readonly';try{value=localStorage.getItem(ZONE_KEY)||'readonly';}catch{}return VALID_ZONES.has(value)?value:'readonly';}
  function saveZone(zone){if(!VALID_ZONES.has(zone))return;try{localStorage.setItem(ZONE_KEY,zone);}catch{}}

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE_STATE))db.createObjectStore(STORE_STATE,{keyPath:'key'});
        if(!db.objectStoreNames.contains(STORE_ACTIONS))db.createObjectStore(STORE_ACTIONS,{keyPath:'request_id'});
      };
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }
  async function getState(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_STATE,'readonly');const req=tx.objectStore(STORE_STATE).get(key);req.onsuccess=()=>resolve(req.result?.value??null);req.onerror=()=>reject(req.error);});}
  async function setState(key,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_STATE,'readwrite');tx.objectStore(STORE_STATE).put({key,value});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function putAction(action){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_ACTIONS,'readwrite');tx.objectStore(STORE_ACTIONS).put(action);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function deleteAction(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_ACTIONS,'readwrite');tx.objectStore(STORE_ACTIONS).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function allActions(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_ACTIONS,'readonly');const req=tx.objectStore(STORE_ACTIONS).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}

  function isNetworkError(error){return !error?.status&&(error instanceof TypeError||/fetch|network|offline/i.test(String(error?.message||'')));}
  function sessionValid(){return !!(current?.offline?.ticket&&Number(current.offline.expires_at||0)>nowSec());}
  function canUseOffline(){return !!(current?.snapshot&&sessionValid());}
  function mode(){if(!current?.snapshot)return 'none';if(!sessionValid())return 'expired';if(forceOffline||navigator.onLine===false)return 'offline';return 'online';}
  function assertOfflineReady(){if(!current?.snapshot)throw localError('OFFLINE_NOT_PREPARED',tr('notReady'));if(!sessionValid())throw localError('OFFLINE_SESSION_EXPIRED',tr('sessionExpired'));}
  function assertZone(expected){assertOfflineReady();const zone=current.offline.zone;if(zone!==expected)throw localError('OFFLINE_ZONE_MISMATCH',tr('writeBlocked'));}
  function localError(code,message){const error=new Error(message||code);error.data={error:code};error.status=0;return error;}

  async function init(){
    if(initialized)return current;
    initialized=true;
    current=await getState('offline')||null;
    injectUi();
    registerServiceWorker();
    window.addEventListener('offline',()=>{forceOffline=true;updateUi();});
    window.addEventListener('online',async()=>{forceOffline=false;updateUi();await sync().catch(()=>{});await prepare(storedZone(),{quiet:true}).catch(()=>{});});
    timer=setInterval(updateUi,1000);
    if(navigator.onLine!==false){
      await sync().catch(()=>{});
      await prepare(storedZone(),{quiet:true}).catch(async error=>{
        if(error?.data?.error==='OFFLINE_ZONE_IN_USE'&&storedZone()!=='readonly')await prepare('readonly',{quiet:true}).catch(()=>{});
      });
    }
    updateUi();
    return current;
  }

  async function prepare(zone=storedZone(),options={}){
    if(!VALID_ZONES.has(zone))zone='readonly';
    const api=window.AlbaPassApi;if(!api)throw new Error('PASS_API_MISSING');
    try{
      const data=await api.request('/api/staff/offline/bootstrap',{method:'POST',body:{device_id:deviceId(),zone}});
      current={offline:data.offline,snapshot:data.snapshot,prepared_at:nowSec()};
      saveZone(zone);await setState('offline',current);forceOffline=false;updateUi(options.quiet?null:tr('prepared'));
      return current;
    }catch(error){
      if(isNetworkError(error)){forceOffline=true;updateUi();if(canUseOffline())return current;}
      if(!options.quiet)updateUi(error?.data?.error==='OFFLINE_ZONE_IN_USE'?tr('zoneBusy'):`${tr('prepareFailed')}: ${error?.data?.error||error.message}`,'error');
      throw error;
    }
  }

  async function sync(){
    if(syncing||navigator.onLine===false||!current?.offline?.ticket)return {ok:false,skipped:true};
    const actions=(await allActions()).filter(item=>item.state!=='failed').slice(0,100);
    if(!actions.length){updateUi();return {ok:true,results:[]};}
    syncing=true;updateUi();
    try{
      const api=window.AlbaPassApi;
      const data=await api.request('/api/staff/offline/sync',{method:'POST',body:{device_id:deviceId(),ticket:current.offline.ticket,actions}});
      for(const result of data.results||[]){
        if(result.ok)await deleteAction(result.request_id);
        else{
          const existing=actions.find(item=>item.request_id===result.request_id);
          if(existing)await putAction({...existing,state:'failed',sync_error:result.error||result.data?.error||'SYNC_CONFLICT',sync_status:result.status||0});
        }
      }
      syncing=false;updateUi(tr('syncDone'));
      window.dispatchEvent(new CustomEvent('alba-pass-offline-synced',{detail:data}));
      return data;
    }catch(error){syncing=false;if(isNetworkError(error))forceOffline=true;updateUi(`${tr('syncFailed')}: ${error?.data?.error||error.message}`,'error');throw error;}
  }

  async function lookupToken(raw){
    assertOfflineReady();forceOffline=true;
    const token=normalizeToken(raw);const hash=await sha256Hex(token);
    const pass=(current.snapshot.passes||[]).find(item=>item.token_hash===hash);
    if(!pass)throw localError('OFFLINE_PASS_NOT_FOUND',tr('passMissing'));
    return {pass:clone(pass),offline:true};
  }

  async function redeem({token,entitlement_id,amount,request_id,note=''}){
    assertOfflineReady();forceOffline=true;
    const normalized=normalizeToken(token);const hash=await sha256Hex(normalized);
    const pass=(current.snapshot.passes||[]).find(item=>item.token_hash===hash);
    if(!pass)throw localError('OFFLINE_PASS_NOT_FOUND',tr('passMissing'));
    const ent=(pass.entitlements||[]).find(item=>item.id===entitlement_id);
    if(!ent)throw localError('ENTITLEMENT_NOT_FOUND','ENTITLEMENT_NOT_FOUND');
    const zone=zoneForEntitlement(ent.entitlement_code);assertZone(zone);
    const qty=Math.max(1,Math.min(120,Number.parseInt(amount||'1',10)||1));
    if(pass.status!=='active'||pass.payment_status!=='confirmed')throw localError('PASS_NOT_ACTIVE','PASS_NOT_ACTIVE');
    if(ent.status!=='available'||Number(ent.remaining_quantity)<qty)throw localError('INSUFFICIENT_ENTITLEMENT','INSUFFICIENT_ENTITLEMENT');
    const now=nowSec();if(ent.valid_from&&now<Number(ent.valid_from))throw localError('ENTITLEMENT_NOT_YET_VALID','ENTITLEMENT_NOT_YET_VALID');if(ent.valid_until&&now>Number(ent.valid_until))throw localError('ENTITLEMENT_EXPIRED','ENTITLEMENT_EXPIRED');
    ent.remaining_quantity=Number(ent.remaining_quantity)-qty;ent.status=Number(ent.remaining_quantity)<=0?'used':'available';ent.last_used_at=now;
    const action={request_id,type:'redeem',occurred_at:now,token:normalized,entitlement_id,amount:qty,note,state:'pending'};
    await putAction(action);pushLocalRecent('entitlement_used',entitlement_id,request_id,now);await setState('offline',current);updateUi();
    return {ok:true,offline:true,queued:true,pass_id:pass.id,entitlement_id,amount:qty,remaining_quantity:Number(ent.remaining_quantity),used_at:now};
  }

  async function pendingPayments(){assertOfflineReady();forceOffline=true;const queued=new Set((await allActions()).filter(a=>a.type==='payment_confirm'&&a.state!=='failed').map(a=>a.payment_id));return {payments:clone((current.snapshot.pending_payments||[]).filter(p=>!queued.has(p.id))),offline:true};}

  async function confirmPayment({payment_id,request_id,bank_reference='',note=''}){
    assertZone('payments');forceOffline=true;
    const payment=(current.snapshot.pending_payments||[]).find(item=>item.id===payment_id);
    if(!payment)throw localError('PAYMENT_NOT_FOUND','PAYMENT_NOT_FOUND');
    const now=nowSec();
    await putAction({request_id,type:'payment_confirm',occurred_at:now,payment_id,bank_reference,note,state:'pending'});
    payment._offline_queued=true;pushLocalRecent('payment_confirmed_queued',payment_id,request_id,now);await setState('offline',current);updateUi(tr('paymentQueued'));
    return {ok:true,offline:true,queued:true,payment_id};
  }

  async function searchCustomers(q){assertOfflineReady();forceOffline=true;const needle=String(q||'').trim().toLowerCase();const customers=(current.snapshot.customers||[]).filter(c=>String(c.email||'').toLowerCase().includes(needle)||String(c.name||'').toLowerCase().includes(needle)).slice(0,20);return {customers:clone(customers),offline:true};}
  async function recentActivity(){assertOfflineReady();forceOffline=true;return {events:clone(current.snapshot.recent||[]),offline:true};}

  function pushLocalRecent(type,target,requestId,createdAt){
    if(!current?.snapshot)return;
    current.snapshot.recent=current.snapshot.recent||[];
    current.snapshot.recent.unshift({id:'local:'+requestId,event_type:type,actor_name:'OFFLINE',target_type:'offline_action',target_id:target,created_at:createdAt,_offline:true});
    current.snapshot.recent=current.snapshot.recent.slice(0,100);
  }

  function normalizeToken(raw){
    let value=String(raw||'').trim();if(value.startsWith('ALBAPASS:'))value=value.slice(9);
    if(/^https?:\/\//i.test(value)){try{const url=new URL(value);value=url.searchParams.get('pass')||url.hash.match(/(?:^#|[&#])pass=([^&]+)/)?.[1]||value;value=decodeURIComponent(value);}catch{}}
    return value.trim();
  }
  async function sha256Hex(value){const bytes=new TextEncoder().encode(String(value||''));const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));return [...digest].map(b=>b.toString(16).padStart(2,'0')).join('');}
  function zoneForEntitlement(code){const value=String(code||'').toLowerCase();if(value.includes('sun'))return 'sun';if(value.includes('moon'))return 'moon';if(value.includes('vr'))return 'vr';return 'unknown';}
  function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}

  function injectUi(){
    if(document.getElementById('staffOfflineBar'))return;
    const workspace=document.getElementById('staffWorkspace');if(!workspace)return;
    const bar=document.createElement('section');bar.id='staffOfflineBar';bar.className='pass-card';
    bar.innerHTML=`<div class="staff-offline-row"><div><strong id="staffOfflineState">${tr('online')}</strong><div id="staffOfflineDetail" class="pass-muted"></div></div><div class="staff-offline-controls"><label>${tr('title')}<select id="staffOfflineZone"><option value="readonly">${tr('readonly')}</option><option value="sun">${tr('sun')}</option><option value="moon">${tr('moon')}</option><option value="vr">${tr('vr')}</option><option value="payments">${tr('payments')}</option></select></label><button id="staffOfflinePrepare" class="pass-btn secondary" type="button">${tr('prepare')}</button><button id="staffOfflineSync" class="pass-btn secondary" type="button">${tr('sync')}</button></div></div><div id="staffOfflineMessage" class="pass-muted"></div>`;
    workspace.prepend(bar);
    const style=document.createElement('style');style.textContent='.staff-offline-row{display:flex;gap:14px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}.staff-offline-controls{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}.staff-offline-controls label{min-width:180px}.staff-offline-controls select{margin-top:5px;width:100%}#staffOfflineBar.offline{border-color:#f59e0b}#staffOfflineBar.expired{border-color:#ef4444}#staffOfflineState{letter-spacing:.06em}';document.head.appendChild(style);
    const select=document.getElementById('staffOfflineZone');select.value=storedZone();select.addEventListener('change',()=>saveZone(select.value));
    document.getElementById('staffOfflinePrepare')?.addEventListener('click',()=>prepare(select.value).catch(()=>{}));
    document.getElementById('staffOfflineSync')?.addEventListener('click',()=>sync().catch(()=>{}));
  }

  async function updateUi(message=null,kind='info'){
    const bar=document.getElementById('staffOfflineBar');if(!bar)return;
    const state=document.getElementById('staffOfflineState');const detail=document.getElementById('staffOfflineDetail');const msg=document.getElementById('staffOfflineMessage');
    const actions=await allActions().catch(()=>[]);const pending=actions.filter(a=>a.state!=='failed').length;const failed=actions.filter(a=>a.state==='failed').length;
    const m=mode();bar.classList.toggle('offline',m==='offline');bar.classList.toggle('expired',m==='expired');
    if(m==='offline')state.textContent='🟠 '+tr('offline');else if(m==='expired')state.textContent='🔴 '+tr('expired');else state.textContent='🟢 '+tr('online');
    let text=current?.snapshot?tr('ready'):tr('notReady');if(current?.offline?.expires_at){const remain=Math.max(0,Number(current.offline.expires_at)-nowSec());text+=` · ${formatRemaining(remain)} ${tr('remaining')} · ${current.offline.zone}`;}text+=` · ${pending} ${tr('queued')}`;if(failed)text+=` · ${failed} ${tr('conflicts')}`;detail.textContent=text;
    if(message!==null){msg.textContent=message;msg.className=kind==='error'?'pass-notice pass-error':'pass-muted';}
    document.getElementById('staffOfflineSync')?.toggleAttribute('disabled',syncing||navigator.onLine===false||pending===0);
  }
  function formatRemaining(seconds){const m=Math.floor(seconds/60);const s=seconds%60;return `${m}:${String(s).padStart(2,'0')}`;}
  function registerServiceWorker(){if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw-pass-staff.js',{scope:'/'}).catch(error=>console.warn('Staff offline service worker registration failed',error));}

  window.AlbaPassOffline={init,prepare,sync,lookupToken,redeem,pendingPayments,confirmPayment,searchCustomers,recentActivity,canUseOffline,isNetworkError,mode,deviceId,storedZone,tr};
})();
