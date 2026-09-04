(function () {
  'use strict';

  const API_BASE = 'https://api.albaspace.com.tr';
  const DEFAULT_AVATAR = '/assets/icons/alien.png';
  const AUTH_TOKEN_KEY = 'albaspace_access_token';
  const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_INPUT_BYTES = 8 * 1024 * 1024;
  const OUTPUT_SIZE = 512;

  const STRINGS = {
    tr: {
      title: 'Profil fotoğrafı',
      help: 'JPG, PNG veya WebP seçin. Fotoğraf otomatik olarak kareye kırpılır.',
      choose: 'Fotoğraf seç',
      save: 'Fotoğrafı kaydet',
      remove: 'Fotoğrafı kaldır',
      ready: 'Önizleme hazır. Kaydetmek için düğmeye basın.',
      uploading: 'Fotoğraf yükleniyor…',
      saved: 'Profil fotoğrafı güncellendi.',
      removed: 'Profil fotoğrafı kaldırıldı.',
      invalid: 'Lütfen JPG, PNG veya WebP formatında bir görsel seçin.',
      tooLarge: 'Görsel çok büyük. En fazla 8 MB seçin.',
      failed: 'Profil fotoğrafı kaydedilemedi.',
      login: 'Fotoğrafı değiştirmek için giriş yapın.',
      removeConfirm: 'Profil fotoğrafını kaldırmak istiyor musunuz?'
    },
    en: {
      title: 'Profile photo',
      help: 'Choose a JPG, PNG or WebP image. It will be cropped to a square automatically.',
      choose: 'Choose photo',
      save: 'Save photo',
      remove: 'Remove photo',
      ready: 'Preview ready. Press save to apply it.',
      uploading: 'Uploading photo…',
      saved: 'Profile photo updated.',
      removed: 'Profile photo removed.',
      invalid: 'Please choose a JPG, PNG or WebP image.',
      tooLarge: 'The image is too large. Maximum size is 8 MB.',
      failed: 'Could not save the profile photo.',
      login: 'Sign in to change your profile photo.',
      removeConfirm: 'Remove your profile photo?'
    },
    ru: {
      title: 'Фото профиля',
      help: 'Выберите JPG, PNG или WebP. Фото автоматически обрежется до квадрата.',
      choose: 'Выбрать фото',
      save: 'Сохранить фото',
      remove: 'Удалить фото',
      ready: 'Предпросмотр готов. Нажмите «Сохранить фото».',
      uploading: 'Фото загружается…',
      saved: 'Фото профиля обновлено.',
      removed: 'Фото профиля удалено.',
      invalid: 'Выберите изображение JPG, PNG или WebP.',
      tooLarge: 'Изображение слишком большое. Максимум — 8 МБ.',
      failed: 'Не удалось сохранить фото профиля.',
      login: 'Войдите в аккаунт, чтобы изменить фото.',
      removeConfirm: 'Удалить фото профиля?'
    },
    ar: {
      title: 'صورة الملف الشخصي',
      help: 'اختر صورة JPG أو PNG أو WebP. سيتم قصها تلقائيًا إلى مربع.',
      choose: 'اختيار صورة',
      save: 'حفظ الصورة',
      remove: 'حذف الصورة',
      ready: 'المعاينة جاهزة. اضغط حفظ لتطبيق الصورة.',
      uploading: 'جارٍ رفع الصورة…',
      saved: 'تم تحديث صورة الملف الشخصي.',
      removed: 'تم حذف صورة الملف الشخصي.',
      invalid: 'اختر صورة بصيغة JPG أو PNG أو WebP.',
      tooLarge: 'الصورة كبيرة جدًا. الحد الأقصى 8 ميغابايت.',
      failed: 'تعذر حفظ صورة الملف الشخصي.',
      login: 'سجّل الدخول لتغيير صورة الملف الشخصي.',
      removeConfirm: 'هل تريد حذف صورة الملف الشخصي؟'
    }
  };

  function locale() {
    const lang = String(document.documentElement.lang || 'tr').toLowerCase();
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('ar')) return 'ar';
    return 'tr';
  }

  function copy() {
    return STRINGS[locale()] || STRINGS.tr;
  }

  function authHeaders() {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      return token ? { Authorization: 'Bearer ' + token } : {};
    } catch (_) {
      return {};
    }
  }

  function setAllHeaderAvatars(src) {
    const finalSrc = src || DEFAULT_AVATAR;
    document.querySelectorAll('#accountAvatar, #accountMenuAvatar').forEach((img) => {
      if (!img) return;
      img.src = finalSrc;
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
    });
    document.dispatchEvent(new CustomEvent('albaspace:avatar-changed', { detail: { avatar: src || '' } }));
  }

  function buildEditor(form) {
    if (!form || document.getElementById('accountAvatarEditor')) return null;
    const s = copy();
    const editor = document.createElement('div');
    editor.id = 'accountAvatarEditor';
    editor.className = 'account-avatar-editor';
    editor.innerHTML = `
      <div class="account-avatar-visual">
        <img id="accountAvatarPreview" class="account-avatar-preview" src="${DEFAULT_AVATAR}" alt="">
        <span class="account-avatar-badge" aria-hidden="true">✎</span>
      </div>
      <div class="account-avatar-copy">
        <strong>${s.title}</strong>
        <p>${s.help}</p>
        <div class="account-avatar-actions">
          <button type="button" class="account-avatar-btn" id="accountAvatarChoose">${s.choose}</button>
          <button type="button" class="account-avatar-btn account-avatar-btn--primary" id="accountAvatarSave" disabled>${s.save}</button>
          <button type="button" class="account-avatar-btn account-avatar-btn--danger" id="accountAvatarRemove" hidden>${s.remove}</button>
        </div>
        <div class="account-avatar-status" id="accountAvatarStatus" aria-live="polite"></div>
        <input id="accountAvatarInput" type="file" accept="image/jpeg,image/png,image/webp" hidden>
      </div>`;

    const firstField = form.querySelector('.account-field');
    if (firstField) form.insertBefore(editor, firstField);
    else form.prepend(editor);
    return editor;
  }

  function status(editor, text, kind) {
    const el = editor?.querySelector('#accountAvatarStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', kind === 'error');
    el.classList.toggle('is-success', kind === 'success');
  }

  function loadImage(file) {
    if ('createImageBitmap' in window) return createImageBitmap(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image-load-failed')); };
      img.src = url;
    });
  }

  async function makeSquareBlob(file) {
    const image = await loadImage(file);
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    const side = Math.min(width, height);
    const sx = Math.max(0, (width - side) / 2);
    const sy = Math.max(0, (height - side) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    if (typeof image.close === 'function') image.close();

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('avatar-encode-failed'));
      }, 'image/webp', 0.88);
    });
  }

  async function fetchCurrentUser() {
    const response = await fetch(API_BASE + '/me', {
      credentials: 'include',
      headers: authHeaders(),
      mode: 'cors'
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  }

  function init() {
    const form = document.getElementById('accountForm');
    if (!form) return;
    const editor = buildEditor(form);
    if (!editor) return;

    const s = copy();
    const preview = editor.querySelector('#accountAvatarPreview');
    const input = editor.querySelector('#accountAvatarInput');
    const choose = editor.querySelector('#accountAvatarChoose');
    const save = editor.querySelector('#accountAvatarSave');
    const remove = editor.querySelector('#accountAvatarRemove');
    let pendingBlob = null;
    let previewObjectUrl = '';

    function setPreview(src) {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = '';
      }
      preview.src = src || DEFAULT_AVATAR;
    }

    choose.addEventListener('click', () => input.click());

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!ACCEPTED_TYPES.has(file.type)) {
        status(editor, s.invalid, 'error');
        input.value = '';
        return;
      }
      if (file.size > MAX_INPUT_BYTES) {
        status(editor, s.tooLarge, 'error');
        input.value = '';
        return;
      }
      try {
        pendingBlob = await makeSquareBlob(file);
        previewObjectUrl = URL.createObjectURL(pendingBlob);
        preview.src = previewObjectUrl;
        save.disabled = false;
        status(editor, s.ready, '');
      } catch (error) {
        console.warn('[Account avatar] preview failed', error);
        status(editor, s.failed, 'error');
      }
    });

    save.addEventListener('click', async () => {
      if (!pendingBlob) return;
      save.disabled = true;
      choose.disabled = true;
      remove.disabled = true;
      status(editor, s.uploading, '');
      try {
        const data = new FormData();
        data.append('avatar', pendingBlob, 'avatar.webp');
        const response = await fetch(API_BASE + '/profile/avatar', {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(),
          body: data,
          mode: 'cors'
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.avatar) {
          throw new Error(result.error || String(response.status));
        }
        pendingBlob = null;
        input.value = '';
        setPreview(result.avatar);
        remove.hidden = false;
        setAllHeaderAvatars(result.avatar);
        status(editor, s.saved, 'success');
        if (typeof window.checkUser === 'function') setTimeout(window.checkUser, 100);
      } catch (error) {
        console.warn('[Account avatar] upload failed', error);
        save.disabled = false;
        status(editor, String(error.message) === '401' ? s.login : s.failed, 'error');
      } finally {
        choose.disabled = false;
        remove.disabled = false;
      }
    });

    remove.addEventListener('click', async () => {
      if (!window.confirm(s.removeConfirm)) return;
      choose.disabled = true;
      save.disabled = true;
      remove.disabled = true;
      try {
        const response = await fetch(API_BASE + '/profile/avatar', {
          method: 'DELETE',
          credentials: 'include',
          headers: authHeaders(),
          mode: 'cors'
        });
        if (!response.ok) throw new Error(String(response.status));
        pendingBlob = null;
        input.value = '';
        setPreview('');
        remove.hidden = true;
        setAllHeaderAvatars('');
        status(editor, s.removed, 'success');
        if (typeof window.checkUser === 'function') setTimeout(window.checkUser, 100);
      } catch (error) {
        console.warn('[Account avatar] remove failed', error);
        status(editor, String(error.message) === '401' ? s.login : s.failed, 'error');
      } finally {
        choose.disabled = false;
        remove.disabled = false;
      }
    });

    fetchCurrentUser().then((user) => {
      const avatar = String(user?.avatar || '');
      setPreview(avatar);
      remove.hidden = !avatar;
    }).catch((error) => {
      if (String(error.message) === '401') status(editor, s.login, 'error');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
