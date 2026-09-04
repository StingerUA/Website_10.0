(function(){
  const DB_NAME='albaspace-pass-offline-v1';
  const DB_VERSION=1;
  const STORE_STATE='state';
  const STORE_ACTIONS='actions';
  const DEVICE_KEY='albaspace_staff_device_id';
  const MAX_SYNC_BATCHES=20;

  let dbPromise=null;
  let current=null;
  let initialized=false;
  let syncing=false;
  let forceOffline=false;
  let timer=null;

  const L={
    tr:{
      title:'20 dakikalık Offline Staff Mode',online:'ONLINE',offline:'OFFLINE',expired:'OFFLINE SÜRESİ DOLDU',
      ready:'Offline snapshot hazır',notReady:'Offline snapshot yok',remaining:'kaldı',queued:'bekleyen işlem',conflicts:'çakışma',
      prepare:'20 dk hazırla',sync:'Şimdi senkronize et',prepared:'Offline mod 20 dakika için hazırlandı.',
      prepareFailed:'Offline hazırlık başarısız',syncDone:'Senkronizasyon tamamlandı.',syncFailed:'Senkronizasyon başarısız',
      sessionExpired:'20 dakikalık offline işlem süresi doldu. Verileri görüntüleyebilirsiniz ancak yeni işlem kaydedemezsiniz.',
      passMissing:'Bu QR offline snapshot içinde yok.',paymentQueued:'Ödeme onayı offline kuyruğa alındı. Pass internet geldikten sonra aktifleşir.',
      readOnly:'Salt okunur: yeni kullanım ve ödeme onayı kapalı.'
    },
    en:{
      title:'20-minute Offline Staff Mode',online:'ONLINE',offline:'OFFLINE',expired:'OFFLINE SESSION EXPIRED',
      ready:'Offline snapshot ready',notReady:'No offline snapshot',remaining:'remaining',queued:'queued actions',conflicts:'conflicts',
      prepare:'Prepare 20 min',sync:'Sync now',prepared:'Offline mode is ready for 20 minutes.',
      prepareFailed:'Offline preparation failed',syncDone:'Synchronization completed.',syncFailed:'Synchronization failed',
      sessionExpired:'The 20-minute offline transaction window has expired. You can still view cached data, but cannot record new actions.',
      passMissing:'This QR is not present in the offline snapshot.',paymentQueued:'Payment confirmation was queued offline. The Pass will activate after internet returns.',
      readOnly:'Read only: new redemptions and payment confirmations are disabled.'
    },
    ru:{
      title:'Офлайн-режим сотрудника на 20 минут',online:'ONLINE',offline:'OFFLINE',expired:'ОФЛАЙН-СЕССИЯ ИСТЕКЛА',
      ready:'Офлайн-снимок готов',notReady:'Нет офлайн-снимка',remaining:'осталось',queued:'операций в очереди',conflicts:'конфликтов',
      prepare:'Подготовить на 20 мин',sync:'Синхронизировать',prepared:'Офлайн-режим подготовлен на 20 минут.',
      prepareFailed:'Не удалось подготовить офлайн',syncDone:'Синхронизация завершена.',syncFailed:'Ошибка синхронизации',
      sessionExpired:'20 минут офлайн-операций истекли. Кэшированные данные можно смотреть, но новые операции записывать нельзя.',
      passMissing:'Этот QR отсутствует в офлайн-снимке.',paymentQueued:'Подтверждение оплаты поставлено в офлайн-очередь. Pass активируется после возврата интернета.',
      readOnly:'Только просмотр: новые списания и подтверждения оплат отключены.'
    }
  };

  function lang(){
    const raw=(document.documentElement.lang||'tr').toLowerCase();
    return raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':'tr';
  }
  function tr(key){return L[lang()][key]||L.en[key]||key;}
  function nowSec(){return Math.floor(Date.now()/1000);}
  function serverNowSec(){return nowSec()+Number(current?.clock_offset||0);}

  function deviceId(){
    let value='';
    try{value=localStorage.getItem(DEVICE_KEY)||'';}catch{}
    if(!value){
      value='dev_'+(crypto.randomUUID?crypto.randomUUID().replace(/-/g,''):Math.random().toString(36).slice(2)+Date.now().toString(36));
      try{localStorage.setItem(DEVICE_KEY,value);}catch{}
    }
    return value;
  }

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE_STATE))db.createObjectStore(STORE_STATE,{keyPath:'key'});
        if(!db.objectStoreNames.contains(STORE_ACTIONS))db.createObjectStore(STORE_ACTIONS,{keyPath:'request_id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }

  async function getState(key){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_STATE,'readonly');
      const req=tx.objectStore(STORE_STATE).get(key);
      req.onsuccess=()=>resolve(req.result?.value??null);
      req.onerror=()=>reject(req.error);
    });
  }

  async function setState(key,value){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_STATE,'readwrite');
      tx.objectStore(STORE_STATE).put({key,value});
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }

  async function putAction(action){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_ACTIONS,'readwrite');
      tx.objectStore(STORE_ACTIONS).put(action);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }

  async function deleteAction(id){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_ACTIONS,'readwrite');
      tx.objectStore(STORE_ACTIONS).delete(id);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }

  async function allActions(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_ACTIONS,'readonly');
      const req=tx.objectStore(STORE_ACTIONS).getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=()=>reject(req.error);
    });
  }

  function isNetworkError(error){
    return !error?.status&&(error instanceof TypeError||/fetch|network|offline/i.test(String(error?.message||'')));
  }
  function sessionValid(){return !!(current?.offline?.ticket&&Number(current.offline.expires_at||0)>serverNowSec());}
  function canUseOffline(){return !!current?.snapshot;}
  function canWriteOffline(){return !!(current?.snapshot&&sessionValid());}
  function mode(){
    if(!current?.snapshot)return 'none';
    if(!sessionValid())return 'expired';
    if(forceOffline||navigator.onLine===false)return 'offline';
    return 'online';
  }
  function assertOfflineReadable(){
    if(!current?.snapshot)throw localError('OFFLINE_NOT_PREPARED',tr('notReady'));
  }
  function assertOfflineWritable(){
    assertOfflineReadable();
    if(!sessionValid())throw localError('OFFLINE_SESSION_EXPIRED',tr('sessionExpired'));
  }
  function localError(code,message){
    const error=new Error(message||code);
    error.data={error:code};
    error.status=0;
    return error;
  }

  async function init(){
    if(initialized)return current;
    initialized=true;
    current=await getState('offline')||null;
    injectUi();
    registerServiceWorker();
    window.addEventListener('offline',()=>{forceOffline=true;updateUi();});
    window.addEventListener('online',async()=>{
      forceOffline=false;
      updateUi();
      await sync().catch(()=>{});
      await prepare({quiet:true,skipSync:true}).catch(()=>{});
    });
    timer=setInterval(updateUi,1000);
    if(navigator.onLine!==false){
      await sync().catch(()=>{});
      await prepare({quiet:true,skipSync:true}).catch(()=>{});
    }
    updateUi();
    return current;
  }

  async function prepare(options={}){
    if(typeof options==='string')options={};
    const api=window.AlbaPassApi;
    if(!api)throw new Error('PASS_API_MISSING');
    try{
      if(!options.skipSync&&navigator.onLine!==false&&current?.offline?.ticket){
        const pending=(await allActions()).some(item=>item.state!=='failed');
        if(pending)await sync();
      }

      const localBefore=nowSec();
      const data=await api.request('/api/staff/offline/bootstrap',{method:'POST',body:{device_id:deviceId()}});
      const offset=Number(data?.offline?.issued_at||localBefore)-nowSec();
      current={
        offline:data.offline,
        snapshot:data.snapshot,
        staff:data.staff||current?.staff||null,
        prepared_at:nowSec(),
        clock_offset:offset
      };
      await setState('offline',current);
      forceOffline=false;
      updateUi(options.quiet?null:tr('prepared'));
      return current;
    }catch(error){
      if(isNetworkError(error)){
        forceOffline=true;
        updateUi();
        if(canUseOffline())return current;
      }
      if(!options.quiet)updateUi(`${tr('prepareFailed')}: ${error?.data?.error||error.message}`,'error');
      throw error;
    }
  }

  async function sync(){
    if(syncing||navigator.onLine===false||!current?.offline?.ticket)return {ok:false,skipped:true,results:[]};
    syncing=true;
    updateUi();
    const combined=[];
    let serverTime=null;
    try{
      const api=window.AlbaPassApi;
      for(let batchNo=0;batchNo<MAX_SYNC_BATCHES;batchNo+=1){
        const actions=(await allActions()).filter(item=>item.state!=='failed').slice(0,100);
        if(!actions.length)break;

        const data=await api.request('/api/staff/offline/sync',{
          method:'POST',
          body:{device_id:deviceId(),ticket:current.offline.ticket,actions}
        });
        if(data?.server_time)serverTime=Number(data.server_time);

        for(const result of data.results||[]){
          combined.push(result);
          if(result.ok){
            await deleteAction(result.request_id);
          }else{
            const existing=actions.find(item=>item.request_id===result.request_id);
            if(existing){
              await putAction({...existing,state:'failed',sync_error:result.error||result.data?.error||'SYNC_CONFLICT',sync_status:result.status||0});
            }
          }
        }

        if((data.results||[]).length===0)break;
      }

      if(serverTime!==null&&current){
        current.clock_offset=serverTime-nowSec();
        await setState('offline',current).catch(()=>{});
      }

      syncing=false;
      const data={ok:true,results:combined,server_time:serverTime};
      updateUi(tr('syncDone'));
      window.dispatchEvent(new CustomEvent('alba-pass-offline-synced',{detail:data}));
      return data;
    }catch(error){
      syncing=false;
      if(isNetworkError(error))forceOffline=true;
      updateUi(`${tr('syncFailed')}: ${error?.data?.error||error.message}`,'error');
      throw error;
    }
  }

  async function lookupToken(raw){
    assertOfflineReadable();
    forceOffline=true;
    const token=normalizeToken(raw);
    const hash=await sha256Hex(token);
    const pass=(current.snapshot.passes||[]).find(item=>item.token_hash===hash);
    if(!pass)throw localError('OFFLINE_PASS_NOT_FOUND',tr('passMissing'));
    return {pass:clone(pass),offline:true};
  }

  async function redeem({token,entitlement_id,amount,request_id,note=''}){
    assertOfflineWritable();
    forceOffline=true;
    const normalized=normalizeToken(token);
    const hash=await sha256Hex(normalized);
    const pass=(current.snapshot.passes||[]).find(item=>item.token_hash===hash);
    if(!pass)throw localError('OFFLINE_PASS_NOT_FOUND',tr('passMissing'));
    const ent=(pass.entitlements||[]).find(item=>item.id===entitlement_id);
    if(!ent)throw localError('ENTITLEMENT_NOT_FOUND','ENTITLEMENT_NOT_FOUND');

    const qty=Math.max(1,Math.min(120,Number.parseInt(amount||'1',10)||1));
    if(pass.status!=='active'||pass.payment_status!=='confirmed')throw localError('PASS_NOT_ACTIVE','PASS_NOT_ACTIVE');
    if(ent.status!=='available'||Number(ent.remaining_quantity)<qty)throw localError('INSUFFICIENT_ENTITLEMENT','INSUFFICIENT_ENTITLEMENT');

    const now=serverNowSec();
    if(ent.valid_from&&now<Number(ent.valid_from))throw localError('ENTITLEMENT_NOT_YET_VALID','ENTITLEMENT_NOT_YET_VALID');
    if(ent.valid_until&&now>Number(ent.valid_until))throw localError('ENTITLEMENT_EXPIRED','ENTITLEMENT_EXPIRED');

    ent.remaining_quantity=Number(ent.remaining_quantity)-qty;
    ent.status=Number(ent.remaining_quantity)<=0?'used':'available';
    ent.last_used_at=now;

    const action={request_id,type:'redeem',occurred_at:now,token:normalized,entitlement_id,amount:qty,note,state:'pending'};
    await putAction(action);
    pushLocalRecent('entitlement_used_queued',entitlement_id,request_id,now);
    await setState('offline',current);
    updateUi();
    return {
      ok:true,offline:true,queued:true,pass_id:pass.id,entitlement_id,amount:qty,
      remaining_quantity:Number(ent.remaining_quantity),used_at:now
    };
  }

  async function pendingPayments(){
    assertOfflineReadable();
    forceOffline=true;
    const queued=new Set((await allActions()).filter(a=>a.type==='payment_confirm'&&a.state!=='failed').map(a=>a.payment_id));
    return {payments:clone((current.snapshot.pending_payments||[]).filter(p=>!queued.has(p.id))),offline:true};
  }

  async function confirmPayment({payment_id,request_id,bank_reference='',note=''}){
    assertOfflineWritable();
    forceOffline=true;
    const payment=(current.snapshot.pending_payments||[]).find(item=>item.id===payment_id);
    if(!payment)throw localError('PAYMENT_NOT_FOUND','PAYMENT_NOT_FOUND');
    const now=serverNowSec();
    await putAction({request_id,type:'payment_confirm',occurred_at:now,payment_id,bank_reference,note,state:'pending'});
    payment._offline_queued=true;
    pushLocalRecent('payment_confirmed_queued',payment_id,request_id,now);
    await setState('offline',current);
    updateUi(tr('paymentQueued'));
    return {ok:true,offline:true,queued:true,payment_id};
  }

  async function searchCustomers(q){
    assertOfflineReadable();
    forceOffline=true;
    const needle=String(q||'').trim().toLowerCase();
    const customers=(current.snapshot.customers||[])
      .filter(c=>String(c.email||'').toLowerCase().includes(needle)||String(c.name||'').toLowerCase().includes(needle))
      .slice(0,20);
    return {customers:clone(customers),offline:true};
  }

  async function recentActivity(){
    assertOfflineReadable();
    forceOffline=true;
    return {events:clone(current.snapshot.recent||[]),offline:true};
  }

  function pushLocalRecent(type,target,requestId,createdAt){
    if(!current?.snapshot)return;
    current.snapshot.recent=current.snapshot.recent||[];
    current.snapshot.recent.unshift({
      id:'local:'+requestId,event_type:type,actor_name:'OFFLINE',target_type:'offline_action',
      target_id:target,created_at:createdAt,_offline:true
    });
    current.snapshot.recent=current.snapshot.recent.slice(0,100);
  }

  function staffIdentity(){return current?.staff||null;}
  function storedZone(){return 'all';}

  function normalizeToken(raw){
    let value=String(raw||'').trim();
    if(value.startsWith('ALBAPASS:'))value=value.slice(9);
    if(/^https?:\/\//i.test(value)){
      try{
        const url=new URL(value);
        value=url.searchParams.get('pass')||url.hash.match(/(?:^#|[&#])pass=([^&]+)/)?.[1]||value;
        value=decodeURIComponent(value);
      }catch{}
    }
    return value.trim();
  }

  async function sha256Hex(value){
    const bytes=new TextEncoder().encode(String(value||''));
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
    return [...digest].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}

  function injectUi(){
    if(document.getElementById('staffOfflineBar'))return;
    const workspace=document.getElementById('staffWorkspace');
    if(!workspace)return;
    const bar=document.createElement('section');
    bar.id='staffOfflineBar';
    bar.className='pass-card';
    bar.innerHTML=`<div class="staff-offline-row"><div><strong id="staffOfflineState">${tr('online')}</strong><div id="staffOfflineDetail" class="pass-muted"></div></div><div class="staff-offline-controls"><div class="pass-muted">${tr('title')}</div><button id="staffOfflinePrepare" class="pass-btn secondary" type="button">${tr('prepare')}</button><button id="staffOfflineSync" class="pass-btn secondary" type="button">${tr('sync')}</button></div></div><div id="staffOfflineMessage" class="pass-muted"></div>`;
    workspace.prepend(bar);
    const style=document.createElement('style');
    style.textContent='.staff-offline-row{display:flex;gap:14px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}.staff-offline-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#staffOfflineBar.offline{border-color:#f59e0b}#staffOfflineBar.expired{border-color:#ef4444}#staffOfflineState{letter-spacing:.06em}';
    document.head.appendChild(style);
    document.getElementById('staffOfflinePrepare')?.addEventListener('click',()=>prepare().catch(()=>{}));
    document.getElementById('staffOfflineSync')?.addEventListener('click',async()=>{
      try{
        await sync();
        if(navigator.onLine!==false)await prepare({quiet:true,skipSync:true});
      }catch{}
    });
  }

  async function updateUi(message=null,kind='info'){
    const bar=document.getElementById('staffOfflineBar');
    if(!bar)return;
    const state=document.getElementById('staffOfflineState');
    const detail=document.getElementById('staffOfflineDetail');
    const msg=document.getElementById('staffOfflineMessage');
    const actions=await allActions().catch(()=>[]);
    const pending=actions.filter(a=>a.state!=='failed').length;
    const failed=actions.filter(a=>a.state==='failed').length;
    const m=mode();
    bar.classList.toggle('offline',m==='offline');
    bar.classList.toggle('expired',m==='expired');

    if(m==='offline')state.textContent='🟠 '+tr('offline');
    else if(m==='expired')state.textContent='🔴 '+tr('expired');
    else state.textContent='🟢 '+tr('online');

    let text=current?.snapshot?tr('ready'):tr('notReady');
    if(current?.offline?.expires_at){
      const remain=Math.max(0,Number(current.offline.expires_at)-serverNowSec());
      text+=` · ${formatRemaining(remain)} ${tr('remaining')}`;
    }
    text+=` · ${pending} ${tr('queued')}`;
    if(failed)text+=` · ${failed} ${tr('conflicts')}`;
    if(m==='expired')text+=` · ${tr('readOnly')}`;
    detail.textContent=text;

    if(message!==null){
      msg.textContent=message;
      msg.className=kind==='error'?'pass-notice pass-error':'pass-muted';
    }
    document.getElementById('staffOfflinePrepare')?.toggleAttribute('disabled',syncing||navigator.onLine===false);
    document.getElementById('staffOfflineSync')?.toggleAttribute('disabled',syncing||navigator.onLine===false||pending===0);
  }

  function formatRemaining(seconds){
    const m=Math.floor(seconds/60);
    const s=seconds%60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function registerServiceWorker(){
    if('serviceWorker'in navigator){
      navigator.serviceWorker.register('/sw-pass-staff.js',{scope:'/'}).catch(error=>console.warn('Staff offline service worker registration failed',error));
    }
  }

  window.AlbaPassOffline={
    init,prepare,sync,lookupToken,redeem,pendingPayments,confirmPayment,searchCustomers,recentActivity,
    canUseOffline,canWriteOffline,isNetworkError,mode,deviceId,storedZone,staffIdentity,tr
  };
})();
