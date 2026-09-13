// carousel.js — unified autoplay + pointer-drag scrolling for logo carousels
(function(){
  function initCarousel(carousel){
    if (!carousel) return;
    // make container scrollable and user-friendly
    carousel.style.overflowX = 'auto';
    carousel.style.overflowY = 'hidden';
    carousel.style.touchAction = 'pan-x';
    carousel.style.scrollBehavior = 'smooth';

    const track = carousel.querySelector('.carousel-track') || carousel.firstElementChild;
    // enable pointer drag
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    carousel.style.cursor = 'grab';

    carousel.addEventListener('pointerdown', (e) => {
      isDown = true;
      carousel.setPointerCapture?.(e.pointerId);
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
      carousel.style.cursor = 'grabbing';
      pauseAutoplay();
    });

    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = x - startX;
      carousel.scrollLeft = scrollLeft - walk;
    };

    carousel.addEventListener('pointermove', onMove);

    ['pointerup','pointercancel','pointerleave'].forEach(ev => {
      carousel.addEventListener(ev, (e) => {
        isDown = false;
        try { carousel.releasePointerCapture?.(e.pointerId); } catch(e){}
        carousel.style.cursor = 'grab';
        resumeAutoplay();
      });
    });

    // wheel to scroll horizontally (desktop)
    carousel.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        carousel.scrollLeft += e.deltaY || e.deltaX;
        pauseAutoplayTemporarily();
      }
    }, { passive: false });

    // Autoplay using requestAnimationFrame for smoothness and to allow interrupting
    let rafId = null;
    let lastTime = 0;
    let autoplay = true;
    let pausedUntil = 0;

    // px/sec (faster on mobile). Increased speeds for better visibility on desktop and mobile
    const speedPxPerSec = () => (window.innerWidth <= 900 ? 150 : 72);

    // Ensure autoplay starts after layout settles (helps when container has not yet measured sizes)
    setTimeout(() => { startAutoplay(); }, 120);
    function step(ts){
      if (!lastTime) lastTime = ts;
      const dt = ts - lastTime;
      lastTime = ts;

      if (autoplay && !isDown && Date.now() > pausedUntil) {
        const delta = (speedPxPerSec() * dt) / 1000;
        carousel.scrollLeft = carousel.scrollLeft + delta;
        // loop when at end
        if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1) {
          carousel.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    }

    function startAutoplay(){ if (!rafId) { lastTime = 0; rafId = requestAnimationFrame(step); } }
    function stopAutoplay(){ if (rafId) { cancelAnimationFrame(rafId); rafId = null; lastTime = 0; } }
    function pauseAutoplay(){ autoplay = false; }
    function resumeAutoplay(){ autoplay = true; }
    function pauseAutoplayTemporarily(){ pausedUntil = Date.now() + 1200; }

    // init
    startAutoplay();

    // wheel hint button (desktop only) — if present, wire click and keyboard
    const wrap = carousel.closest('.logo-carousel-wrap');
    if (wrap){
      const hint = wrap.querySelector('.carousel-wheel-hint');
      if (hint){
        hint.addEventListener('click', () => {
          carousel.scrollBy({ left: Math.round(carousel.clientWidth * 0.5), behavior: 'smooth' });
          pauseAutoplayTemporarily();
        });
        hint.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hint.click(); }
        });
      }
    }

    // expose pause/resume for debugging
    carousel.__carousel = { pauseAutoplay, resumeAutoplay, stopAutoplay, startAutoplay };
  }

  // Homepage hero: keep the existing image visible immediately, then fade to
  // the muted looping video only after the browser has fully loaded and begun
  // playing it. If loading/autoplay ever fails, the image simply remains.
  function initHeroVideo(){
    const holder = document.querySelector('.home-page .hero-image');
    if (!holder || holder.dataset.albaHeroVideo === '1') return;

    const poster = holder.querySelector('img');
    if (!poster) return;

    holder.dataset.albaHeroVideo = '1';
    holder.classList.add('alba-hero-media');
    injectHeroVideoStyles();

    const video = document.createElement('video');
    video.className = 'alba-hero-video';
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'none';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.disablePictureInPicture = true;
    holder.appendChild(video);

    video.src = '/assets/video/home-hero-original.mp4?v=20260913-original-quality';
    video.preload = 'auto';

    video.addEventListener('playing', () => {
      holder.classList.add('is-video-playing');
    }, { once: true });

    video.addEventListener('error', () => {
      holder.classList.remove('is-video-playing');
    }, { once: true });

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // If autoplay is blocked, keep the original poster visible.
      });
    }
  }

  function injectHeroVideoStyles(){
    if (document.getElementById('alba-home-hero-video-style')) return;
    const style = document.createElement('style');
    style.id = 'alba-home-hero-video-style';
    style.textContent = `
      .home-page .hero-image.alba-hero-media{
        position:relative;
        overflow:hidden;
        border-radius:24px;
        aspect-ratio:1 / 1;
        background:#020617;
      }
      .home-page .hero-image.alba-hero-media > img,
      .home-page .hero-image.alba-hero-media > .alba-hero-video{
        width:100%;
        height:100%;
        display:block;
        object-fit:cover;
        border-radius:inherit;
      }
      .home-page .hero-image.alba-hero-media > img{
        position:relative;
        z-index:1;
        opacity:1;
        transition:opacity .7s ease;
      }
      .home-page .hero-image.alba-hero-media > .alba-hero-video{
        position:absolute;
        inset:0;
        z-index:2;
        opacity:0;
        pointer-events:none;
        transition:opacity .7s ease;
      }
      .home-page .hero-image.alba-hero-media.is-video-playing > .alba-hero-video{opacity:1;}
      .home-page .hero-image.alba-hero-media.is-video-playing > img{opacity:0;}
      @media (prefers-reduced-motion: reduce){
        .home-page .hero-image.alba-hero-media > img,
        .home-page .hero-image.alba-hero-media > .alba-hero-video{transition:none;}
      }
    `;
    document.head.appendChild(style);
  }

  function initAll(){
    const carousels = document.querySelectorAll('.logo-carousel');
    carousels.forEach(initCarousel);
    initHeroVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
