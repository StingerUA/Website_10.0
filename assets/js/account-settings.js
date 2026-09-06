(function(){
  'use strict';
  const API='https://api.albaspace.com.tr';
  const TOKEN_KEY='albaspace_access_token';
  const raw=(document.documentElement.lang||'tr').toLowerCase();
  const lang=raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':raw.startsWith('ar')?'ar':'tr';
  const T={
    tr:{title:'Hesap Ayarları',desc:'Giriş bilgilerini ve yerel parolanı yönet.',back:'Hesaba dön',summary:'Hesap bilgileri',loginLabel:'Geçerli giriş',typeLabel:'Hesap türü',typeQuick:'Uzaydash / yerel hesap',typeEmail:'E-posta + parola',typeGoogle:'Google hesabı',loginTitle:'Kullanıcı adını değiştir',loginHelp:'Yeni bir kullanıcı adı belirle. E-posta adresin değişmez ve e-posta ile giriş yapmaya devam edebilirsin.',newLogin:'Yeni kullanıcı adı',currentPassword:'Mevcut parola',changeLogin:'Kullanıcı adını değiştir',passwordTitle:'Parolayı değiştir',passwordHelp:'Yeni parola en az 8 karakter olmalı. Diğer açık oturumların kapatılır.',newPassword:'Yeni parola',confirmPassword:'Yeni parolayı tekrar yaz',changePassword:'Parolayı değiştir',googleOnlyLogin:'Bu hesap doğrudan Google ile oluşturulduğu için AlbaSpace içinde ayrı bir kullanıcı adı değiştirilemez.',googleOnlyPassword:'Bu hesapta yerel parola yok. Parola yönetimi Google hesabın üzerinden yapılır.',loading:'Yükleniyor…',savedLogin:'Kullanıcı adı güncellendi.',savedPassword:'Parola güncellendi.',mismatch:'Yeni parolalar eşleşmiyor.',error:'İşlem tamamlanamadı.',notLogged:'Oturum bulunamadı.',errors:{current_password_required:'Mevcut parolanı gir.',current_password_invalid:'Mevcut parola yanlış.',invalid_username:'Kullanıcı adı 3–32 karakter olmalı; harf, rakam, nokta, alt çizgi ve tire kullanılabilir.',reserved_username:'Uzaydash-sayı biçimi sistem tarafından ayrılmıştır. Farklı bir kullanıcı adı seç.',username_taken:'Bu kullanıcı adı zaten kullanılıyor.',login_change_not_available:'Bu hesapta kullanıcı adı değiştirilemez.',password_change_not_available:'Bu hesapta yerel parola yok.',invalid_new_password:'Yeni parola 8–128 karakter olmalı.',password_must_change:'Yeni parola mevcut paroladan farklı olmalı.'}},
    en:{title:'Account Settings',desc:'Manage your sign-in name and local password.',back:'Back to account',summary:'Account details',loginLabel:'Current login',typeLabel:'Account type',typeQuick:'Uzaydash / local account',typeEmail:'Email + password',typeGoogle:'Google account',loginTitle:'Change username',loginHelp:'Choose a new username. Your email address stays unchanged and can still be used to sign in.',newLogin:'New username',currentPassword:'Current password',changeLogin:'Change username',passwordTitle:'Change password',passwordHelp:'Your new password must be at least 8 characters. Other active sessions will be signed out.',newPassword:'New password',confirmPassword:'Repeat new password',changePassword:'Change password',googleOnlyLogin:'This account was created directly with Google, so there is no separate AlbaSpace username to change.',googleOnlyPassword:'This account has no local AlbaSpace password. Manage your password through Google.',loading:'Loading…',savedLogin:'Username updated.',savedPassword:'Password updated.',mismatch:'The new passwords do not match.',error:'Could not complete the request.',notLogged:'No active session.',errors:{current_password_required:'Enter your current password.',current_password_invalid:'Current password is incorrect.',invalid_username:'Username must be 3–32 characters using letters, numbers, dot, underscore or hyphen.',reserved_username:'Uzaydash-number names are reserved by the system. Choose another username.',username_taken:'That username is already in use.',login_change_not_available:'Username cannot be changed for this account.',password_change_not_available:'This account has no local password.',invalid_new_password:'New password must be 8–128 characters.',password_must_change:'New password must be different from the current password.'}},
    ru:{title:'Настройки аккаунта',desc:'Управляйте логином и локальным паролем аккаунта.',back:'Вернуться в аккаунт',summary:'Данные аккаунта',loginLabel:'Текущий логин',typeLabel:'Тип аккаунта',typeQuick:'Uzaydash / локальный аккаунт',typeEmail:'E-mail + пароль',typeGoogle:'Google аккаунт',loginTitle:'Сменить логин',loginHelp:'Выберите новый логин. E-mail при этом не меняется, и вход по e-mail продолжит работать.',newLogin:'Новый логин',currentPassword:'Текущий пароль',changeLogin:'Сменить логин',passwordTitle:'Сменить пароль',passwordHelp:'Новый пароль должен быть не короче 8 символов. Другие открытые сессии будут завершены.',newPassword:'Новый пароль',confirmPassword:'Повторите новый пароль',changePassword:'Сменить пароль',googleOnlyLogin:'Этот аккаунт создан напрямую через Google, поэтому отдельного логина AlbaSpace для смены у него нет.',googleOnlyPassword:'У этого аккаунта нет локального пароля AlbaSpace. Пароль управляется через Google.',loading:'Загрузка…',savedLogin:'Логин успешно изменён.',savedPassword:'Пароль успешно изменён.',mismatch:'Новые пароли не совпадают.',error:'Не удалось выполнить операцию.',notLogged:'Активная сессия не найдена.',errors:{current_password_required:'Введите текущий пароль.',current_password_invalid:'Текущий пароль неверный.',invalid_username:'Логин должен содержать 3–32 символа: буквы, цифры, точку, подчёркивание или дефис.',reserved_username:'Формат Uzaydash-число зарезервирован системой. Выберите другой логин.',username_taken:'Такой логин уже занят.',login_change_not_available:'Для этого аккаунта смена логина недоступна.',password_change_not_available:'У этого аккаунта нет локального пароля.',invalid_new_password:'Новый пароль должен содержать от 8 до 128 символов.',password_must_change:'Новый пароль должен отличаться от текущего.'}},
    ar:{title:'إعدادات الحساب',desc:'إدارة اسم تسجيل الدخول وكلمة المرور المحلية.',back:'العودة إلى الحساب',summary:'بيانات الحساب',loginLabel:'تسجيل الدخول الحالي',typeLabel:'نوع الحساب',typeQuick:'Uzaydash / حساب محلي',typeEmail:'البريد + كلمة المرور',typeGoogle:'حساب Google',loginTitle:'تغيير اسم المستخدم',loginHelp:'اختر اسم مستخدم جديدًا. لن يتغير بريدك الإلكتروني ويمكنك الاستمرار في تسجيل الدخول به.',newLogin:'اسم المستخدم الجديد',currentPassword:'كلمة المرور الحالية',changeLogin:'تغيير اسم المستخدم',passwordTitle:'تغيير كلمة المرور',passwordHelp:'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل. سيتم إنهاء الجلسات الأخرى.',newPassword:'كلمة المرور الجديدة',confirmPassword:'أعد كلمة المرور الجديدة',changePassword:'تغيير كلمة المرور',googleOnlyLogin:'تم إنشاء هذا الحساب مباشرة عبر Google، لذلك لا يوجد اسم مستخدم محلي منفصل لتغييره.',googleOnlyPassword:'لا توجد كلمة مرور محلية لهذا الحساب. تتم إدارة كلمة المرور عبر Google.',loading:'جارٍ التحميل…',savedLogin:'تم تحديث اسم المستخدم.',savedPassword:'تم تحديث كلمة المرور.',mismatch:'كلمتا المرور الجديدتان غير متطابقتين.',error:'تعذر إكمال العملية.',notLogged:'لا توجد جلسة نشطة.',errors:{current_password_required:'أدخل كلمة المرور الحالية.',current_password_invalid:'كلمة المرور الحالية غير صحيحة.',invalid_username:'يجب أن يكون اسم المستخدم من 3 إلى 32 حرفًا باستخدام الحروف والأرقام والنقطة والشرطة السفلية والشرطة.',reserved_username:'صيغة Uzaydash-رقم محجوزة للنظام. اختر اسمًا آخر.',username_taken:'اسم المستخدم مستخدم بالفعل.',login_change_not_available:'لا يمكن تغيير اسم المستخدم لهذا الحساب.',password_change_not_available:'لا توجد كلمة مرور محلية لهذا الحساب.',invalid_new_password:'يجب أن تكون كلمة المرور الجديدة من 8 إلى 128 حرفًا.',password_must_change:'يجب أن تختلف كلمة المرور الجديدة عن الحالية.'}}
  }[lang];

  const prefix=lang==='en'?'/eng':lang==='ru'?'/rus':lang==='ar'?'/ar':'';
  function token(){try{return localStorage.getItem(TOKEN_KEY)||'';}catch(_){return '';}}
  function headers(extra){const out=Object.assign({},extra||{});const t=token();if(t)out.Authorization='Bearer '+t;return out;}
  async function request(path,options){const res=await fetch(API+path,Object.assign({credentials:'include'},options||{}, {headers:headers((options&&options.headers)||{})}));const data=await res.json().catch(()=>({}));return {res,data};}
  function typeLabel(kind){return kind==='quick'?T.typeQuick:kind==='email'?T.typeEmail:T.typeGoogle;}
  function msg(el,text,error){if(!el)return;el.textContent=text||'';el.classList.toggle('error',!!error);}
  function errorText(code){return T.errors[code]||T.error+(code?' ('+code+')':'');}

  async function init(){
    document.querySelector('[data-settings-title]').textContent=T.title;
    document.querySelector('[data-settings-desc]').textContent=T.desc;
    document.querySelector('[data-settings-back]').textContent='← '+T.back;
    document.querySelector('[data-settings-back]').href=prefix+'/account.html';
    document.querySelector('[data-summary-title]').textContent=T.summary;
    document.querySelector('[data-current-login-label]').textContent=T.loginLabel;
    document.querySelector('[data-account-type-label]').textContent=T.typeLabel;
    document.querySelector('[data-login-title]').textContent=T.loginTitle;
    document.querySelector('[data-login-help]').textContent=T.loginHelp;
    document.querySelector('[data-new-login-label]').textContent=T.newLogin;
    document.querySelector('[data-login-password-label]').textContent=T.currentPassword;
    document.querySelector('[data-login-submit]').textContent=T.changeLogin;
    document.querySelector('[data-password-title]').textContent=T.passwordTitle;
    document.querySelector('[data-password-help]').textContent=T.passwordHelp;
    document.querySelector('[data-password-current-label]').textContent=T.currentPassword;
    document.querySelector('[data-new-password-label]').textContent=T.newPassword;
    document.querySelector('[data-confirm-password-label]').textContent=T.confirmPassword;
    document.querySelector('[data-password-submit]').textContent=T.changePassword;

    const result=await request('/auth/account/settings');
    if(result.res.status===401){location.href=prefix+'/account-menu.html';return;}
    if(!result.res.ok){msg(document.querySelector('[data-global-message]'),errorText(result.data.error),true);return;}
    renderStatus(result.data.user);
    wireForms();
  }

  function renderStatus(user){
    document.querySelector('[data-current-login]').textContent=user.current_login||'—';
    document.querySelector('[data-account-type]').textContent=typeLabel(user.account_kind);
    const loginCard=document.querySelector('[data-login-card]');
    const loginUnavailable=document.querySelector('[data-login-unavailable]');
    if(user.can_change_login){
      loginCard.classList.remove('account-settings-hidden');
      loginUnavailable.classList.add('account-settings-hidden');
      const input=document.querySelector('[data-new-login]');
      input.value=user.username||'';
    }else{
      loginCard.classList.add('account-settings-hidden');
      loginUnavailable.classList.remove('account-settings-hidden');
      loginUnavailable.textContent=T.googleOnlyLogin;
    }
    const passwordCard=document.querySelector('[data-password-card]');
    const passwordUnavailable=document.querySelector('[data-password-unavailable]');
    if(user.can_change_password){passwordCard.classList.remove('account-settings-hidden');passwordUnavailable.classList.add('account-settings-hidden');}
    else{passwordCard.classList.add('account-settings-hidden');passwordUnavailable.classList.remove('account-settings-hidden');passwordUnavailable.textContent=T.googleOnlyPassword;}
  }

  function wireForms(){
    const loginForm=document.querySelector('[data-login-form]');
    if(loginForm)loginForm.addEventListener('submit',async function(e){
      e.preventDefault();const button=document.querySelector('[data-login-submit]');const out=document.querySelector('[data-login-message]');msg(out,'',false);button.disabled=true;
      const body={username:document.querySelector('[data-new-login]').value.trim(),current_password:document.querySelector('[data-login-password]').value};
      const result=await request('/auth/account/username',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      button.disabled=false;
      if(!result.res.ok){msg(out,errorText(result.data.error),true);return;}
      document.querySelector('[data-current-login]').textContent=result.data.username;document.querySelector('[data-login-password]').value='';msg(out,T.savedLogin,false);
    });
    const pwForm=document.querySelector('[data-password-form]');
    if(pwForm)pwForm.addEventListener('submit',async function(e){
      e.preventDefault();const out=document.querySelector('[data-password-message]');const button=document.querySelector('[data-password-submit]');const current=document.querySelector('[data-password-current]').value;const next=document.querySelector('[data-new-password]').value;const confirm=document.querySelector('[data-confirm-password]').value;msg(out,'',false);
      if(next!==confirm){msg(out,T.mismatch,true);return;}
      button.disabled=true;const result=await request('/auth/account/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current_password:current,new_password:next})});button.disabled=false;
      if(!result.res.ok){msg(out,errorText(result.data.error),true);return;}
      document.querySelector('[data-password-current]').value='';document.querySelector('[data-new-password]').value='';document.querySelector('[data-confirm-password]').value='';msg(out,T.savedPassword,false);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
