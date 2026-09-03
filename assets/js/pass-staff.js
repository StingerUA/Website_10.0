(function(){
  const api=()=>window.AlbaPassApi;
  let currentToken='';
  let cameraStream=null;
  let scanTimer=null;
  let detector=null;

  document.addEventListener('DOMContentLoaded',init);

  async function init(){
    bindTabs();
    bindScanner();
    bindSearch();
    try{
      const me=await api().request('/api/staff/me');
      document.getElementById('staffIdentity').textContent=`${me.user.name||me.user.email} · ${me.roles.join(', ')}`;
      await Promise.all([loadPending(),loadRecent()]);
    }catch(error){
      document.getElementById('staffGate').innerHTML=`<div class="pass-notice pass-error">Bu hesap ALBA Space personel paneline erişemiyor. ${api().escapeHtml(error.data?.error||error.message)}</div>`;
      document.getElementById('staffWorkspace').hidden=true;
    }
  }

  function bindTabs(){
    document.querySelectorAll('[data-staff-tab]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('.staff-panel').forEach(panel=>panel.classList.remove('active'));
      document.getElementById(button.dataset.staffTab)?.classList.add('active');
      if(button.dataset.staffTab!=='scannerPanel')stopCamera();
      if(button.dataset.staffTab==='paymentsPanel')loadPending();
      if(button.dataset.staffTab==='recentPanel')loadRecent();
    }));
  }

  function bindScanner(){
    document.getElementById('startCamera')?.addEventListener('click',startCamera);
    document.getElementById('stopCamera')?.addEventListener('click',stopCamera);
    document.getElementById('manualLookup')?.addEventListener('submit',event=>{
      event.preventDefault();
      const token=document.getElementById('manualToken').value.trim();
      if(token)lookupToken(token);
    });
  }

  async function startCamera(){
    const status=document.getElementById('scannerStatus');
    stopCamera();
    if(!navigator.mediaDevices?.getUserMedia){status.textContent='Bu tarayıcı kamera erişimini desteklemiyor.';return;}
    if(!('BarcodeDetector' in window)){
      status.textContent='Bu tarayıcı yerleşik QR taramayı desteklemiyor. Aşağıdaki manuel Pass kodu alanını kullanın.';
      return;
    }
    try{
      detector=new BarcodeDetector({formats:['qr_code']});
      cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      const video=document.getElementById('staffVideo');
      video.srcObject=cameraStream;
      await video.play();
      status.textContent='QR kameraya gösterin…';
      scanTimer=setInterval(scanFrame,450);
    }catch(error){status.textContent='Kamera açılamadı: '+error.message;stopCamera();}
  }

  async function scanFrame(){
    const video=document.getElementById('staffVideo');
    if(!detector||!video||video.readyState<2)return;
    try{
      const codes=await detector.detect(video);
      const value=codes?.[0]?.rawValue;
      if(value){
        stopCamera();
        document.getElementById('scannerStatus').textContent='QR bulundu. Pass doğrulanıyor…';
        await lookupToken(value);
      }
    }catch{}
  }

  function stopCamera(){
    if(scanTimer){clearInterval(scanTimer);scanTimer=null;}
    if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}
    const video=document.getElementById('staffVideo');
    if(video)video.srcObject=null;
  }

  async function lookupToken(token){
    const root=document.getElementById('scanResult');
    currentToken=token;
    root.innerHTML='<div class="pass-empty">Pass doğrulanıyor…</div>';
    try{
      const data=await api().request('/api/staff/pass/lookup',{method:'POST',body:{token}});
      renderPass(root,data.pass);
      const manual=document.getElementById('manualToken');if(manual)manual.value='';
    }catch(error){
      currentToken='';
      root.innerHTML=`<div class="pass-notice pass-error">Geçersiz veya bulunamayan Pass: ${api().escapeHtml(error.data?.error||error.message)}</div>`;
    }
  }

  function renderPass(root,pass){
    const active=pass.status==='active'&&pass.payment_status==='confirmed';
    const rights=(pass.entitlements||[]).map(ent=>{
      const available=active&&ent.status==='available'&&Number(ent.remaining_quantity)>0;
      const qty=ent.unit==='minute'?`${ent.remaining_quantity} dk`:`${ent.remaining_quantity}/${ent.total_quantity}`;
      const amountInput=ent.unit==='minute'&&available?`<label style="max-width:110px">Dakika<input class="redeemAmount" type="number" min="1" max="${Number(ent.remaining_quantity)}" value="${Math.min(5,Number(ent.remaining_quantity))}"></label>`:'';
      return `<div class="pass-card staff-entitlement">
        <div><strong>${api().escapeHtml(ent.label)}</strong>${ent.day_no?`<div class="pass-muted">Gün ${ent.day_no}</div>`:''}<div class="pass-muted">Kalan: ${qty}</div></div>
        <div class="pass-actions">${amountInput}<button class="pass-btn" data-redeem="${api().escapeHtml(ent.id)}" ${available?'':'disabled'}>${available?'KULLAN':'KULLANILDI'}</button></div>
      </div>`;
    }).join('');
    root.innerHTML=`
      <article class="pass-card">
        <span class="pass-badge ${active?'ok':'bad'}">${active?'GEÇERLİ':'GEÇERSİZ / PASİF'}</span>
        <h2>${api().escapeHtml(pass.title||pass.event_name||'ALBA Space Pass')}</h2>
        <p><strong>${api().escapeHtml(pass.name||'')}</strong><br>${api().escapeHtml(pass.email||'')}</p>
        <p class="pass-muted">Pass: ${api().escapeHtml(pass.id)}<br>Sipariş: ${api().escapeHtml(pass.order_id)}</p>
        <p>Ödeme: <strong>${api().escapeHtml(pass.payment_method||'')} · ${api().escapeHtml(pass.payment_status||'')}</strong></p>
      </article>
      <div class="pass-section"><h3>Kullanılabilir haklar</h3>${rights||'<div class="pass-empty">Bu Pass için entitlement bulunamadı.</div>'}</div>`;
    root.querySelectorAll('[data-redeem]').forEach(button=>button.addEventListener('click',()=>redeem(button)));
  }

  async function redeem(button){
    if(!currentToken)return;
    const entitlementId=button.dataset.redeem;
    const parent=button.closest('.staff-entitlement');
    const input=parent?.querySelector('.redeemAmount');
    const amount=input?Math.max(1,Number.parseInt(input.value||'1',10)||1):1;
    if(!confirm(`Bu hakkı şimdi kullanmak istediğinizi onaylıyor musunuz? Miktar: ${amount}`))return;
    button.disabled=true;
    const old=button.textContent;button.textContent='İŞLENİYOR…';
    try{
      await api().request('/api/staff/pass/redeem',{method:'POST',body:{token:currentToken,entitlement_id:entitlementId,amount,request_id:api().requestId('redeem')}});
      await lookupToken(currentToken);
      await loadRecent();
    }catch(error){
      alert('Kullanım kaydedilemedi: '+(error.data?.error||error.message));
      button.disabled=false;button.textContent=old;
    }
  }

  async function loadPending(){
    const root=document.getElementById('pendingPayments');
    if(!root)return;
    root.innerHTML='<div class="pass-empty">Bekleyen ödemeler yükleniyor…</div>';
    try{
      const data=await api().request('/api/staff/payments/pending');
      if(!data.payments?.length){root.innerHTML='<div class="pass-card pass-empty">Bekleyen ödeme yok.</div>';return;}
      root.innerHTML='';
      for(const payment of data.payments){
        const row=document.createElement('article');row.className='pass-card staff-payment';
        row.innerHTML=`<div><span class="pass-badge warn">${payment.method==='cash'?'NAKİT':'IBAN'} BEKLİYOR</span><h3>${api().escapeHtml(payment.title||payment.product_slug||'Experience')}</h3><p>${api().escapeHtml(payment.name||'')} · ${api().escapeHtml(payment.email)}</p><p><strong>${api().money(payment.amount,payment.currency)}</strong> · <span class="payment-ref">${api().escapeHtml(payment.reference_code)}</span></p></div><button class="pass-btn" data-confirm-payment="${api().escapeHtml(payment.id)}">ÖDEMEYİ ONAYLA</button>`;
        row.querySelector('[data-confirm-payment]').addEventListener('click',event=>confirmPayment(payment,event.currentTarget));
        root.appendChild(row);
      }
    }catch(error){root.innerHTML=`<div class="pass-notice pass-error">Ödemeler yüklenemedi: ${api().escapeHtml(error.message)}</div>`;}
  }

  async function confirmPayment(payment,button){
    if(!confirm(`${payment.email}\n${payment.title}\n${api().money(payment.amount,payment.currency)}\n\nÖdemeyi aldığınızı onaylıyor musunuz?`))return;
    let bankReference='';
    if(payment.method==='iban')bankReference=prompt('Banka işlem referansı (varsa):','')||'';
    const note=prompt('Not (isteğe bağlı):','')||'';
    button.disabled=true;button.textContent='ONAYLANIYOR…';
    try{
      await api().request(`/api/staff/payments/${encodeURIComponent(payment.id)}/confirm`,{method:'POST',body:{request_id:api().requestId('payment'),bank_reference:bankReference,note}});
      await Promise.all([loadPending(),loadRecent()]);
    }catch(error){alert('Ödeme onaylanamadı: '+(error.data?.error||error.message));button.disabled=false;button.textContent='ÖDEMEYİ ONAYLA';}
  }

  function bindSearch(){
    document.getElementById('customerSearchForm')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const q=document.getElementById('customerQuery').value.trim();
      const root=document.getElementById('customerResults');
      if(q.length<2){root.innerHTML='<div class="pass-muted">En az 2 karakter yazın.</div>';return;}
      root.innerHTML='<div class="pass-empty">Aranıyor…</div>';
      try{
        const data=await api().request('/api/staff/customers/search?q='+encodeURIComponent(q));
        if(!data.customers?.length){root.innerHTML='<div class="pass-card pass-empty">Müşteri bulunamadı.</div>';return;}
        root.innerHTML=data.customers.map(customer=>`<article class="pass-card"><h3>${api().escapeHtml(customer.name||customer.email)}</h3><p>${api().escapeHtml(customer.email)}</p><ul class="pass-list">${(customer.orders||[]).map(order=>`<li><span>${api().escapeHtml(order.title||order.product_slug||order.id)}<br><small>${api().escapeHtml(order.id)}</small></span><strong>${api().escapeHtml(order.payment_status)} · ${api().money(order.total_amount,order.currency)}</strong></li>`).join('')||'<li>Sipariş yok</li>'}</ul></article>`).join('');
      }catch(error){root.innerHTML=`<div class="pass-notice pass-error">Arama başarısız: ${api().escapeHtml(error.message)}</div>`;}
    });
  }

  async function loadRecent(){
    const root=document.getElementById('recentActivity');
    if(!root)return;
    try{
      const data=await api().request('/api/staff/recent');
      if(!data.events?.length){root.innerHTML='<div class="pass-card pass-empty">Henüz işlem yok.</div>';return;}
      root.innerHTML=data.events.map(event=>`<div class="pass-card staff-log"><strong>${api().escapeHtml(event.event_type)}</strong> · ${api().escapeHtml(event.actor_name||event.actor_email||'system')}<br><span class="pass-muted">${api().escapeHtml(event.target_type)} ${api().escapeHtml(event.target_id)}</span><br><time>${api().dateTime(event.created_at)}</time></div>`).join('');
    }catch(error){root.innerHTML=`<div class="pass-notice pass-error">Aktivite yüklenemedi: ${api().escapeHtml(error.message)}</div>`;}
  }
})();
