(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'star-bg';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);

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
})();
