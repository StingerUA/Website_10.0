/**
 * Детектирует тип хеддера (черный или белый логотип)
 * и добавляет соответствующий класс на html элемент
 */
(function() {
  function detectHeaderType() {
    const logoImg = document.querySelector('.header-logo.main-center-logo img');
    if (!logoImg) return;

    const src = logoImg.src.toLowerCase();
    
    // Если в src содержится "black", добавляем класс header-black
    if (src.includes('black')) {
      document.documentElement.classList.add('header-black');
    } else {
      document.documentElement.classList.add('header-white');
    }
  }

  // Запускаем при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectHeaderType);
  } else {
    detectHeaderType();
  }
})();
