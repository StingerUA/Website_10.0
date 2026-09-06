(function(){
  'use strict';

  const API='https://api.albaspace.com.tr';
  const TOKEN_KEY='albaspace_access_token';
  const button=document.querySelector('[data-account-logout]');
  if(!button)return;

  const path=window.location.pathname||'/';
  const redirect=path.startsWith('/rus/')?'/rus/account-menu.html':path.startsWith('/eng/')?'/eng/account-menu.html':path.startsWith('/ar/')?'/ar/account-menu.html':'/account-menu.html';

  function authHeaders(){
    try{
      const token=localStorage.getItem(TOKEN_KEY)||'';
      return token?{Authorization:'Bearer '+token}:{};
    }catch(_){return {};}
  }

  function clearLocalAuth(){
    try{
      localStorage.removeItem('user');
      localStorage.removeItem('albamen_session_id');
      localStorage.removeItem(TOKEN_KEY);
    }catch(_){}
    document.cookie='user_id=; Max-Age=0; path=/;';
    document.cookie='albamen_session_id=; Max-Age=0; path=/;';
    document.cookie='albaspace_session=; Max-Age=0; path=/; SameSite=None; Secure;';
  }

  button.addEventListener('click',async function(){
    if(button.disabled)return;
    button.disabled=true;
    button.setAttribute('aria-busy','true');
    button.textContent='…';
    const headers=authHeaders();

    try{
      await fetch(API+'/logout',{
        method:'POST',
        credentials:'include',
        mode:'cors',
        headers
      });
    }catch(_){}

    clearLocalAuth();
    window.location.replace(redirect);
  });
})();
