(function () {
  'use strict';

  var API = 'https://api.albaspace.com.tr';

  function lang() {
    var value = (document.documentElement.lang || 'tr').toLowerCase();
    return value === 'en' || value === 'ru' ? value : 'tr';
  }

  var T = {
    tr: {
      connection: 'Bağlantı hatası. Lütfen tekrar deneyin.',
      missingToken: 'Şifre sıfırlama bağlantısı eksik veya geçersiz.',
      passwordShort: 'Şifre en az 8 karakter olmalıdır.',
      passwordMismatch: 'Şifreler eşleşmiyor.',
      sending: 'Gönderiliyor…',
      changing: 'Değiştiriliyor…'
    },
    en: {
      connection: 'Connection error. Please try again.',
      missingToken: 'The password reset link is missing or invalid.',
      passwordShort: 'Password must be at least 8 characters.',
      passwordMismatch: 'Passwords do not match.',
      sending: 'Sending…',
      changing: 'Changing…'
    },
    ru: {
      connection: 'Ошибка соединения. Попробуйте ещё раз.',
      missingToken: 'Ссылка для сброса пароля отсутствует или недействительна.',
      passwordShort: 'Пароль должен содержать не менее 8 символов.',
      passwordMismatch: 'Пароли не совпадают.',
      sending: 'Отправка…',
      changing: 'Изменение…'
    }
  };

  function setMessage(el, text, ok) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-success', !!ok);
    el.classList.toggle('is-error', !ok && !!text);
  }

  function requestForm() {
    var form = document.getElementById('passwordResetRequestForm');
    if (!form) return;
    var email = document.getElementById('passwordResetEmail');
    var button = document.getElementById('passwordResetRequestButton');
    var message = document.getElementById('passwordResetMessage');
    var buttonText = button.textContent;
    var text = T[lang()] || T.tr;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setMessage(message, '', false);
      button.disabled = true;
      button.textContent = text.sending;

      fetch(API + '/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), lang: lang() })
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          button.disabled = false;
          button.textContent = buttonText;
          if (result.ok) {
            setMessage(message, result.data.message || '', true);
            form.reset();
          } else {
            setMessage(message, result.data.error || text.connection, false);
          }
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = buttonText;
          setMessage(message, text.connection, false);
        });
    });
  }

  function resetForm() {
    var form = document.getElementById('passwordResetUpdateForm');
    if (!form) return;
    var password = document.getElementById('passwordResetNewPassword');
    var confirm = document.getElementById('passwordResetConfirmPassword');
    var button = document.getElementById('passwordResetUpdateButton');
    var message = document.getElementById('passwordResetMessage');
    var success = document.getElementById('passwordResetSuccess');
    var buttonText = button.textContent;
    var text = T[lang()] || T.tr;
    var token = new URLSearchParams(window.location.search).get('token') || '';

    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      form.style.display = 'none';
      setMessage(message, text.missingToken, false);
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setMessage(message, '', false);

      if (password.value.length < 8) {
        setMessage(message, text.passwordShort, false);
        return;
      }
      if (password.value !== confirm.value) {
        setMessage(message, text.passwordMismatch, false);
        return;
      }

      button.disabled = true;
      button.textContent = text.changing;

      fetch(API + '/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, password: password.value, lang: lang() })
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          button.disabled = false;
          button.textContent = buttonText;
          if (result.ok) {
            form.style.display = 'none';
            setMessage(message, result.data.message || '', true);
            if (success) success.hidden = false;
          } else {
            setMessage(message, result.data.error || text.connection, false);
          }
        })
        .catch(function () {
          button.disabled = false;
          button.textContent = buttonText;
          setMessage(message, text.connection, false);
        });
    });
  }

  function init() {
    requestForm();
    resetForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
