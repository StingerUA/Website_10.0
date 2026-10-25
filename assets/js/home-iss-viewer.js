/* Minimal transparent random Atlas model-viewer on desktop homepages only.
   Other pages retain their narration, preloader, text toggle and full ISS explorer. */
(function () {
  'use strict';

  // Exactly one of six already-hosted GLBs is picked for each page load.
  // The viewer itself mounts only on desktop, so mobiles load no extra model.
  const models = [
    { id: 'iss', labels: {tr: 'Uluslararası Uzay İstasyonu', en: 'International Space Station', ru: 'Международная космическая станция', ar: 'محطة الفضاء الدولية'} },
    { id: 'gokturk-1', labels: {tr: 'GÖKTÜRK-1', en: 'GÖKTÜRK-1', ru: 'GÖKTÜRK-1', ar: 'غوكتورك-1'} },
    { id: 'rasat', labels: {tr: 'RASAT', en: 'RASAT', ru: 'RASAT', ar: 'راسات'} },
    { id: 'opportunity', labels: {tr: 'Opportunity', en: 'Opportunity', ru: 'Opportunity', ar: 'أوبورتيونيتي'} },
    { id: 'sojourner', labels: {tr: 'Sojourner', en: 'Sojourner', ru: 'Sojourner', ar: 'سوجورنر'} },
    { id: 'sputnik', labels: {tr: 'Sputnik', en: 'Sputnik', ru: 'Спутник', ar: 'سبوتنيك'} }
  ];
  const desktopQuery = window.matchMedia('(min-width: 901px)');
  const language = (document.documentElement.lang || 'tr').toLowerCase().slice(0, 2);
  let activeModel = models[Math.floor(Math.random() * models.length)];
  const modelLabel = model => model.labels[language] || model.labels.tr;
  function modelDescription(model) {
    const name = modelLabel(model);
    if (language === 'en') return 'Interactive 3D model: ' + name;
    if (language === 'ru') return 'Интерактивная 3D-модель: ' + name;
    if (language === 'ar') return 'نموذج ثلاثي الأبعاد تفاعلي: ' + name;
    return name + ' etkileşimli 3D modeli';
  }
  function modelPagePath(model) {
    if (model.id === 'iss') {
      return language === 'en' ? '/eng/iss/' : language === 'ru' ? '/rus/iss/' : '/iss/';
    }
    // Use the same detail pages linked by the Atlas free-preview cards.
    // Arabic currently shares the Turkish preview pages.
    const prefix = language === 'en' ? '/eng' : language === 'ru' ? '/rus' : '';
    return prefix + '/' + model.id + '/';
  }
  const arStrings = {
    tr: {
      button: 'AR ile aç',
      title: 'Modeli artırılmış gerçeklikte keşfet',
      help: 'Telefonunuzun kamerasıyla QR kodu tarayın. Açılan model sayfasındaki AR düğmesini kullanın.',
      link: '3D model sayfasını aç',
      close: 'Kapat',
      qr: 'QR kod yükleniyor…',
      unavailable: 'QR kod görüntülenemiyor. Aşağıdaki bağlantıyı kullanın.'
    },
    en: {
      button: 'View in AR',
      title: 'Explore this model in augmented reality',
      help: 'Scan this QR code with your phone, then use the AR button on the model page.',
      link: 'Open the 3D model page',
      close: 'Close',
      qr: 'Loading QR code…',
      unavailable: 'QR code unavailable. Use the link below.'
    },
    ru: {
      button: 'Открыть в AR',
      title: 'Посмотреть модель в дополненной реальности',
      help: 'Отсканируйте QR-код телефоном, затем нажмите кнопку AR на странице выбранной модели.',
      link: 'Открыть страницу 3D-модели',
      close: 'Закрыть',
      qr: 'Загрузка QR-кода…',
      unavailable: 'QR-код недоступен. Воспользуйтесь ссылкой ниже.'
    },
    ar: {
      button: 'عرض في الواقع المعزز',
      title: 'استكشف النموذج بالواقع المعزز',
      help: 'امسح رمز QR بهاتفك، ثم استخدم زر AR في صفحة النموذج.',
      link: 'افتح صفحة النموذج',
      close: 'إغلاق',
      qr: 'جارٍ تحميل رمز QR…',
      unavailable: 'رمز QR غير متاح. استخدم الرابط أدناه.'
    }
  };
  const arText = arStrings[language] || arStrings.tr;
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


  function createArButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-iss-ar-button';
    button.setAttribute('aria-label', arText.button);
    const symbol = document.createElement('span');
    symbol.className = 'home-iss-ar-symbol';
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = '◈';
    const label = document.createElement('span');
    label.textContent = arText.button;
    button.append(symbol, label);
    return button;
  }

  // Desktop browsers generally cannot launch native AR directly.
  // Offer a phone hand-off instead of displaying an AR button that does nothing.
  function showArHandoff() {
    let dialog = document.querySelector('dialog.home-iss-ar-dialog');
    // If a model failed and ISS became the fallback, refresh the QR target.
    if (dialog && dialog.dataset.modelId !== activeModel.id) {
      dialog.remove();
      dialog = null;
    }
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'home-iss-ar-dialog';
      dialog.setAttribute('aria-label', arText.title);
      dialog.dataset.modelId = activeModel.id;
      const wrap = document.createElement('div');
      wrap.className = 'home-iss-ar-dialog-content';
      const head = document.createElement('h2');
      head.textContent = arText.title + ': ' + modelLabel(activeModel);
      const help = document.createElement('p');
      help.textContent = arText.help;
      const qr = document.createElement('div');
      qr.className = 'home-iss-ar-qr';
      qr.setAttribute('aria-label', arText.qr);
      qr.textContent = arText.qr;
      const url = new URL(modelPagePath(activeModel), window.location.origin).href;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = arText.link + ' ↗';
      link.className = 'home-iss-ar-page-link';
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = arText.close;
      close.className = 'home-iss-ar-close';
      close.addEventListener('click', () => dialog.close());
      wrap.append(head, help, qr, link, close);
      dialog.appendChild(wrap);
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
      document.body.appendChild(dialog);

      const drawQr = () => {
        if (typeof window.QRCode !== 'function' || qr.dataset.ready === '1') return;
        qr.replaceChildren();
        try {
          new window.QRCode(qr, {
            text: url,
            width: 200,
            height: 200,
            correctLevel: window.QRCode.CorrectLevel.M
          });
          qr.dataset.ready = '1';
        } catch (e) {
          qr.textContent = arText.unavailable;
        }
      };
      if (typeof window.QRCode === 'function') {
        drawQr();
      } else {
        let script = document.querySelector('script[data-home-iss-qr-library]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
          script.async = true;
          script.dataset.homeIssQrLibrary = '1';
          document.head.appendChild(script);
        }
        script.addEventListener('load', drawQr, {once:true});
        script.addEventListener('error', () => {
          qr.textContent = arText.unavailable;
        }, {once:true});
      }
    }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function mount(hero) {
    if (panel) return;
    ensureLibrary();

    const aside = document.createElement('aside');
    aside.className = 'home-iss-showcase';
    aside.setAttribute('aria-label', modelDescription(activeModel));

    const stage = document.createElement('div');
    stage.className = 'home-iss-stage';

    const viewer = document.createElement('model-viewer');
    // Render the chosen existing Atlas GLB over the looping Earth background.
    viewer.setAttribute('src', '/assets/models/' + activeModel.id + '.glb');
    viewer.setAttribute('data-model-name', activeModel.id);
    viewer.setAttribute('data-track', 'model_view');
    viewer.setAttribute('data-no-model-extras', 'true');
    viewer.setAttribute('alt', modelDescription(activeModel));
    viewer.setAttribute('aria-label', modelDescription(activeModel));
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
    // Keep the generous zoom-out limit for manual inspection.
    // 113% is relative to the current model's bounding box.
    viewer.setAttribute('max-camera-orbit', 'auto auto 600%');
    viewer.setAttribute('camera-orbit', '35deg 65deg 113%');
    // Let model-viewer choose the FOV that best fits the station's bounding box.
    viewer.setAttribute('field-of-view', 'auto');
    viewer.setAttribute('environment-image', 'neutral');
    viewer.setAttribute('exposure', '1.2');

    viewer.addEventListener('error', () => {
      console.warn('[AlbaSpace homepage] Could not load 3D model:', activeModel.id);
      if (activeModel.id !== 'iss') {
        activeModel = models[0];
        viewer.setAttribute('src', '/assets/models/iss.glb');
        viewer.setAttribute('data-model-name', 'iss');
        viewer.setAttribute('alt', modelDescription(activeModel));
        viewer.setAttribute('aria-label', modelDescription(activeModel));
        aside.setAttribute('aria-label', modelDescription(activeModel));
      }
    });

    // Native model-viewer AR slot: used when a device supports WebXR/Scene Viewer/Quick Look.
    const nativeArButton = createArButton();
    nativeArButton.slot = 'ar-button';
    viewer.appendChild(nativeArButton);

    // On desktop (where native AR is generally unavailable), show a matching
    // persistent button at the lower-left with a phone QR hand-off.
    const desktopArButton = createArButton();
    desktopArButton.classList.add('home-iss-ar-desktop');
    desktopArButton.addEventListener('click', showArHandoff);

    const updateArAvailability = () => {
      desktopArButton.hidden = !!viewer.canActivateAR;
    };
    viewer.addEventListener('load', updateArAvailability);
    viewer.addEventListener('ar-status', updateArAvailability);
    if (window.customElements && window.customElements.whenDefined) {
      window.customElements.whenDefined('model-viewer').then(updateArAvailability);
    }

    stage.append(viewer, desktopArButton);
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
