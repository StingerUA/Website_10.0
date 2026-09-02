(function(){
  const API_BASE='https://api.albaspace.com.tr';
  const TOKEN_KEY='albaspace_access_token';

  function authHeaders(extra={}){
    let token='';
    try{token=localStorage.getItem(TOKEN_KEY)||'';}catch{}
    return token?{...extra,Authorization:'Bearer '+token}:extra;
  }

  async function request(path,options={}){
    const init={credentials:'include',...options};
    init.headers=authHeaders(options.headers||{});
    if(init.body&&typeof init.body!=='string'){
      init.headers={'Content-Type':'application/json',...init.headers};
      init.body=JSON.stringify(init.body);
    }
    const response=await fetch(API_BASE+path,init);
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(data.error||('HTTP_'+response.status));
      error.status=response.status;
      error.data=data;
      throw error;
    }
    return data;
  }

  function requestId(prefix='req'){
    const random=crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36);
    return prefix+':'+random;
  }

  function money(amount,currency='TRY'){
    try{return new Intl.NumberFormat('tr-TR',{style:'currency',currency,maximumFractionDigits:0}).format(Number(amount||0));}
    catch{return `${Number(amount||0)} ${currency}`;}
  }

  function dateTime(value){
    const n=Number(value||0);
    if(!n)return '—';
    try{return new Date(n*1000).toLocaleString('tr-TR',{dateStyle:'medium',timeStyle:'short'});}catch{return String(value);}
  }

  function escapeHtml(value){
    return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  window.AlbaPassApi={API_BASE,request,requestId,money,dateTime,escapeHtml};
})();
