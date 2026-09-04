(function(){
  const api=()=>window.AlbaPassApi;

  document.addEventListener('DOMContentLoaded',()=>{
    const page=document.body.dataset.passPage;
    if(page==='offers') loadOffers();
    if(page==='my-passes') loadMyPasses();
  });

  async function loadOffers(){
    const root=document.getElementById('passOffers');
    const status=document.getElementById('passStatus');
    if(!root)return;
    root.innerHTML='<div class="pass-empty">Deneyimler yükleniyor…</div>';
    try{
      const event=new URLSearchParams(location.search).get('event');
      const data=await api().request('/api/pass/offers'+(event?'?event='+encodeURIComponent(event):''));
      if(!data.offers?.length){
        root.innerHTML='<div class="pass-empty pass-card">Şu anda satışta aktif bir ALBA Space deneyimi yok.</div>';
        return;
      }
      root.innerHTML='';
      for(const offer of data.offers){
        const card=document.createElement('article');
        card.className='pass-card';
        const rights=(offer.entitlements||[]).map(ent=>`<li><span>${api().escapeHtml(ent.label)}</span><strong>${ent.quantity} ${ent.unit==='minute'?'dk':'×'}</strong></li>`).join('');
        card.innerHTML=`
          <span class="pass-badge">${api().escapeHtml(offer.event_name||'ALBA Space')}</span>
          <h2>${api().escapeHtml(offer.title)}</h2>
          <p class="pass-muted">${api().escapeHtml(offer.description||'')}</p>
          <div class="pass-price">${api().money(offer.price_amount,offer.currency)}</div>
          <ul class="pass-list">${rights}</ul>
          <div class="pass-actions">
            <button class="pass-btn" data-method="cash">Nakit ile ayır</button>
            <button class="pass-btn secondary" data-method="iban">IBAN ile ayır</button>
          </div>`;
        card.querySelectorAll('[data-method]').forEach(button=>{
          button.addEventListener('click',()=>createOrder(offer,button.dataset.method,card,status));
        });
        root.appendChild(card);
      }
    }catch(error){
      root.innerHTML='<div class="pass-notice pass-error">Deneyimler yüklenemedi.</div>';
      if(status)status.textContent=error.message;
    }
  }

  async function createOrder(offer,method,card,status){
    const buttons=[...card.querySelectorAll('button')];
    buttons.forEach(b=>b.disabled=true);
    if(status)status.textContent='Sipariş oluşturuluyor…';
    try{
      const data=await api().request('/api/pass/orders',{method:'POST',body:{offer_id:offer.id,payment_method:method}});
      if(status)status.textContent=`Sipariş ${data.order.id} oluşturuldu. Ödeme onayı bekleniyor.`;
      location.href='/passes.html?created='+encodeURIComponent(data.order.id);
    }catch(error){
      buttons.forEach(b=>b.disabled=false);
      if(error.status===401){
        if(status)status.textContent='Devam etmek için hesabınıza giriş yapın.';
        if(typeof window.login==='function')window.login({source:'alba-pass'});
        return;
      }
      if(status)status.textContent='Sipariş oluşturulamadı: '+(error.data?.error||error.message);
    }
  }

  async function loadMyPasses(){
    const orderRoot=document.getElementById('myOrders');
    const passRoot=document.getElementById('myPasses');
    const status=document.getElementById('passStatus');
    if(orderRoot)orderRoot.innerHTML='<div class="pass-empty">Siparişler yükleniyor…</div>';
    if(passRoot)passRoot.innerHTML='<div class="pass-empty">Pass kayıtları yükleniyor…</div>';
    try{
      const data=await api().request('/api/pass/my');
      renderOrders(orderRoot,data.orders||[],data.iban||{});
      renderPasses(passRoot,data.passes||[]);
    }catch(error){
      if(error.status===401){
        const html='<div class="pass-card pass-empty">Pass kayıtlarınızı görmek için giriş yapın.<div class="pass-actions" style="justify-content:center"><button id="passLogin" class="pass-btn">Giriş yap</button></div></div>';
        if(orderRoot)orderRoot.innerHTML=html;
        if(passRoot)passRoot.innerHTML='';
        setTimeout(()=>document.getElementById('passLogin')?.addEventListener('click',()=>window.login?.({source:'my-passes'})),0);
        return;
      }
      if(status)status.textContent='Pass bilgileri yüklenemedi: '+error.message;
    }
  }

  function renderOrders(root,orders,iban){
    if(!root)return;
    if(!orders.length){root.innerHTML='<div class="pass-card pass-empty">Henüz bir ALBA Space siparişiniz yok.</div>';return;}
    root.innerHTML='';
    for(const order of orders){
      const pending=order.payment_status==='pending';
      const card=document.createElement('article');
      card.className='pass-card';
      let paymentHelp='';
      if(pending&&order.payment_method==='cash'){
        paymentHelp='<div class="pass-notice">Nakit ödemeniz ALBA Space çalışanı tarafından onaylandıktan sonra QR Pass aktif olur.</div>';
      }else if(pending&&order.payment_method==='iban'){
        paymentHelp=`<div class="pass-notice"><strong>IBAN transferi bekleniyor.</strong><br>Referans: <span class="payment-ref">${api().escapeHtml(order.reference_code)}</span>${iban.bank_name?`<br>Banka: ${api().escapeHtml(iban.bank_name)}`:''}${iban.iban?`<br>IBAN: <strong>${api().escapeHtml(iban.iban)}</strong>`:''}${iban.account_name?`<br>Alıcı: ${api().escapeHtml(iban.account_name)}`:''}</div>`;
      }
      card.innerHTML=`
        <span class="pass-badge ${pending?'warn':'ok'}">${pending?'Ödeme bekleniyor':'Ödeme onaylandı'}</span>
        <h3>${api().escapeHtml(order.title||order.product_slug||'ALBA Space Experience')}</h3>
        <p class="pass-muted">Sipariş: ${api().escapeHtml(order.id)}</p>
        <div class="pass-price">${api().money(order.total_amount,order.currency)}</div>
        <p>Ödeme: <strong>${order.payment_method==='cash'?'Nakit':'IBAN'}</strong></p>
        <p>Referans: <span class="payment-ref">${api().escapeHtml(order.reference_code)}</span></p>
        ${paymentHelp}`;
      root.appendChild(card);
    }
  }

  function renderPasses(root,passes){
    if(!root)return;
    const visible=passes.filter(pass=>pass.status==='active'||pass.status==='revoked'||pass.status==='expired');
    if(!visible.length){root.innerHTML='<div class="pass-card pass-empty">Aktif Pass henüz yok. Ödeme onaylandığında burada görünecek.</div>';return;}
    root.innerHTML='';
    for(const pass of visible){
      const card=document.createElement('article');
      card.className='pass-card';
      const active=pass.status==='active';
      const rights=(pass.entitlements||[]).map(ent=>{
        const available=ent.status==='available'&&Number(ent.remaining_quantity)>0;
        const qty=ent.unit==='minute'?`${ent.remaining_quantity} dk`:`${ent.remaining_quantity}/${ent.total_quantity}`;
        return `<li><span>${api().escapeHtml(ent.label)}${ent.day_no?` · Gün ${ent.day_no}`:''}</span><strong>${available?'✓ ':'✕ '}${qty}</strong></li>`;
      }).join('');
      const qrId='qr-'+pass.id;
      card.innerHTML=`
        <span class="pass-badge ${active?'ok':'bad'}">${api().escapeHtml(pass.status.toUpperCase())}</span>
        <h3>${api().escapeHtml(pass.title||pass.event_name||'ALBA Space Pass')}</h3>
        <p class="pass-muted">Pass: ${api().escapeHtml(pass.id)}</p>
        ${active&&pass.qr_ready?`<div id="${qrId}" class="pass-qr" aria-label="ALBA Space QR Pass"></div><div class="pass-token">${api().escapeHtml(pass.qr_payload)}</div>`:''}
        ${active&&!pass.qr_ready?'<div class="pass-notice pass-error">QR imza anahtarı henüz sunucuda yapılandırılmamış.</div>':''}
        <ul class="pass-list">${rights}</ul>`;
      root.appendChild(card);
      if(active&&pass.qr_ready)renderQr(qrId,pass.qr_payload);
    }
  }

  function renderQr(id,value){
    const root=document.getElementById(id);
    if(!root)return;
    if(typeof window.QRCode==='function'){
      root.innerHTML='';
      new window.QRCode(root,{text:value,width:236,height:236,correctLevel:window.QRCode.CorrectLevel.M});
    }else{
      root.innerHTML='<span style="color:#111;text-align:center;padding:20px">QR renderer yüklenemedi.<br>Pass kodunu personele gösterin.</span>';
    }
  }
})();
