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


  // Homepage video: one video element, displayed as a fixed background on
  // desktop and in the original square hero tile on mobile. Never run two
  // simultaneous decoders for the same large source video.
  function initHeroVideo(){
    const holder = document.querySelector('.home-page .hero-image');
    if (!holder || holder.dataset.albaHeroVideo === '1') return;

    const poster = holder.querySelector('img');
    if (!poster) return;

    holder.dataset.albaHeroVideo = '1';
    holder.classList.add('alba-hero-media');
    injectHeroVideoStyles();

    const desktop = window.matchMedia('(min-width: 901px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const backdrop = document.createElement('div');
    backdrop.className = 'alba-home-video-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.hidden = !desktop.matches;

    const backgroundPoster = document.createElement('img');
    backgroundPoster.src = poster.getAttribute('src');
    backgroundPoster.alt = '';
    backgroundPoster.decoding = 'async';
    backdrop.appendChild(backgroundPoster);
    document.body.prepend(backdrop);

    const video = document.createElement('video');
    video.className = 'alba-hero-video';
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.disablePictureInPicture = true;
    video.src = '/assets/video/home-hero-original.mp4?v=20260913-original-quality';

    let playing = false;
    function updateVisibility(){
      backdrop.classList.toggle('is-video-playing', playing && desktop.matches && !reducedMotion.matches);
      holder.classList.toggle('is-video-playing', playing && !desktop.matches && !reducedMotion.matches);
    }
    function playIfAllowed(){
      if (document.hidden || reducedMotion.matches) {
        video.pause();
        updateVisibility();
        return;
      }
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => {
          playing = false;
          updateVisibility();
        });
      }
    }
    function placeVideo(){
      const onDesktop = desktop.matches;
      backdrop.hidden = !onDesktop;
      const parent = onDesktop ? backdrop : holder;
      if (video.parentElement !== parent) parent.appendChild(video);
      updateVisibility();
      playIfAllowed();
    }

    video.addEventListener('playing', () => {
      playing = true;
      updateVisibility();
    });
    video.addEventListener('pause', () => {
      playing = false;
      updateVisibility();
    });
    video.addEventListener('error', () => {
      playing = false;
      updateVisibility();
    });
    if (desktop.addEventListener) desktop.addEventListener('change', placeVideo);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', playIfAllowed);
    document.addEventListener('visibilitychange', playIfAllowed);
    placeVideo();
  }

  function injectHeroVideoStyles(){
    if (document.getElementById('alba-home-hero-video-style')) return;
    const style = document.createElement('style');
    style.id = 'alba-home-hero-video-style';
    style.textContent = "\n  /* Hero media remains in its original square slot on mobile/tablet. */\n  .home-page .hero-image.alba-hero-media{\n    position:relative;\n    overflow:hidden;\n    border-radius:24px;\n    aspect-ratio:1 / 1;\n    background:#020617;\n  }\n  .home-page .hero-image.alba-hero-media > img,\n  .home-page .hero-image.alba-hero-media > .alba-hero-video{\n    display:block;\n    width:100%;\n    height:100%;\n    object-fit:cover;\n    border-radius:inherit;\n  }\n  .home-page .hero-image.alba-hero-media > img{\n    position:relative;\n    z-index:1;\n    opacity:1;\n    transition:opacity .7s ease;\n  }\n  .home-page .hero-image.alba-hero-media > .alba-hero-video{\n    position:absolute;\n    inset:0;\n    z-index:2;\n    opacity:0;\n    pointer-events:none;\n    transition:opacity .7s ease;\n  }\n  .home-page .hero-image.alba-hero-media.is-video-playing > .alba-hero-video{opacity:1}\n  .home-page .hero-image.alba-hero-media.is-video-playing > img{opacity:0}\n\n  /* Full-viewport fixed background only on desktop; poster is its fallback. */\n  body.home-page > .alba-home-video-backdrop{\n    position:fixed;\n    inset:0;\n    width:100%;\n    height:100%;\n    z-index:0;\n    pointer-events:none;\n    overflow:hidden;\n    background:#020617;\n    display:none;\n  }\n  body.home-page > .alba-home-video-backdrop[hidden]{display:none!important}\n  body.home-page > .alba-home-video-backdrop > img,\n  body.home-page > .alba-home-video-backdrop > .alba-hero-video{\n    position:absolute;\n    inset:0;\n    width:100%;\n    height:100%;\n    display:block;\n    object-fit:cover;\n    object-position:center top;\n  }\n  body.home-page > .alba-home-video-backdrop > img{opacity:1}\n  body.home-page > .alba-home-video-backdrop > .alba-hero-video{\n    opacity:0;\n    transition:opacity .9s ease;\n  }\n  body.home-page > .alba-home-video-backdrop.is-video-playing > .alba-hero-video{opacity:1}\n  body.home-page > .alba-home-video-backdrop::after{\n    content:\"\";\n    position:absolute;\n    inset:0;\n    z-index:2;\n    background:\n      linear-gradient(90deg,rgba(2,6,23,.88) 0%,rgba(2,6,23,.67) 42%,rgba(2,6,23,.35) 100%),\n      linear-gradient(180deg,rgba(2,6,23,.45),rgba(2,6,23,.16) 34%,rgba(2,6,23,.66) 100%);\n  }\n\n  @media (min-width:901px){\n    body.home-page > .alba-home-video-backdrop:not([hidden]){display:block}\n    body.home-page > .home-main,\n    body.home-page > [data-include]{position:relative;z-index:1}\n    body.home-page .hero{\n      grid-template-columns:minmax(0,1fr);\n      min-height:clamp(530px,75vh,820px);\n      align-items:center;\n    }\n    body.home-page .hero-image.alba-hero-media{display:none}\n    body.home-page .hero-content{\n      width:100%;\n      max-width:660px;\n      padding:0;\n      border:0;\n      border-radius:0;\n      background:transparent;\n      box-shadow:none;\n      -webkit-backdrop-filter:none;\n      backdrop-filter:none;\n    }\n    body.home-page .hero h1{\n      font-size:clamp(40px,4.1vw,58px);\n      color:#fff;\n      text-shadow:0 3px 20px rgba(0,0,0,.65);\n    }\n    body.home-page .hero .lead{\n      color:#d9e5f3;\n      max-width:590px;\n      text-shadow:0 2px 9px rgba(0,0,0,.7);\n    }\n    body.home-page .hero-stats{color:#c2d6e8}\n  }\n\n  @media (prefers-reduced-motion:reduce){\n    .home-page .hero-image.alba-hero-media > img,\n    .home-page .hero-image.alba-hero-media > .alba-hero-video,\n    body.home-page > .alba-home-video-backdrop > .alba-hero-video{\n      transition:none;\n    }\n  }\n";
    style.textContent += '\n@media (min-width:901px){body.home-page > [data-include^="/header"]{position:relative;z-index:30}}';
    document.head.appendChild(style);
  }

  function injectCompactLogoStyles(){
    if (!document.body.classList.contains('home-page')) return;
    if (document.getElementById('alba-home-logo-compact-style')) return;

    const style = document.createElement('style');
    style.id = 'alba-home-logo-compact-style';
    style.textContent = `
      body.home-page .logo-carousel-wrap{
        padding:15px 10px !important;
        margin:10px 0 30px !important;
      }
      body.home-page .logo-carousel{
        height:60px !important;
        margin-bottom:20px !important;
        padding-left:6px !important;
        padding-right:6px !important;
      }
      body.home-page .carousel-track{gap:7px !important;}
      body.home-page .logo-card{min-width:70px !important;}
      body.home-page .logo-card img{max-width:130px !important;}
      @media (max-width:900px){
        body.home-page .logo-carousel{height:55px !important;}
        body.home-page .carousel-track{gap:6px !important;}
        body.home-page .logo-card{min-width:40px !important;}
        body.home-page .logo-card img{max-width:110px !important;}
      }
    `;
    document.head.appendChild(style);
  }

  function initAll(){
    injectCompactLogoStyles();
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
