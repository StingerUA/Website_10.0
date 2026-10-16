/* Minimal transparent ISS model-viewer on desktop homepages only.
   Other pages retain their narration, preloader, text toggle and full ISS explorer. */
(function () {
  'use strict';

  const desktopQuery = window.matchMedia('(min-width: 901px)');
  const descriptions = {
    tr: 'Uluslararası Uzay İstasyonu etkileşimli 3D modeli',
    en: 'Interactive 3D model of the International Space Station',
    ru: 'Интерактивная 3D-модель Международной космической станции',
    ar: 'نموذج ثلاثي الأبعاد تفاعلي لمحطة الفضاء الدولية'
  };
  const language = (document.documentElement.lang || 'tr').toLowerCase().slice(0, 2);
  const description = descriptions[language] || descriptions.tr;
  let panel = null;

  function ensureLibrary() {
    if (customElements.get('model-viewer') ||
        document.querySelector('script[data-home-iss-library]')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.0/model-viewer.min.js';
    script.dataset.homeIssLibrary = '1';
    document.head.appendChild(script);
  }

  function mount(hero) {
    if (panel) return;
    ensureLibrary();

    const aside = document.createElement('aside');
    aside.className = 'home-iss-showcase';
    aside.setAttribute('aria-label', description);

    const stage = document.createElement('div');
    stage.className = 'home-iss-stage';

    const viewer = document.createElement('model-viewer');
    // The very same model used on /iss/, shown directly over the looping Earth background.
    viewer.setAttribute('src', '/assets/models/iss.glb');
    viewer.setAttribute('data-model-name', 'iss');
    viewer.setAttribute('data-track', 'model_view');
    viewer.setAttribute('data-no-model-extras', 'true');
    viewer.setAttribute('alt', description);
    viewer.setAttribute('aria-label', description);
    viewer.setAttribute('loading', 'eager');
    viewer.setAttribute('reveal', 'auto');
    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('ar', '');
    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    // Standard model-viewer hand that wiggles horizontally, then disappears after interaction.
    // This is a short interaction hint, NOT continuous auto-rotation.
    viewer.setAttribute('interaction-prompt', 'auto');
    viewer.setAttribute('interaction-prompt-style', 'wiggle');
    viewer.setAttribute('interaction-prompt-threshold', '1200');
    // 147% -> 226% camera distance: the ISS appears about 35% smaller than before.
    viewer.setAttribute('camera-orbit', '35deg 65deg 226%');
    viewer.setAttribute('field-of-view', '45deg');
    viewer.setAttribute('environment-image', 'neutral');
    viewer.setAttribute('exposure', '1.2');

    viewer.addEventListener('error', () => {
      console.warn('[AlbaSpace homepage ISS] 3D model could not be loaded.');
    });

    stage.appendChild(viewer);
    aside.appendChild(stage);
    hero.appendChild(aside);
    panel = aside;
  }

  function init() {
    const hero = document.querySelector('body.home-page .home-main section.hero');
    if (!hero) return;

    function sync() {
      if (desktopQuery.matches) {
        mount(hero);
      } else if (panel) {
        panel.remove();
        panel = null;
      }
    }

    sync();
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', sync);
    else if (desktopQuery.addListener) desktopQuery.addListener(sync);

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else init();
})();
