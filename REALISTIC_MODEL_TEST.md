# Realistic GLB browser smoke-test

## 2026-08-27 — single-file meshopt decode

Локальный маршрут: `http://127.0.0.1:4173/ar-restaurant/?v=decoded-steak-1&fresh=1`.

Для `assets/models/restaurant/realistic-steak-board.glb` исходный Tripo meshopt GLB был временно заменён декодированной копией, созданной скриптом `scripts/decompress-tripo-glb.mjs` через glTF Transform 4.4.2 и MeshoptDecoder. Выходной файл валиден как GLB 2.0, содержит PBR image/material metadata и больше не содержит `EXT_meshopt_compression`; сохранённое обязательное расширение — `KHR_mesh_quantization`.

В Chromium `document.querySelector('model-viewer').loaded === true`; модель визуально отображается в центре страницы. Консоль после загрузки не показала `GLTFLoader`/meshopt ошибок. Декодированный файл вырос с 3,844,872 до 13,106,996 байт, поэтому итоговый bundle будет заметно тяжелее.

Это только локальная проверка загрузчика. Права на публикацию Tripo-моделей отдельно не подтверждены и не считаются автоматически разрешёнными.

## DOM detail

После переключения стрелкой на второе мясное блюдо карточка показывает `2 / 3` и «Нарезка из гриль-стейка». Контроллер обновляет `model-viewer.src` property; исходный HTML-атрибут `getAttribute('src')` остаётся initial URL, поэтому smoke-test использует property. В Chromium `model-viewer.loaded === true` для второго блюда.

## Browser automation note

Попытка одним async-скриптом пройти meat+dессерты по 7 секунд на позицию превысила 30-секундный лимит браузерного вызова и была отменена. Это не является ошибкой GLB. Дальнейшая проверка должна выполняться короткими переходами с отдельным ожиданием/снимком для каждой позиции.

После чистой перезагрузки `decoded-all-1` вторая мясная позиция «Нарезка из гриль-стейка» (`2 / 3`) успешно загрузилась в Chromium: `model-viewer.src` указывает на `realistic-steak-slices.glb?v=realistic-1`, `loaded === true`.

Третья мясная позиция «Grilled Steak Board» (`3 / 3`) успешно загрузилась: `realistic-grilled-steak.glb?v=realistic-1`, `model-viewer.loaded === true`.

Десерт 1 «Торт Alba Cherry» (`1 / 3`) загрузился с `realistic-dessert-cake.glb?v=realistic-1`; `loaded === true`. Десерт 2 «Fruit Dessert Coupe» (`2 / 3`) загрузился с `realistic-fruit-dessert.glb?v=realistic-1`; `loaded === true`.

Десерт 3 «Berry Layer Cup» (`3 / 3`) загрузился с `realistic-layered-dessert-cup.glb?v=realistic-1`; `model-viewer.loaded === true`. Все три позиции meat и dessert прошли локальный браузерный переход.

Суп «Суп в керамической миске» (`1 / 1`) загрузился с `realistic-soup.glb?v=realistic-1`; `loaded === true`. Напиток 1 «Strawberry Yogurt» (`1 / 3`) загрузился с `realistic-yogurt-drink.glb?v=realistic-1`; `loaded === true`.

Напиток 2 «Alba Coffee» (`2 / 3`) загрузился с `realistic-coffee-cup.glb?v=realistic-1`; `loaded === true`. Напиток 3 «Strawberry Lemonade» (`3 / 3`) загрузился с `realistic-strawberry-lemonade.glb?v=realistic-1`; `loaded === true`. Таким образом, все 10 realistic-позиций во всех четырёх категориях прошли браузерный переход и загрузку.

Итоговая консоль после прохода по всем категориям содержит только успешные результаты переключения; сообщений `THREE.GLTFLoader`, `EXT_meshopt_compression` или `setMeshoptDecoder` нет. Физическая камера и native WebXR в sandbox не проверялись.

## Rights research checkpoint

Публичная страница Meshy Food & Drink заявляет CC0 для моделей каталога, но конкретные ранее скачанные Tripo-файлы происходят из отдельной галереи Tripo и не имеют на карточках явной CC0/CC-BY/redistribution-лицензии; это не считается достаточным основанием для републикации.

Официальный каталог Sloyd явно указывает CC BY 4.0 для 11 food-моделей, а карточка Burger by SimForge даёт прямой GLB, текст лицензии и обязательную атрибуцию. Найден бесплатный CC0 Food Kit GLB Pack на itch.io, основанный на Kenney Food Kit; страница предлагает «No thanks, just take me to the downloads» без оплаты и email, но автоматический переход к скачиванию в браузере пока не завершён.

Itch.io free path завершён: клик по «No thanks, just take me to the downloads» перенёс на одноразовый `/download/<token>` URL, где страница показывает `food-kit-glb-pack-200-free-cc0-3d-models-assets.zip` размером 1.1 MB. Оплата, email и платёжные кнопки не использовались. Файл можно подтвердить и скачать из browser download state.
