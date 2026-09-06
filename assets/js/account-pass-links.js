(function(){
  const raw=(document.documentElement.lang||'tr').toLowerCase();
  const lang=raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':raw.startsWith('ar')?'ar':'tr';
  const copy={
    tr:{title:'ALBA Space Experience Pass',desc:'Etkinlik deneyimlerini ayır, ödeme durumunu takip et ve aktif QR Pass’lerini görüntüle.',buy:'Experience Pass al',mine:'QR Pass’lerim',staffTitle:'Personel araçları',staffDesc:'Ödeme onayı, müşteri arama ve QR entitlement kullanımı.',staff:'Personel paneli',admin:'Pass yönetimi',logout:'Hesaptan çık'},
    en:{title:'ALBA Space Experience Pass',desc:'Reserve event experiences, track payment status and open your active QR Passes.',buy:'Get Experience Pass',mine:'My QR Passes',staffTitle:'Staff tools',staffDesc:'Confirm payments, search customers and redeem QR entitlements.',staff:'Staff panel',admin:'Pass administration',logout:'Sign out of account'},
    ru:{title:'ALBA Space Experience Pass',desc:'Бронируйте впечатления на мероприятиях, следите за оплатой и открывайте активные QR Pass.',buy:'Приобрести Experience Pass',mine:'Мои QR Pass',staffTitle:'Инструменты сотрудника',staffDesc:'Подтверждение оплаты, поиск клиентов и списание прав по QR.',staff:'Панель сотрудника',admin:'Управление Pass',logout:'Выйти из аккаунта'},
    ar:{title:'ALBA Space Experience Pass',desc:'احجز تجارب الفعاليات وتابع حالة الدفع وافتح تصاريح QR النشطة الخاصة بك.',buy:'احصل على Experience Pass',mine:'تصاريح QR الخاصة بي',staffTitle:'أدوات الموظفين',staffDesc:'تأكيد المدفوعات والبحث عن العملاء واستخدام صلاحيات QR.',staff:'لوحة الموظف',admin:'إدارة Pass',logout:'تسجيل الخروج من الحساب'}
  }[lang];
  // Arabic Pass pages are not localized yet, so keep those links on the existing English UI rather than creating 404 routes.
  const prefix=lang==='en'?'/eng':lang==='ru'?'/rus':lang==='ar'?'/eng':'';

  ensureAvatarEditorAssets();
  document.addEventListener('DOMContentLoaded',init);

  function ensureAvatarEditorAssets(){
    if(!document.querySelector('link[href*="account-avatar.css"]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href='/assets/css/account-avatar.css?v=20260904-1';
      document.head.appendChild(link);
    }
    if(!document.querySelector('script[src*="account-avatar.js"]')){
      const script=document.createElement('script');
      script.src='/assets/js/account-avatar.js?v=20260904-1';
      script.defer=true;
      document.head.appendChild(script);
    }
  }

  function addLogoutAction(main){
    if(main.querySelector('[data-account-logout]'))return;
    const section=document.createElement('section');
    section.className='account-logout-section';
    section.innerHTML=`<button type="button" class="account-logout-button" data-account-logout>${esc(copy.logout)}</button>`;
    main.appendChild(section);
    if(!document.querySelector('script[src*="account-logout.js"]')){
      const script=document.createElement('script');
      script.src='/assets/js/account-logout.js?v=20260906-1';
      document.head.appendChild(script);
    }
  }

  async function init(){
    const main=document.querySelector('.account-main');
    const first=main?.querySelector('.account-card');
    if(!main||!first)return;

    const customer=document.createElement('section');
    customer.className='account-card account-section account-pass-section';
    customer.innerHTML=`<h2>${esc(copy.title)}</h2><p>${esc(copy.desc)}</p><div class="account-pass-actions"><a class="account-pass-link primary" href="${prefix}/experience-pass.html">🎟️ ${esc(copy.buy)}</a><a class="account-pass-link" href="${prefix}/passes.html">📱 ${esc(copy.mine)}</a></div>`;
    first.insertAdjacentElement('afterend',customer);
    addLogoutAction(main);

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
