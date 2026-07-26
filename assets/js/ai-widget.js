/**
 * ai-widget.js — SUPPRESSED fallback widget
 * The main AI panel is now provided by include.js (injectAiWidget).
 * This file is kept to avoid 404 errors but does nothing if the main
 * panel is already present.
 */
(function () {
  // If include.js already created the main AI panel — do nothing
  if (document.querySelector('.ai-panel-global') ||
      document.getElementById('ai-unified-widget')) {
    return;
  }

  // Minimal fallback only if main widget completely failed to load
  var FALLBACK_DELAY = 3000;
  setTimeout(function () {
    if (document.querySelector('.ai-panel-global') ||
        document.getElementById('ai-unified-widget') ||
        document.querySelector('.ai-widget-panel')) {
      return; // main widget appeared in the meantime
    }

    var lang = (document.documentElement.lang || '').toLowerCase();
    var isEn = lang.startsWith('en') || window.location.pathname.startsWith('/eng/');
    var isRu = lang.startsWith('ru') || window.location.pathname.startsWith('/rus/');
    var t = isEn
      ? { title: 'AI Assistant', body: 'Hello! How can I help?', placeholder: 'Send a message...', send: 'Send' }
      : isRu
      ? { title: 'AI Асистент', body: 'Привет! Чем помочь?', placeholder: 'Напишите...', send: 'Отправить' }
      : { title: 'AI Asistan', body: 'Merhaba! Nasıl yardımcı olabilirim?', placeholder: 'Bir mesaj yazın...', send: 'Gönder' };

    var s = document.createElement('style');
    s.textContent = '.ai-widget-panel{position:fixed!important;bottom:80px!important;right:20px!important;z-index:2147480000!important;width:300px;max-width:92vw;background:#0f172a;border:1px solid rgba(0,194,255,0.3);border-radius:16px;padding:16px;color:#fff;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,0.6);display:none;flex-direction:column;gap:10px}.ai-widget-panel.open{display:flex}.ai-widget-header{display:flex;justify-content:space-between;align-items:center}.ai-close{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer}.ai-widget-input{display:flex;gap:6px}.ai-widget-input input{flex:1;background:rgba(0,194,255,0.05);border:1px solid rgba(0,194,255,0.2);border-radius:8px;padding:8px 10px;color:#fff;font-family:inherit;font-size:13px}.ai-send{padding:8px 12px;background:#00c2ff;color:#020617;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit}';
    document.head.appendChild(s);

    var panel = document.createElement('div');
    panel.className = 'ai-widget-panel';
    panel.innerHTML = '<div class="ai-widget-header"><strong>' + t.title + '</strong><button class="ai-close">✕</button></div><div style="font-size:13px;color:#94a3b8">' + t.body + '</div><div class="ai-widget-input"><input type="text" placeholder="' + t.placeholder + '"><button class="ai-send">' + t.send + '</button></div>';
    document.body.appendChild(panel);
    panel.querySelector('.ai-close').addEventListener('click', function () { panel.classList.remove('open'); });

    // Show trigger button
    var btn = document.createElement('button');
    btn.style.cssText = 'position:fixed!important;bottom:80px!important;right:20px!important;z-index:2147480001!important;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#00c2ff,#0ea5e9);border:none;cursor:pointer;overflow:hidden;padding:6px;';
    btn.innerHTML = '<img src="/assets/images/albamenai.png" style="width:100%;height:100%;object-fit:contain">';
    btn.addEventListener('click', function () { panel.classList.toggle('open'); });
    document.body.appendChild(btn);
  }, FALLBACK_DELAY);
}());
