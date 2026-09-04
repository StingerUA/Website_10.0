(function(){
  const raw=(document.documentElement.lang||'tr').toLowerCase();
  const lang=raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':'tr';
  const copy={
    tr:{title:'ALBA Space Experience Pass',desc:'Etkinlik deneyimlerini ayır, ödeme durumunu takip et ve aktif QR Pass’lerini görüntüle.',buy:'Experience Pass al',mine:'QR Pass’lerim',staffTitle:'Personel araçları',staffDesc:'Ödeme onayı, müşteri arama ve QR entitlement kullanımı.',staff:'Personel paneli',admin:'Pass yönetimi'},
    en:{title:'ALBA Space Experience Pass',desc:'Reserve event experiences, track payment status and open your active QR Passes.',buy:'Get Experience Pass',mine:'My QR Passes',staffTitle:'Staff tools',staffDesc:'Confirm payments, search customers and redeem QR entitlements.',staff:'Staff panel',admin:'Pass administration'},
    ru:{title:'ALBA Space Experience Pass',desc:'Бронируйте впечатления на мероприятиях, следите за оплатой и открывайте активные QR Pass.',buy:'Приобрести Experience Pass',mine:'Мои QR Pass',staffTitle:'Инструменты сотрудника',staffDesc:'Подтверждение оплаты, поиск клиентов и списание прав по QR.',staff:'Панель сотрудника',admin:'Управление Pass'}
  }[lang];
  const prefix=lang==='en'?'/eng':lang==='ru'?'/rus':'';

  document.addEventListener('DOMContentLoaded',init);

  async function init(){
    const main=document.querySelector('.account-main');
    const first=main?.querySelector('.account-card');
    if(!main||!first)return;

    const customer=document.createElement('section');
    customer.className='account-card account-section account-pass-section';
    customer.innerHTML=`<h2>${esc(copy.title)}</h2><p>${esc(copy.desc)}</p><div class="account-pass-actions"><a class="account-pass-link primary" href="${prefix}/experience-pass.html">🎟️ ${esc(copy.buy)}</a><a class="account-pass-link" href="${prefix}/passes.html">📱 ${esc(copy.mine)}</a></div>`;
    first.insertAdjacentElement('afterend',customer);

    try{
      if(!window.AlbaPassApi)return;
      const me=await window.AlbaPassApi.request('/api/staff/me');
      const roles=new Set(me.roles||[]);
      if(!['employee','admin','superadmin'].some(role=>roles.has(role)))return;
      const staff=document.createElement('section');
      staff.className='account-card account-section account-pass-section staff-access';
      const adminLink=(roles.has('admin')||roles.has('superadmin'))?`<a class="account-pass-link" href="${prefix}/admin-pass.html">⚙️ ${esc(copy.admin)}</a>`:'';
      staff.innerHTML=`<h2>${esc(copy.staffTitle)}</h2><p>${esc(copy.staffDesc)}</p><div class="account-pass-actions"><a class="account-pass-link primary" href="${prefix}/staff-pass.html">🧑‍🚀 ${esc(copy.staff)}</a>${adminLink}</div>`;
      customer.insertAdjacentElement('afterend',staff);
    }catch{}
  }

  function esc(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
})();
