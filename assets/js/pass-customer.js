(function(){
  const api=()=>window.AlbaPassApi;
  const locale=()=>window.AlbaPassLocale||{lang:'tr',t:key=>key,productTitle:(slug,fallback)=>fallback||slug,productDescription:(slug,fallback)=>fallback||'',passStatus:status=>String(status||'').toUpperCase(),entitlementLabel:(ent,fallback)=>fallback||ent?.label||ent?.code};
  const t=(key,vars)=>locale().t(key,vars);
  const passesPath=()=>locale().lang==='en'?'/eng/passes.html':locale().lang==='ru'?'/rus/passes.html':'/passes.html';
  const ART_INDEX=new Map([['sun-observation',0],['moon-observation',1],['vr-mission-iss',2],['telescope-vr-1day',3],['telescope-vr-2day',4]]);

  document.addEventListener('DOMContentLoaded',()=>{
    const page=document.body.dataset.passPage;
    if(page==='offers')loadOffers();
    if(page==='my-passes')loadMyPasses();
  });

  function productArt(slug){
    const lang=locale().lang;
    const key=String(slug||'');
    const index=ART_INDEX.get(key);
    if((lang!=='ru'&&lang!=='tr')||index===undefined)return null;
    return {src:`/assets/images/pass/${lang}/pass-cards.webp`,position:index*25};
  }

  function productArtMarkup(slug,title){
    const art=productArt(slug);
    if(!art)return '';
    const label=api().escapeHtml(title||'ALBA Space');
    return `<div class="pass-product-art" role="img" aria-label="${label}" style="--pass-art:url('${art.src}');--pass-art-y:${art.position}%"></div>`;
  }

  function setProductCard(card,slug,title,content,extraClass=''){
    const art=productArtMarkup(slug,title);
    if(!art){
      card.className=`pass-card${extraClass?` ${extraClass}`:''}`;
      card.innerHTML=content;
      return false;
    }
    card.className=`pass-card pass-product-card${extraClass?` ${extraClass}`:''}`;
    card.innerHTML=`${art}<div class="pass-card-body">${content}</div>`;
    return true;
  }

  function qrTokenLabel(){
    return locale().lang==='ru'?'Технический QR-токен':locale().lang==='tr'?'Teknik QR tokeni':'QR token';
  }

  async function loadOffers(){
    const root=document.getElementById('passOffers');
    const status=document.getElementById('passStatus');
    if(!root)return;
    root.innerHTML=`<div class="pass-empty">${api().escapeHtml(t('loadingOffers'))}</div>`;
    try{
      const event=new URLSearchParams(location.search).get('event');
      const data=await api().request('/api/pass/offers'+(event?'?event='+encodeURIComponent(event):''));
      if(!data.offers?.length){
        root.innerHTML=`<div class="pass-empty pass-card">${api().escapeHtml(t('noOffers'))}</div>`;
        return;
      }
      root.innerHTML='';
      for(const offer of data.offers){
        const card=document.createElement('article');
        const title=locale().productTitle(offer.product_slug,offer.title);
        const rights=(offer.entitlements||[]).map(ent=>`<li><span>${api().escapeHtml(locale().entitlementLabel(ent,ent.label))}</span><strong>${ent.quantity} ${ent.unit==='minute'?t('minuteShort'):'×'}</strong></li>`).join('');
        const content=`
          <span class="pass-badge">${api().escapeHtml(offer.event_name||'ALBA Space')}</span>
          <h2>${api().escapeHtml(title)}</h2>
          <p class="pass-muted">${api().escapeHtml(locale().productDescription(offer.product_slug,offer.description||''))}</p>
          <div class="pass-price">${api().money(offer.price_amount,offer.currency)}</div>
          <ul class="pass-list">${rights}</ul>
          <div class="pass-actions">
            <button class="pass-btn" data-method="cash">${api().escapeHtml(t('cashReserve'))}</button>
            <button class="pass-btn secondary" data-method="iban">${api().escapeHtml(t('ibanReserve'))}</button>
          </div>`;
        setProductCard(card,offer.product_slug,title,content,'pass-offer-card');
        card.querySelectorAll('[data-method]').forEach(button=>{
          button.addEventListener('click',()=>createOrder(offer,button.dataset.method,card,status));
        });
        root.appendChild(card);
      }
    }catch(error){
      root.innerHTML=`<div class="pass-notice pass-error">${api().escapeHtml(t('loadOffersError'))}</div>`;
      if(status)status.textContent=error.message;
    }
  }

  async function createOrder(offer,method,card,status){
    const buttons=[...card.querySelectorAll('button')];
    buttons.forEach(b=>b.disabled=true);
    if(status)status.textContent=t('orderCreating');
    try{
      const data=await api().request('/api/pass/orders',{method:'POST',body:{offer_id:offer.id,payment_method:method}});
      if(status)status.textContent=t('orderCreated',{id:data.order.id});
      location.href=passesPath()+'?created='+encodeURIComponent(data.order.id);
    }catch(error){
      buttons.forEach(b=>b.disabled=false);
      if(error.status===401){
        if(status)status.textContent=t('loginRequired');
        if(typeof window.login==='function')window.login({source:'alba-pass'});
        return;
      }
      if(status)status.textContent=t('orderCreateError',{error:error.data?.error||error.message});
    }
  }

  async function loadMyPasses(){
    const orderRoot=document.getElementById('myOrders');
    const passRoot=document.getElementById('myPasses');
    const status=document.getElementById('passStatus');
    if(orderRoot)orderRoot.innerHTML=`<div class="pass-empty">${api().escapeHtml(t('ordersLoading'))}</div>`;
    if(passRoot)passRoot.innerHTML=`<div class="pass-empty">${api().escapeHtml(t('passesLoading'))}</div>`;
    try{
      const data=await api().request('/api/pass/my');
      renderOrders(orderRoot,data.orders||[],data.iban||{});
      renderPasses(passRoot,data.passes||[]);
    }catch(error){
      if(error.status===401){
        const html=`<div class="pass-card pass-empty">${api().escapeHtml(t('loginPasses'))}<div class="pass-actions" style="justify-content:center"><button id="passLogin" class="pass-btn">${api().escapeHtml(t('login'))}</button></div></div>`;
        if(orderRoot)orderRoot.innerHTML=html;
        if(passRoot)passRoot.innerHTML='';
        setTimeout(()=>document.getElementById('passLogin')?.addEventListener('click',()=>window.login?.({source:'my-passes'})),0);
        return;
      }
      if(status)status.textContent=t('passLoadError',{error:error.message});
    }
  }

  function renderOrders(root,orders,iban){
    if(!root)return;
    if(!orders.length){root.innerHTML=`<div class="pass-card pass-empty">${api().escapeHtml(t('noOrders'))}</div>`;return;}
    root.innerHTML='';
    for(const order of orders){
      const pending=order.payment_status==='pending';
      const card=document.createElement('article');
      const title=locale().productTitle(order.product_slug,order.title||order.product_slug||'ALBA Space Experience');
      let paymentHelp='';
      if(pending&&order.payment_method==='cash'){
        paymentHelp=`<div class="pass-notice">${api().escapeHtml(t('cashPendingHelp'))}</div>`;
      }else if(pending&&order.payment_method==='iban'){
        paymentHelp=`<div class="pass-notice"><strong>${api().escapeHtml(t('ibanPending'))}</strong><br>${api().escapeHtml(t('reference'))}: <span class="payment-ref">${api().escapeHtml(order.reference_code)}</span>${iban.bank_name?`<br>${api().escapeHtml(t('bank'))}: ${api().escapeHtml(iban.bank_name)}`:''}${iban.iban?`<br>${api().escapeHtml(t('iban'))}: <strong>${api().escapeHtml(iban.iban)}</strong>`:''}${iban.account_name?`<br>${api().escapeHtml(t('recipient'))}: ${api().escapeHtml(iban.account_name)}`:''}</div>`;
      }
      const content=`
        <span class="pass-badge ${pending?'warn':'ok'}">${api().escapeHtml(pending?t('paymentPending'):t('paymentConfirmed'))}</span>
        <h3>${api().escapeHtml(title)}</h3>
        <p class="pass-muted">${api().escapeHtml(t('order'))}: ${api().escapeHtml(order.id)}</p>
        <div class="pass-price">${api().money(order.total_amount,order.currency)}</div>
        <p>${api().escapeHtml(t('payment'))}: <strong>${api().escapeHtml(order.payment_method==='cash'?t('cash'):t('bankTransfer'))}</strong></p>
        <p>${api().escapeHtml(t('reference'))}: <span class="payment-ref">${api().escapeHtml(order.reference_code)}</span></p>
        ${paymentHelp}`;
      setProductCard(card,order.product_slug,title,content,'pass-order-card');
      root.appendChild(card);
    }
  }

  function renderPasses(root,passes){
    if(!root)return;
    const visible=passes.filter(pass=>pass.status==='active'||pass.status==='revoked'||pass.status==='expired');
    if(!visible.length){root.innerHTML=`<div class="pass-card pass-empty">${api().escapeHtml(t('noActivePass'))}</div>`;return;}
    root.innerHTML='';
    for(const pass of visible){
      const card=document.createElement('article');
      const active=pass.status==='active';
      const title=locale().productTitle(pass.product_slug,pass.title||pass.event_name||'ALBA Space Pass');
      const rights=(pass.entitlements||[]).map(ent=>{
        const available=ent.status==='available'&&Number(ent.remaining_quantity)>0;
        const qty=ent.unit==='minute'?`${ent.remaining_quantity} ${t('minuteShort')}`:`${ent.remaining_quantity}/${ent.total_quantity}`;
        return `<li><span>${api().escapeHtml(locale().entitlementLabel(ent,ent.label))}</span><strong>${available?'✓ ':'✕ '}${qty}</strong></li>`;
      }).join('');
      const qrId='qr-'+pass.id;
      const qrBlock=active&&pass.qr_ready?`
        <section class="pass-ticket-qr" aria-label="ALBA Space QR Pass">
          <div class="pass-ticket-qr-title">QR PASS</div>
          <div id="${qrId}" class="pass-qr"></div>
          <details class="pass-token-details">
            <summary>${api().escapeHtml(qrTokenLabel())}</summary>
            <div class="pass-token">${api().escapeHtml(pass.qr_payload)}</div>
          </details>
        </section>`:'';
      const content=`
        <span class="pass-badge ${active?'ok':'bad'}">${api().escapeHtml(locale().passStatus(pass.status))}</span>
        <h3>${api().escapeHtml(title)}</h3>
        <p class="pass-muted">Pass: ${api().escapeHtml(pass.id)}</p>
        ${qrBlock}
        ${active&&!pass.qr_ready?`<div class="pass-notice pass-error">${api().escapeHtml(t('qrMissing'))}</div>`:''}
        <ul class="pass-list">${rights}</ul>`;
      setProductCard(card,pass.product_slug,title,content,'pass-owned-card');
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
      root.innerHTML=`<span style="color:#111;text-align:center;padding:20px">${api().escapeHtml(t('qrRendererMissing'))}</span>`;
    }
  }
})();
