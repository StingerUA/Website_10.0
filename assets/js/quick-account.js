(function(){
  'use strict';
  var API='https://api.albaspace.com.tr';
  var TOKEN_KEY='albaspace_access_token';
  var CREDENTIALS_KEY='alba_quick_credentials_v1';
  var VERSION='20260906-uzaydash-v1';

  function lang(){
    var raw=(document.documentElement.lang||'tr').toLowerCase();
    if(raw.indexOf('ru')===0)return 'ru';
    if(raw.indexOf('en')===0)return 'en';
    if(raw.indexOf('ar')===0)return 'ar';
    return 'tr';
  }

  var T={
    tr:{
      loginLabel:'E-posta veya Uzaydash kullanıcı adı',loginPlaceholder:'E-posta veya Uzaydash-1',
      quickTitle:'E-posta olmadan hızlı hesap',quickButton:'Uzaydash hesabı oluştur',
      quickHelp:'Tek dokunuşla sıradaki Uzaydash kullanıcı adı ve güçlü bir şifre oluşturulur. Hesabın hemen açılır; şifreni kaydetmen yeterli.',
      quickDivider:'veya Google / e-posta ile devam et',creating:'Hesap oluşturuluyor…',createError:'Hızlı hesap oluşturulamadı.',
      readyTitle:'Uzaydash hesabın hazır',readyText:'Giriş yapıldı. Bu bilgileri şimdi kaydet; parola daha sonra açık olarak gösterilemez.',
      username:'Kullanıcı',password:'Şifre',copy:'Kopyala',copyAll:'Bilgileri kopyala',continue:'Hesaba devam et',saved:'Kopyalandı',
      reminderTitle:'Uzaydash giriş bilgilerin',reminderText:'Google hesabını bağlayana kadar bu kullanıcı adı ve şifreyi güvenli bir yerde sakla.',dismiss:'Bilgileri gizle',
      linkTitle:'Hesabı Google ile güvenceye al',linkButton:'Google hesabına bağla',
      linkHelp:'Satın alımların, QR Pass’lerin, hakların ve geçmişin aynı hesapta kalır. Bağladıktan sonra Google ile giriş yapabilirsin; Uzaydash kullanıcı adı ve şifren de çalışmaya devam eder.',
      linking:'Google açılıyor…',linked:'Google hesabı başarıyla bağlandı.',linkError:'Google hesabı bağlanamadı.',alreadyUsed:'Bu Google hesabı başka bir ALBA Space hesabına bağlı.',
      quickBadge:'Uzaydash hızlı hesap'
    },
    en:{
      loginLabel:'Email or Uzaydash username',loginPlaceholder:'Email or Uzaydash-1',
      quickTitle:'Quick account without email',quickButton:'Create Uzaydash account',
      quickHelp:'One tap creates the next Uzaydash username and a strong password and signs you in immediately. Save the password for later.',
      quickDivider:'or continue with Google / email',creating:'Creating account…',createError:'Could not create the quick account.',
      readyTitle:'Your Uzaydash account is ready',readyText:'You are signed in. Save these credentials now; the password cannot be shown again later.',
      username:'Username',password:'Password',copy:'Copy',copyAll:'Copy credentials',continue:'Continue to account',saved:'Copied',
      reminderTitle:'Your Uzaydash credentials',reminderText:'Keep this username and password somewhere safe until you link Google.',dismiss:'Hide credentials',
      linkTitle:'Secure this account with Google',linkButton:'Link Google account',
      linkHelp:'Your purchases, QR Passes, entitlements and history stay on this same account. After linking you can sign in with Google; your Uzaydash username and password will keep working too.',
      linking:'Opening Google…',linked:'Google account linked successfully.',linkError:'Could not link the Google account.',alreadyUsed:'This Google account is already linked to another ALBA Space account.',
      quickBadge:'Uzaydash quick account'
    },
    ru:{
      loginLabel:'E-mail или логин Uzaydash',loginPlaceholder:'E-mail или Uzaydash-1',
      quickTitle:'Быстрый аккаунт без e-mail',quickButton:'Создать Uzaydash-аккаунт',
      quickHelp:'Одним нажатием создадим следующий логин Uzaydash и надёжный пароль и сразу войдём в аккаунт. Пароль нужно сохранить.',
      quickDivider:'или продолжить через Google / e-mail',creating:'Создаём аккаунт…',createError:'Не удалось создать быстрый аккаунт.',
      readyTitle:'Ваш Uzaydash-аккаунт готов',readyText:'Вы уже вошли. Сохраните эти данные сейчас: позже пароль в открытом виде показать будет невозможно.',
      username:'Логин',password:'Пароль',copy:'Копировать',copyAll:'Скопировать данные',continue:'Перейти в аккаунт',saved:'Скопировано',
      reminderTitle:'Ваши данные Uzaydash',reminderText:'Сохраните логин и пароль в надёжном месте, пока не привяжете Google.',dismiss:'Скрыть данные',
      linkTitle:'Привязать аккаунт к Google',linkButton:'Привязать Google аккаунт',
      linkHelp:'Ваши покупки, QR Pass, права на впечатления и история останутся в этом же аккаунте. После привязки можно будет входить через Google; логин Uzaydash и пароль тоже продолжат работать.',
      linking:'Открываем Google…',linked:'Google аккаунт успешно привязан.',linkError:'Не удалось привязать Google аккаунт.',alreadyUsed:'Этот Google аккаунт уже привязан к другому аккаунту ALBA Space.',
      quickBadge:'Быстрый Uzaydash-аккаунт'
    },
    ar:{
      loginLabel:'البريد الإلكتروني أو اسم Uzaydash',loginPlaceholder:'البريد أو Uzaydash-1',
      quickTitle:'حساب سريع بدون بريد إلكتروني',quickButton:'إنشاء حساب Uzaydash',
      quickHelp:'بنقرة واحدة ننشئ اسم Uzaydash التالي وكلمة مرور قوية ونسجّل دخولك فورًا. احفظ كلمة المرور لاستخدامها لاحقًا.',
      quickDivider:'أو المتابعة عبر Google / البريد',creating:'جارٍ إنشاء الحساب…',createError:'تعذر إنشاء الحساب السريع.',
      readyTitle:'حساب Uzaydash جاهز',readyText:'تم تسجيل دخولك. احفظ هذه البيانات الآن؛ لن نعرض كلمة المرور بصورتها الأصلية لاحقًا.',
      username:'اسم المستخدم',password:'كلمة المرور',copy:'نسخ',copyAll:'نسخ البيانات',continue:'المتابعة إلى الحساب',saved:'تم النسخ',
      reminderTitle:'بيانات دخول Uzaydash',reminderText:'احتفظ باسم المستخدم وكلمة المرور في مكان آمن حتى تربط Google.',dismiss:'إخفاء البيانات',
      linkTitle:'ربط الحساب مع Google',linkButton:'ربط حساب Google',
      linkHelp:'تبقى مشترياتك وQR Pass والحقوق والسجل في الحساب نفسه. بعد الربط يمكنك تسجيل الدخول عبر Google، وسيستمر اسم Uzaydash وكلمة المرور في العمل أيضًا.',
      linking:'جارٍ فتح Google…',linked:'تم ربط حساب Google بنجاح.',linkError:'تعذر ربط حساب Google.',alreadyUsed:'حساب Google هذا مرتبط بالفعل بحساب ALBA Space آخر.',
      quickBadge:'حساب Uzaydash سريع'
    }
  };

  function text(){return T[lang()]||T.tr;}
  function token(){try{return localStorage.getItem(TOKEN_KEY)||'';}catch(e){return '';}}
  function saveToken(value){if(!value)return;try{localStorage.setItem(TOKEN_KEY,value);}catch(e){}}
  function headers(extra){var out=extra||{};var value=token();if(value)out.Authorization='Bearer '+value;return out;}
  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}

  function loadCss(){
    if(document.querySelector('link[data-quick-account-css]'))return;
    var link=document.createElement('link');link.rel='stylesheet';link.href='/assets/css/quick-account.css?v='+VERSION;link.dataset.quickAccountCss='1';document.head.appendChild(link);
  }

  function isAccountMenu(){return /\/(?:eng\/|rus\/|ar\/)?account-menu\.html$/i.test(location.pathname);}

  function tuneLoginField(){
    var input=document.getElementById('amLoginEmail');if(!input)return;
    input.type='text';input.autocomplete='username';input.placeholder=text().loginPlaceholder;
    var field=input.closest('.am-field');var label=field&&field.querySelector('label');if(label)label.textContent=text().loginLabel;
  }

  function injectCreateCard(){
    var out=document.getElementById('amSectionOut');if(!out||out.querySelector('#qaCreateCard'))return;
    var heading=out.querySelector('.am-heading');
    var card=document.createElement('section');card.id='qaCreateCard';card.className='qa-create-card';
    card.innerHTML='<h3>'+escapeHtml(text().quickTitle)+'</h3><button class="qa-primary" id="qaCreateBtn" type="button">'+escapeHtml(text().quickButton)+'</button><p>'+escapeHtml(text().quickHelp)+'</p><div class="qa-inline-status" id="qaCreateStatus" aria-live="polite"></div>';
    if(heading)heading.insertAdjacentElement('afterend',card);else out.prepend(card);
    var divider=document.createElement('div');divider.className='qa-divider';divider.textContent=text().quickDivider;card.insertAdjacentElement('afterend',divider);
    document.getElementById('qaCreateBtn').addEventListener('click',createQuickAccount);
  }

  async function createQuickAccount(){
    var btn=document.getElementById('qaCreateBtn'),status=document.getElementById('qaCreateStatus');if(!btn)return;
    btn.disabled=true;var old=btn.textContent;btn.textContent=text().creating;if(status)status.textContent='';
    try{
      var res=await fetch(API+'/auth/quick-account',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:'{}'});
      var data=await res.json().catch(function(){return {};});
      if(!res.ok)throw new Error(data.error||text().createError);
      saveToken(data.token);
      try{sessionStorage.setItem(CREDENTIALS_KEY,JSON.stringify(data.credentials));}catch(e){}
      showCredentials(data.credentials,true);
    }catch(error){if(status)status.textContent=text().createError+' '+(error.message||'');btn.disabled=false;btn.textContent=old;}
  }

  function credentialRows(credentials){
    return '<div class="qa-credential-grid">'+
      '<div class="qa-credential-row"><span>'+escapeHtml(text().username)+'</span><code>'+escapeHtml(credentials.username)+'</code><button class="qa-copy-one" data-copy="username" type="button">'+escapeHtml(text().copy)+'</button></div>'+
      '<div class="qa-credential-row"><span>'+escapeHtml(text().password)+'</span><code>'+escapeHtml(credentials.password)+'</code><button class="qa-copy-one" data-copy="password" type="button">'+escapeHtml(text().copy)+'</button></div></div>';
  }

  function showCredentials(credentials,modal){
    if(!credentials||!credentials.username||!credentials.password)return;
    if(modal){
      var wrap=document.getElementById('qaCredentialModal');if(wrap)wrap.remove();
      wrap=document.createElement('div');wrap.id='qaCredentialModal';wrap.className='qa-modal';
      wrap.innerHTML='<div class="qa-modal-backdrop"></div><div class="qa-modal-panel"><h2>'+escapeHtml(text().readyTitle)+'</h2><p>'+escapeHtml(text().readyText)+'</p>'+credentialRows(credentials)+'<p class="qa-security-note">⚠ '+escapeHtml(text().reminderText)+'</p><div class="qa-modal-actions"><button class="qa-secondary" id="qaCopyAll" type="button">'+escapeHtml(text().copyAll)+'</button><button class="qa-primary" id="qaContinue" type="button">'+escapeHtml(text().continue)+'</button></div></div>';
      document.body.appendChild(wrap);wireCredentialButtons(wrap,credentials);document.getElementById('qaContinue').addEventListener('click',function(){location.reload();});
    }
  }

  function wireCredentialButtons(root,credentials){
    root.querySelectorAll('[data-copy]').forEach(function(btn){btn.addEventListener('click',function(){copyText(credentials[btn.dataset.copy]||'').then(function(){btn.textContent=text().saved;});});});
    var all=root.querySelector('#qaCopyAll');if(all)all.addEventListener('click',function(){copyText(text().username+': '+credentials.username+'\n'+text().password+': '+credentials.password).then(function(){all.textContent=text().saved;});});
  }

  function copyText(value){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(value);var ta=document.createElement('textarea');ta.value=value;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve();}

  function readSavedCredentials(){try{return JSON.parse(sessionStorage.getItem(CREDENTIALS_KEY)||'null');}catch(e){return null;}}

  function injectCredentialReminder(credentials){
    var sec=document.getElementById('amSectionIn');if(!sec||!credentials||sec.querySelector('#qaCredentialReminder'))return;
    var card=document.createElement('section');card.id='qaCredentialReminder';card.className='qa-credentials-reminder';
    card.innerHTML='<h3>'+escapeHtml(text().reminderTitle)+'</h3><p>'+escapeHtml(text().reminderText)+'</p>'+credentialRows(credentials)+'<div class="qa-modal-actions"><button class="qa-secondary" id="qaCopyAll" type="button">'+escapeHtml(text().copyAll)+'</button><button class="qa-secondary" id="qaDismissCreds" type="button">'+escapeHtml(text().dismiss)+'</button></div>';
    var userCard=sec.querySelector('.am-user-card');if(userCard)userCard.insertAdjacentElement('afterend',card);else sec.prepend(card);wireCredentialButtons(card,credentials);
    document.getElementById('qaDismissCreds').addEventListener('click',function(){try{sessionStorage.removeItem(CREDENTIALS_KEY);}catch(e){}card.remove();});
  }

  async function refreshQuickStatus(){
    try{
      var res=await fetch(API+'/auth/quick-account/status',{credentials:'include',headers:headers({})});
      if(!res.ok)return;
      var data=await res.json();
      if(!data.is_quick)return;
      markQuickAccount(data.username);
      var creds=readSavedCredentials();if(creds)injectCredentialReminder(creds);
      if(data.can_link_google)injectGoogleLinkCard();
    }catch(e){}
  }

  function markQuickAccount(username){
    var userCard=document.querySelector('#amSectionIn .am-user-card');if(!userCard||userCard.querySelector('.qa-account-label'))return;
    var badge=document.createElement('span');badge.className='qa-account-label';badge.textContent='✦ '+text().quickBadge+(username?' · '+username:'');userCard.appendChild(badge);
  }

  function injectGoogleLinkCard(){
    var sec=document.getElementById('amSectionIn');if(!sec||sec.querySelector('#qaGoogleLinkCard'))return;
    var card=document.createElement('section');card.id='qaGoogleLinkCard';card.className='qa-link-card';
    card.innerHTML='<div class="qa-link-icon">🔗</div><h3>'+escapeHtml(text().linkTitle)+'</h3><button class="qa-google-link" id="qaGoogleLinkBtn" type="button"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="">'+escapeHtml(text().linkButton)+'</button><p>'+escapeHtml(text().linkHelp)+'</p><div class="qa-inline-status" id="qaLinkStatus" aria-live="polite"></div>';
    var reminder=sec.querySelector('#qaCredentialReminder');var userCard=sec.querySelector('.am-user-card');
    if(reminder)reminder.insertAdjacentElement('afterend',card);else if(userCard)userCard.insertAdjacentElement('afterend',card);else sec.prepend(card);
    document.getElementById('qaGoogleLinkBtn').addEventListener('click',startGoogleLink);
  }

  async function startGoogleLink(){
    var btn=document.getElementById('qaGoogleLinkBtn'),status=document.getElementById('qaLinkStatus');if(!btn)return;
    btn.disabled=true;var old=btn.innerHTML;btn.textContent=text().linking;if(status)status.textContent='';
    try{
      var from=new URL(location.href);from.searchParams.delete('google_linked');from.searchParams.delete('google_link_error');
      var res=await fetch(API+'/auth/google/link/start',{method:'POST',credentials:'include',headers:headers({'Content-Type':'application/json'}),body:JSON.stringify({from:from.toString()})});
      var data=await res.json().catch(function(){return {};});if(!res.ok||!data.auth_url)throw new Error(data.error||text().linkError);location.href=data.auth_url;
    }catch(error){if(status)status.textContent=text().linkError+' '+(error.message||'');btn.disabled=false;btn.innerHTML=old;}
  }

  function showReturnNotice(){
    var params=new URLSearchParams(location.search);var linked=params.get('google_linked'),error=params.get('google_link_error');if(!linked&&!error)return;
    var card=document.querySelector('.am-card');if(!card)return;
    var note=document.createElement('div');note.className='qa-linked-note'+(error?' qa-error-note':'');
    if(error){note.textContent=(error==='google_account_already_used'||error==='google_email_already_used'||error==='google_identity_conflict')?text().alreadyUsed:text().linkError+' ('+error+')';}else note.textContent='✓ '+text().linked;
    var spinner=document.getElementById('amSpinner');if(spinner)spinner.insertAdjacentElement('beforebegin',note);else card.prepend(note);
    params.delete('google_linked');params.delete('google_link_error');var q=params.toString();history.replaceState({},document.title,location.pathname+(q?'?'+q:'')+location.hash);
  }

  function init(){
    if(!isAccountMenu())return;
    loadCss();tuneLoginField();injectCreateCard();showReturnNotice();
    setTimeout(refreshQuickStatus,180);setTimeout(refreshQuickStatus,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());
