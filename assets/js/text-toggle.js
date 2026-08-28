/**
 * text-toggle.js
 * ───────────────────────────────────────────────────────────
 * Автоматически добавляет кнопку раскрытия/скрытия текста
 * на все страницы с <model-viewer>.
 * 
 * Поддерживает 3 языка: TR (Türkçe), EN (English), RU (Русский)
 * ───────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  function extrasDisabled() {
    return document.body && document.body.dataset.disableModelExtras === 'true';
  }

  if (extrasDisabled()) return;

  // Текст кнопки на 3 языках
  const STRINGS = {
    tr: {
      show: 'Metni göster',
      hide: 'Metni gizle'
    },
    en: {
      show: 'Show text',
      hide: 'Show less'
    },
    ru: {
      show: 'Показать текст',
      hide: 'Скрыть'
    }
  };

  function detectLanguage() {
    const pathname = (window.location && window.location.pathname) || '';
    if (pathname.startsWith('/eng/')) return 'en';
    if (pathname.startsWith('/rus/')) return 'ru';
    return 'tr';
  }

  function initTextToggle() {
    if (extrasDisabled()) return;
    // Проверяем, есть ли model-viewer на странице
    if (!document.querySelector('model-viewer')) {
      return;
    }

    const lang = detectLanguage();
    const strings = STRINGS[lang] || STRINGS.tr;

    // Ищем первый параграф (обычно описание модели)
    const mainP = document.querySelector('main p, .container p, p');
    if (!mainP) {
      // Если нет текста, всё равно добавляем пустую кнопку для консистентности
      addEmptyToggle(strings);
      return;
    }

    // Если текст уже обёрнут, выходим
    if (mainP.id === 'textContent') {
      return;
    }

    // Оборачиваем параграф в контейнер
    const wrapper = document.createElement('div');
    wrapper.id = 'textContent';
    mainP.parentNode.insertBefore(wrapper, mainP);
    wrapper.appendChild(mainP);

    // Инжектируем CSS (если ещё не добавлен)
    if (!document.getElementById('text-toggle-css')) {
      const style = document.createElement('style');
      style.id = 'text-toggle-css';
      style.textContent = `
        #textContent {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        #textContent.expanded {
          display: block;
        }
        .toggle-btn {
          display: block;
          margin: 10px auto 30px auto;
          padding: 12px 24px;
          background-color: rgb(29, 73, 105);
          color: #fff;
          border: 1px solid #4192cc;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .toggle-btn:hover {
          background-color: #0096ff;
          box-shadow: 0 0 15px rgba(0, 150, 255, 0.6);
        }
        @media (max-width: 480px) {
          .toggle-btn {
            padding: 10px 16px;
            font-size: 14px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Создаём кнопку
    const button = document.createElement('button');
    button.id = 'toggleBtn';
    button.className = 'toggle-btn';
    button.textContent = strings.show;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'textContent');

    // Вставляем кнопку после текстового контейнера
    wrapper.parentNode.insertBefore(button, wrapper.nextSibling);

    // Логика кнопки
    button.addEventListener('click', function () {
      const isExpanded = wrapper.classList.contains('expanded');
      wrapper.classList.toggle('expanded');
      button.setAttribute('aria-expanded', (!isExpanded).toString());
      button.textContent = isExpanded ? strings.show : strings.hide;
    });
  }

  function addEmptyToggle(strings) {
    if (extrasDisabled()) return;
    // Добавляем кнопку даже если нет текста (для консистентности дизайна)
    if (document.getElementById('toggleBtn')) {
      return;
    }

    if (!document.getElementById('text-toggle-css')) {
      const style = document.createElement('style');
      style.id = 'text-toggle-css';
      style.textContent = `
        #textContent {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        #textContent.expanded {
          display: block;
        }
        .toggle-btn {
          display: block;
          margin: 10px auto 30px auto;
          padding: 12px 24px;
          background-color: rgb(29, 73, 105);
          color: #fff;
          border: 1px solid #4192cc;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .toggle-btn:hover {
          background-color: #0096ff;
          box-shadow: 0 0 15px rgba(0, 150, 255, 0.6);
        }
        @media (max-width: 480px) {
          .toggle-btn {
            padding: 10px 16px;
            font-size: 14px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const button = document.createElement('button');
    button.id = 'toggleBtn';
    button.className = 'toggle-btn';
    button.textContent = strings.show;
    button.setAttribute('aria-expanded', 'false');
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'default';

    // Ищем место для вставки (после model-viewer или в конец контейнера)
    const modelViewer = document.querySelector('model-viewer');
    if (modelViewer && modelViewer.parentNode) {
      modelViewer.parentNode.insertBefore(button, modelViewer.nextSibling);
    } else {
      const container = document.querySelector('.container, main, [data-include]');
      if (container) {
        container.appendChild(button);
      }
    }
  }

  // Инициализируем при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextToggle);
  } else {
    initTextToggle();
  }
})();