(function () {
  // --- CONFIG ---
  var YM_ID = 105726731;

  function sendYM(goal, params) {
    try {
      if (typeof ym === 'function') {
        ym(YM_ID, 'reachGoal', goal, params || {});
      }
    } catch (e) {}
  }

  function sendGA(eventName, params) {
    try {
      if (typeof gtag === 'function') {
        gtag('event', eventName, params || {});
      }
    } catch (e) {}
  }

  // Универсальная отправка "в обе"
  function track(name, payload) {
    payload = payload || {};
    // Yandex goal names лучше короткие
    sendYM(name, payload);
    // GA4 event names лучше snake_case
    sendGA(name, payload);
  }

  // 1) Клики по элементам с data-track
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;

    var key = el.getAttribute('data-track');

    // Примеры полезных параметров
    var payload = {
      page_path: location.pathname
    };

    if (key === 'whatsapp') {
      payload.link_url = el.getAttribute('href') || '';
      track('whatsapp_click', payload);
      return;
    }

    // можно расширять под другие кнопки
    track(key, payload);
  }, true);

  // 2) Отправка форм
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.getAttribute) return;

    var key = form.getAttribute('data-track');
    if (!key) return;

    var payload = {
      page_path: location.pathname,
      form_name: form.getAttribute('data-form-name') || ''
    };

    track('form_submit', payload);
  }, true);

  // 3) Просмотр 3D модели (все model-viewer с data-track="model_view")
  //    Привязываем обработчик загрузки ко всем текущим и динамически добавленным элементам.
  function bindModelViewer(mv) {
    if (!mv || mv.__trackingBound) return;
    mv.__trackingBound = true;
    mv.addEventListener('load', function () {
      track('model_view', {
        page_path: location.pathname,
        model_name: mv.getAttribute('data-model-name') || ''
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('model-viewer[data-track="model_view"]').forEach(bindModelViewer);

    // Наблюдаем за динамическими вставками в DOM
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (records) {
        records.forEach(function (rec) {
          rec.addedNodes && rec.addedNodes.forEach(function (node) {
            if (!node || !node.querySelectorAll) return;
            node.querySelectorAll && node.querySelectorAll('model-viewer[data-track="model_view"]').forEach(bindModelViewer);
            // сам узел может быть model-viewer
            if (node.matches && node.matches('model-viewer[data-track="model_view"]')) bindModelViewer(node);
          });
        });
      });
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
    }
  });
})();
