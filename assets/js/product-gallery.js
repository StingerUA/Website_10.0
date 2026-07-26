document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-detail').forEach(pd => {
    const main = pd.querySelector(':scope > img');
    if (!main) return;
    const thumbs = pd.querySelectorAll('.product-gallery img');
    thumbs.forEach(t => {
      t.addEventListener('click', (ev) => {
        ev.preventDefault();
        const src = t.getAttribute('src');
        const alt = t.getAttribute('alt') || main.getAttribute('alt') || '';
        if (src) {
          main.setAttribute('src', src);
          main.setAttribute('alt', alt);
          // update add-to-cart button image reference if present
          const btn = pd.querySelector('#addToCartBtn');
          if (btn) btn.dataset.productImage = src;
        }
      });
    });
  });
});
