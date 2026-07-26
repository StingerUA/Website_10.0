(function () {
  function hide() {
    const el = document.getElementById('preloader');
    if (!el) return;
    el.classList.add('is-hidden');
    // можно удалить из DOM после анимации
    setTimeout(() => el.remove(), 600);
  }

  // Скрывать строго после полной загрузки (картинки/видео/шрифты)
  window.addEventListener('load', hide, { once: true });

  // Если скрипт загрузился уже после события load, прячем мгновенно
  if (document.readyState === 'complete') {
    hide();
  }

  // Страховка: если load почему-то не приходит
  setTimeout(hide, 8000);
})();
