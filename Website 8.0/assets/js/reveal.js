// Global reveal-on-scroll initializer
// Adds `.reveal` to common container elements and uses IntersectionObserver
// to apply the existing `.reveal.is-visible` animation used on the homepage.
(function(){
  function initReveal(){
    const selectors = [
      '.glass-box', '.glass-box--fit', '.card', '.category-card', '.product-card',
      '.product-info', '.detail-info', '.related-products', '.logo-carousel-wrap',
      '.hero', '.hero-image', '.product-detail', '.card-container', '.logo-card',
      '.product-list', '.product-page', '.page', '.section', 'section', 'article'
    ];

    const set = new Set();
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => set.add(el)));
    const items = Array.from(set);
    if (!items.length) return;

    items.forEach((item, index) => {
      if (!item.classList.contains('reveal')) item.classList.add('reveal');
      if (!item.dataset.direction) item.dataset.direction = index % 2 === 0 ? 'left' : 'right';
    });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px'
    });

    items.forEach((item, index) => {
      const delay = (item.dataset.direction === 'left') ? index * 0.02 : index * 0.025;
      item.style.setProperty('--reveal-delay', `${delay}s`);
      observer.observe(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
