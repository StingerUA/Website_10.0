(function(){
  const api=()=>window.AlbaPassApi;
  const locale=()=>window.AlbaPassLocale||{t:key=>key};
  const t=(key,vars)=>locale().t(key,vars);
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
      gate.innerHTML=`<div class="pass-notice pass-error">${api().escapeHtml(t('adminDenied'))}</div>`;
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
    const body={code:data.code,name:data.name,venue:data.venue,timezone:data.timezone||'Europe/Istanbul',status:data.status||'draft',starts_at:toUnix(data.starts_at),ends_at:toUnix(data.ends_at)};
    out.textContent=t('eventCreating');
    try{
      const result=await api().request('/api/admin/pass/events',{method:'POST',body});
      out.innerHTML=t('eventCreated',{id:`<strong>${result.event_id}</strong>`,code:`<strong>${api().escapeHtml(result.code)}</strong>`});
      document.getElementById('offerEventId').value=result.event_id;
    }catch(error){out.textContent=t('error',{error:error.data?.error||error.message});}
  }

  async function createOffer(event){
    event.preventDefault();
    const form=event.currentTarget;
    const out=document.getElementById('offerResult');
    const data=Object.fromEntries(new FormData(form).entries());
    let entitlements;
    try{entitlements=parseEntitlements(data.entitlements);}catch(error){out.textContent=error.message;return;}
    const body={event_id:Number(data.event_id),product_slug:data.product_slug,title:data.title,description:data.description,price_amount:Number(data.price_amount),currency:'TRY',active:data.active==='on',entitlements};
    out.textContent=t('offerCreating');
    try{
      const result=await api().request('/api/admin/pass/offers',{method:'POST',body});
      out.innerHTML=t('offerCreated',{id:`<strong>${result.offer_id}</strong>`});
    }catch(error){out.textContent=t('error',{error:error.data?.error||error.message});}
  }

  function parseEntitlements(text){
    const lines=String(text||'').split('\n').map(line=>line.trim()).filter(Boolean);
    if(!lines.length)throw new Error(t('entitlementRequired'));
    return lines.map((line,index)=>{
      const [code,label,unit='use',quantity='1',day='']=line.split('|').map(value=>value.trim());
      if(!code||!label)throw new Error(t('entitlementInvalid',{line:index+1}));
      if(!['use','minute'].includes(unit))throw new Error(t('unitInvalid',{line:index+1}));
      const qty=Number.parseInt(quantity,10);
      if(!Number.isInteger(qty)||qty<=0)throw new Error(t('quantityInvalid',{line:index+1}));
      return {code,label,unit,quantity:qty,day_no:day?Number.parseInt(day,10):null};
    });
  }

  async function setRole(event){
    event.preventDefault();
    const form=event.currentTarget;
    const out=document.getElementById('roleResult');
    const data=Object.fromEntries(new FormData(form).entries());
    out.textContent=t('roleUpdating');
    try{
      const result=await api().request('/api/admin/pass/roles',{method:'POST',body:{email:data.email,role:data.role,enabled:data.enabled==='true'}});
      out.textContent=t('roleResult',{email:result.email,role:result.role,state:result.enabled?t('enabled'):t('disabled')});
    }catch(error){out.textContent=t('error',{error:error.data?.error||error.message});}
  }

  function toUnix(value){
    if(!value)return null;
    const ms=new Date(value).getTime();
    return Number.isFinite(ms)?Math.floor(ms/1000):null;
  }
})();
