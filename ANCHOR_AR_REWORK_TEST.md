# Проверка переделки single-image AR anchor

Дата: 2026-08-28

## Реализовано

- Пользовательское изображение якоря сохранено как `assets/ar/alba-table-anchor.jpeg`.
- Изображение скомпилировано локальным MindAR offline compiler в `assets/ar/alba-table-anchor.mind`.
- AR-сцена переведена на MindAR 1.2.5 + A-Frame 1.5.0 с одним `mindar-image-target="targetIndex: 0"`.
- Начальное меню скрыто; в верхней панели осталась единственная кнопка `Menü`.
- Первый realistic GLB назначается автоматически при загрузке сцены.
- Выбор названия блюда закрывает меню и назначает новый GLB на тот же единственный target.
- Drag, hand tracking, стрелки блюд, старый QR/anchor-panel и отдельные AR/camera buttons удалены из этого маршрута.
- Фото по короткому нажатию и видео до 30 секунд по длинному нажатию сохранены.
- Zoom оставлен без перемещения: wheel и pinch меняют только scale дочерней модели внутри `dish-anchor`.

## Локальный браузерный smoke-test

- `node --check assets/js/restaurant-ar.js`: PASS.
- `git diff --check`: PASS.
- Initial DOM: `menu-panel.hidden === true`, `topButtons === ["Menü"]`, initial `gltf-model` — `realistic-steak-board.glb`.
- Menu interaction: категория `TATLILAR` открылась; нажатие `Alba Kirazlı Pasta` закрыло меню и назначило `/assets/models/restaurant/realistic-dessert-cake.glb?v=anchor-2`.
- Zoom simulation after synthetic `targetFound`: scale changed from `0.28` to `0.3024`; no manual drag handler or movable card remains.
- Chromium sandbox reported `getUserMedia NotFoundError: Requested device not found`; physical camera, target detection and mobile ARCore were not available for verification in this environment.
- Browser console had the expected MindAR camera failure only; no new JavaScript syntax/runtime failure was observed before the fallback was shown.


## Live smoke-test после публикации

Commit `028a427` успешно прошёл CI и GitHub Pages deployment. GitHub предупредил об artifact size `1,410,229,571` bytes, то есть выше 1 GB; deployment всё же завершился успешно.

Live URL: `https://albaspace.com.tr/ar-restaurant/?v=anchor-2-live&fresh=1`.

На live-маршруте видны только верхняя кнопка `Menü`, центральная кнопка съёмки и status/fallback элементы; при начальной загрузке меню скрыто. Нажатие `Menü` показывает категории `ET YEMEKLERİ`, `TATLILAR`, `ÇORBALAR`, `İÇECEKLER` и кнопки названий блюд. В sandbox camera runtime не получает физическое устройство, поэтому появляется Turkish fallback `Kamera açılamadı`; это не является проверкой реального мобильного разрешения камеры или image tracking.


Live menu interaction также проверена: после выбора `TATLILAR` и `Alba Kirazlı Pasta` drawer меню закрылся, `#dish-model` получил `/assets/models/restaurant/realistic-dessert-cake.glb?v=anchor-2`, его `visible` остался `true`, а `#dish-anchor` сохранил единственный `targetIndex: 0`. Во время ожидания загрузки live UI показывает `Yemek kataloğu yükleniyor`.


Финальный live query `?v=anchor-2-final&fresh=20260828` также проверен после commit `e5fabc7`: `window.AFRAME === true`, MindAR system зарегистрирован, `#dish-anchor` имеет `targetIndex: 0`, `.mind` и initial steak GLB отвечают HTTP 200. Начальное `menu-panel.hidden === true`, верхняя панель содержит только `Menü`, `model-viewer` и `#hand-pointer` отсутствуют. Sandbox по-прежнему не имеет физической камеры, поэтому настоящий targetFound/ARCore сценарий на телефоне требует отдельной пользовательской проверки.
