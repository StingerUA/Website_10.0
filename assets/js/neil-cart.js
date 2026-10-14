/**
 * Neil Armstrong Atlas: preserve the existing RASAT 50 TL purchase workflow.
 * This is deliberately separate from camera permissions and portrait recording.
 */
(() => {
  'use strict';
  const panel = document.querySelector('[data-neil-experience]');
  if (!panel) return;
  const lang = (document.documentElement.lang || 'tr').slice(0, 2);
  const l = {
    tr: ['Sepete Ekle', 'Sepete eklendi!'],
    en: ['Add to Cart', 'Added to cart!'],
    ru: ['В корзину', 'Добавлено в корзину!']
  }[lang] || ['Sepete Ekle', 'Sepete eklendi!'];

  const wrap = document.createElement('div');
  wrap.className = 'neil-cart-wrap';
  wrap.innerHTML = '<button type="button" class="neil-cart-button">🛒 ' +
    l[0] + '</button><span>50 TL</span><small class="neil-cart-feedback" aria-live="polite"></small>';
  panel.querySelector('.neil-model-panel')?.appendChild(wrap);
  const button = wrap.querySelector('button');
  const feedback = wrap.querySelector('small');
  button?.addEventListener('click', () => {
    const item = {
      id:'atlas-neil-armstrong', name:'Neil Armstrong — 3D Model', price:50,
      image:'/assets/images/neil-armstrong-atlas.svg',
      url:location.origin + (lang === 'ru' ? '/rus' : lang === 'en' ? '/eng' : '') +
        '/atlas/atlas-neil-armstrong/', qty:1
    };
    try {
      if (window.cartManager?.addItem) {
        window.cartManager.addItem(item);
      } else {
        const key='alba_space_cart_v1';
        const cart = JSON.parse(localStorage.getItem(key) || '[]');
        const old = cart.find(x => x.id === item.id);
        if (old) old.qty=(old.qty||1)+1;
        else cart.push(item);
        localStorage.setItem(key,JSON.stringify(cart));
      }
      feedback.textContent=l[1];
      setTimeout(()=>feedback.textContent='',2500);
    } catch(err) {
      console.warn('[Neil cart]',err);
      feedback.textContent = lang === 'ru' ? 'Не удалось обновить корзину.' :
        lang === 'en' ? 'Cart could not be updated.' : 'Sepet güncellenemedi.';
    }
  });
})();
