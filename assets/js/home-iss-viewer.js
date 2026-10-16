/* AlbaSpace homepage ISS 3D showcase.
   Reuses the same /assets/models/iss.glb as /iss/.
   Mounts the model-viewer only for desktop, preserving mobile performance. */
(function () {
  'use strict';
  const desktopQuery = window.matchMedia('(min-width: 901px)');
  const strings = {
    tr: {
      title:'Uluslararası Uzay İstasyonu',
      hint:'Döndür · Yakınlaştır',
      link:'İstasyonu keşfet',
      loading:'3D istasyon yükleniyor…',
      failed:'3D modeli yüklenemedi',
      aria:'Uluslararası Uzay İstasyonu 3D modeli'
    },
    en: {
      title:'International Space Station',
      hint:'Rotate · Zoom',
      link:'Explore the station',
      loading:'Loading 3D station…',
      failed:'Could not load the 3D model',
      aria:'Interactive 3D model of the International Space Station'
    },
    ru: {
      title:'Международная космическая станция',
      hint:'Вращайте · Приближайте',
      link:'Исследовать станцию',
      loading:'Загрузка 3D-модели станции…',
      failed:'Не удалось загрузить 3D-модель',
      aria:'Интерактивная 3D-модель Международной космической станции'
    },
    ar: {
      title:'محطة الفضاء الدولية',
      hint:'تدوير · تكبير',
      link:'استكشف المحطة',
      loading:'جارٍ تحميل المحطة ثلاثية الأبعاد…',
      failed:'تعذر تحميل النموذج ثلاثي الأبعاد',
      aria:'نموذج ثلاثي الأبعاد تفاعلي لمحطة الفضاء الدولية'
    }
  };
  const language = (document.documentElement.lang || 'tr').toLowerCase().slice(0, 2);
  const t = strings[language] || strings.tr;
  const path = language === 'en' ? '/eng/iss/' :
    language === 'ru' ? '/rus/iss/' :
    language === 'ar' ? '/ar/iss/' : '/iss/';
  let panel = null;

  function ensureModelViewerLibrary() {
    if (customElements.get('model-viewer') ||
        document.querySelector('script[data-home-iss-library]')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.0/model-viewer.min.js';
    script.dataset.homeIssLibrary = '1';
    document.head.appendChild(script);
  }

  function createText(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function mount(hero) {
    if (panel) return;
    ensureModelViewerLibrary();

    const aside = document.createElement('aside');
    aside.className = 'home-iss-showcase';
    aside.setAttribute('aria-labelledby', 'home-iss-title');

    const heading = createText('div', 'home-iss-heading', '');
    const emblem = createText('span', 'home-iss-emblem', '✦');
    emblem.setAttribute('aria-hidden', 'true');
    const headings = createText('div', 'home-iss-heading-text', '');
    headings.appendChild(createText('div', 'home-iss-eyebrow', 'ALBASPACE / ORBITAL ATLAS'));
    const title = createText('h2', 'home-iss-title', t.title);
    title.id = 'home-iss-title';
    headings.appendChild(title);
    heading.append(emblem, headings);

    const stage = createText('div', 'home-iss-stage', '');
    const loading = createText('div', 'home-iss-loading', t.loading);
    loading.setAttribute('aria-live', 'polite');

    const viewer = document.createElement('model-viewer');
    viewer.setAttribute('src', '/assets/models/iss.glb');
    viewer.setAttribute('data-model-name', 'iss');
    viewer.setAttribute('data-track', 'model_view');
    viewer.setAttribute('alt', t.aria);
    viewer.setAttribute('aria-label', t.aria);
    viewer.setAttribute('loading', 'lazy');
    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('ar', '');
    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    viewer.setAttribute('auto-rotate', '');
    viewer.setAttribute('rotation-per-second', '3deg');
    viewer.setAttribute('interaction-prompt', 'none');
    viewer.setAttribute('camera-orbit', '35deg 65deg 110%');
    viewer.setAttribute('field-of-view', '45deg');
    viewer.setAttribute('environment-image', 'neutral');
    viewer.setAttribute('exposure', '1.2');
    viewer.addEventListener('load', () => {
      aside.classList.add('is-loaded');
    });
    viewer.addEventListener('error', () => {
      aside.classList.remove('is-loaded');
      aside.classList.add('is-error');
      loading.textContent = t.failed;
    });
    stage.append(loading, viewer);

    const footer = createText('div', 'home-iss-footer', '');
    const hint = createText('span', 'home-iss-hint', t.hint);
    const link = createText('a', 'home-iss-link', t.link + ' ↗');
    link.href = path;
    footer.append(hint, link);

    aside.append(heading, stage, footer);
    hero.appendChild(aside);
    panel = aside;
  }

  function init() {
    const hero = document.querySelector('body.home-page .home-main section.hero');
    if (!hero) return;

    function sync() {
      if (desktopQuery.matches) mount(hero);
      else if (panel) {
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
