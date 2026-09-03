(function(){
  const api=()=>window.AlbaPassApi;
  document.addEventListener('DOMContentLoaded',init);

  async function init(){
    const gate=document.getElementById('adminGate');
    const workspace=document.getElementById('adminWorkspace');
    try{
      const me=await api().request('/api/staff/me');
      if(!me.roles?.some(role=>role==='admin'||role==='superadmin'))throw Object.assign(new Error('ADMIN_REQUIRED'),{status:403});
      document.getElementById('adminIdentity').textContent=`${me.user.name||me.user.email} · ${me.roles.join(', ')}`;
      bindForms();
    }catch(error){
      gate.innerHTML='<div class="pass-notice pass-error">Bu hesap Pass yönetimi için admin yetkisine sahip değil.</div>';
      workspace.hidden=true;
    }
  }

  function bindForms(){
    document.getElementById('eventForm')?.addEventListener('submit',createEvent);
    document.getElementById('offerForm')?.addEventListener('submit',createOffer);
    document.getElementById('roleForm')?.addEventListener('submit',setRole);
  }

  async function createEvent(event){
    event.preventDefault();
    const form=event.currentTarget;
    const out=document.getElementById('eventResult');
    const data=Object.fromEntries(new FormData(form).entries());
    const body={
      code:data.code,
      name:data.name,
      venue:data.venue,
      timezone:data.timezone||'Europe/Istanbul',
      status:data.status||'draft',
      starts_at:toUnix(data.starts_at),
      ends_at:toUnix(data.ends_at)
    };
    out.textContent='Etkinlik oluşturuluyor…';
    try{
      const result=await api().request('/api/admin/pass/events',{method:'POST',body});
      out.innerHTML=`Etkinlik oluşturuldu. ID: <strong>${result.event_id}</strong> · Kod: <strong>${api().escapeHtml(result.code)}</strong>`;
      document.getElementById('offerEventId').value=result.event_id;
    }catch(error){out.textContent='Hata: '+(error.data?.error||error.message);}
  }

  async function createOffer(event){
    event.preventDefault();
    const form=event.currentTarget;
    const out=document.getElementById('offerResult');
    const data=Object.fromEntries(new FormData(form).entries());
    let entitlements;
    try{entitlements=parseEntitlements(data.entitlements);}catch(error){out.textContent=error.message;return;}
    const body={
      event_id:Number(data.event_id),
      product_slug:data.product_slug,
      title:data.title,
      description:data.description,
      price_amount:Number(data.price_amount),
      currency:'TRY',
      active:data.active==='on',
      entitlements
    };
    out.textContent='Paket oluşturuluyor…';
    try{
      const result=await api().request('/api/admin/pass/offers',{method:'POST',body});
      out.innerHTML=`Paket oluşturuldu. Offer ID: <strong>${result.offer_id}</strong>`;
    }catch(error){out.textContent='Hata: '+(error.data?.error||error.message);}
  }

  function parseEntitlements(text){
    const lines=String(text||'').split('\n').map(line=>line.trim()).filter(Boolean);
    if(!lines.length)throw new Error('En az bir entitlement satırı gerekli.');
    return lines.map((line,index)=>{
      const [code,label,unit='use',quantity='1',day='']=line.split('|').map(value=>value.trim());
      if(!code||!label)throw new Error(`Entitlement satırı ${index+1} geçersiz.`);
      if(!['use','minute'].includes(unit))throw new Error(`Satır ${index+1}: unit use veya minute olmalı.`);
      const qty=Number.parseInt(quantity,10);
      if(!Number.isInteger(qty)||qty<=0)throw new Error(`Satır ${index+1}: quantity geçersiz.`);
      return {code,label,unit,quantity:qty,day_no:day?Number.parseInt(day,10):null};
    });
  }

  async function setRole(event){
    event.preventDefault();
    const form=event.currentTarget;
    const out=document.getElementById('roleResult');
    const data=Object.fromEntries(new FormData(form).entries());
    out.textContent='Rol güncelleniyor…';
    try{
      const result=await api().request('/api/admin/pass/roles',{method:'POST',body:{email:data.email,role:data.role,enabled:data.enabled==='true'}});
      out.textContent=`${result.email}: ${result.role} → ${result.enabled?'aktif':'iptal'}`;
    }catch(error){out.textContent='Hata: '+(error.data?.error||error.message);}
  }

  function toUnix(value){
    if(!value)return null;
    const ms=new Date(value).getTime();
    return Number.isFinite(ms)?Math.floor(ms/1000):null;
  }
})();
