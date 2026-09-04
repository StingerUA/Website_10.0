(function () {
  // Инжектируем стили через <style> с !important — перебивают site.css
  const style = document.createElement('style');
  style.textContent = `
    #star-bg {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: -1 !important;
      display: block !important;
    }
    body {
      background-image: none !important;
    }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.id = 'star-bg';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, stars;
  const mouse = { x: -999, y: -999 };

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkStar() {
    const depth = Math.random();
    return {
      x: Math.random() * W, y: Math.random() * H,
      ox: 0, oy: 0, vx: 0, vy: 0,
      r: 0.3 + depth * 1.6,
      alpha: 0.2 + depth * 0.8,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.01 + Math.random() * 0.03,
      color: Math.random() > 0.85
        ? 'rgba(180,210,255,'
        : Math.random() > 0.5
          ? 'rgba(200,230,255,'
          : 'rgba(255,255,255,',
      depth
    };
  }

  function init() {
    resize();
    const count = Math.min(Math.floor(W * H / 900), 400);
    stars = Array.from({ length: count }, mkStar);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.twinkle += s.twinkleSpeed;
      const tw = 0.7 + 0.3 * Math.sin(s.twinkle);
      const dx = s.x - mouse.x;
      const dy = s.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const R = 100 + s.depth * 60;
      if (dist < R && dist > 0) {
        const force = (1 - dist / R) * (3 + s.depth * 2);
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
      }
      s.vx *= 0.92; s.vy *= 0.92;
      s.ox += s.vx * 0.04; s.oy += s.vy * 0.04;
      s.ox *= 0.97; s.oy *= 0.97;
      const px = s.x + s.ox;
      const py = s.y + s.oy;
      if (s.r > 1.0) {
        const g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 2.5);
        g.addColorStop(0, s.color + (s.alpha * tw) + ')');
        g.addColorStop(1, s.color + '0)');
        ctx.beginPath();
        ctx.arc(px, py, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color + (s.alpha * tw) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  });
  window.addEventListener('resize', init);
  init();
  draw();

  // Educational model pages already load particles.js after their content.
  // Use that reliable execution point to start/refresh the shared story-card enhancer.
  (function loadStoryCardsFromParticles() {
    try {
      const path = String(window.location.pathname || '').toLowerCase();
      const excluded = /\/(?:ar-restaurant|game|games|scanner)(?:\/|$)/.test(path) ||
        /\/(?:shop|cart|account|favorites|orders)(?:\.html|\/|$)/.test(path) ||
        /\/product-[^/]+(?:\.html|\/|$)/.test(path) ||
        /\/found-models\.html$/.test(path);
      if (excluded) return;

      const viewer = document.querySelector('model-viewer');
      if (!viewer) return;

      const root = viewer.closest('.container') || viewer.parentElement;
      if (!root) return;

      const paragraphs = Array.from(root.querySelectorAll('p'));
      const hasLongAlbamanStory = paragraphs.some((p) => {
        const html = String(p.innerHTML || '');
        const breaks = html.match(/<br\s*\/?\s*>/gi) || [];
        return breaks.length >= 3;
      }) || paragraphs.length >= 4 || !!root.querySelector('.atlas-story-cards');

      if (!hasLongAlbamanStory) return;

      if (window.AlbaStoryCards && typeof window.AlbaStoryCards.refresh === 'function') {
        window.AlbaStoryCards.refresh();
        return;
      }

      const existing = Array.from(document.scripts).some((script) =>
        String(script.src || '').includes('/assets/js/atlas-story-cards.js')
      );
      if (existing) return;

      const story = document.createElement('script');
      story.src = '/assets/js/atlas-story-cards.js?v=20260904-5';
      story.defer = true;
      story.setAttribute('data-atlas-story-cards-direct', 'true');
      (document.head || document.documentElement).appendChild(story);
    } catch (err) {
      console.warn('[particles] story cards bootstrap failed', err);
    }
  })();
})();
