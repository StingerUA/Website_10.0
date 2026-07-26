(function(){
  function getFallbackWidgetStrings() {
    const pageLang = (document.documentElement.lang || '').toLowerCase();
    const isEnglish = pageLang.startsWith('en') || window.location.pathname.startsWith('/eng/');
    const isRussian = pageLang.startsWith('ru') || window.location.pathname.startsWith('/rus/');
    if (isEnglish) {
      return {
        title: 'AI Assistant',
        body: 'Hello! How can I help?',
        placeholder: 'Send a message...',
        send: 'Send'
      };
    }
    if (isRussian) {
      return {
        title: 'AI Ассистент',
        body: 'Привет! Как помочь?',
        placeholder: 'Напишите сообщение...',
        send: 'Отправить'
      };
    }

    return {
      title: 'AI Asistan',
      body: 'Merhaba! Nasıl yardımcı olabilirim?',
      placeholder: 'Bir mesaj yazın...',
      send: 'Gönder'
    };
  }

  function createPanel(){
    if (document.querySelector('.ai-widget-panel')) return document.querySelector('.ai-widget-panel');
    const strings = getFallbackWidgetStrings();
    const panel = document.createElement('div');
    panel.className = 'ai-widget-panel';
    panel.setAttribute('role','dialog');
    panel.innerHTML = `
      <div class="ai-widget-header">
        <strong>${strings.title}</strong>
        <button class="ai-close" aria-label="Close">✕</button>
      </div>
      <div class="ai-widget-body">${strings.body}</div>
      <div class="ai-widget-input">
        <input type="text" placeholder="${strings.placeholder}" aria-label="Message input">
        <button class="ai-send">${strings.send}</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('.ai-close').addEventListener('click', ()=>{
      panel.classList.remove('open');
    });

    panel.querySelector('.ai-send').addEventListener('click', ()=>{
      const input = panel.querySelector('.ai-widget-input input');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      const body = panel.querySelector('.ai-widget-body');
      const p = document.createElement('div');
      p.className = 'ai-user-msg';
      p.textContent = text;
      body.appendChild(p);
      input.value = '';
      body.scrollTop = body.scrollHeight;
    });

    return panel;
  }

  function togglePanel(){
    // Prefer existing unified widget if available
    if (openUnifiedWidget()) return;

    const panel = createPanel();
    panel.classList.toggle('open');
  }

  // Try to open the site's unified AI widget created by include.js
  function openUnifiedWidget(){
    try{
      const btn = document.getElementById('ai-widget-button');
      const unified = document.getElementById('ai-unified-widget');
      if (btn) {
        // reveal floating button when header toggle used
        try { btn.style.display = ''; } catch (e) {}
        btn.click();
        return true;
      }
      if (unified){
        // toggle unified widget; if there's a floating button, show it when opened
        unified.classList.toggle('open');
        try {
          const fb = document.getElementById('ai-widget-button');
          if (fb) fb.style.display = unified.classList.contains('open') ? '' : 'none';
        } catch (e) {}
        return true;
      }
    }catch(e){
      console.warn('openUnifiedWidget failed', e);
    }
    return false;
  }

  function init(){
    document.addEventListener('click', function(e){
      const t = e.target;
      if (t.closest && t.closest('.ai-widget-toggle')){
        e.preventDefault();
        togglePanel();
      }
    });

    // ensure toggle buttons exist on dynamically-included headers
    const observer = new MutationObserver(()=>{
      // no-op; click handler above is delegated to document
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
