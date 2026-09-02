# Third-party restaurant models and AR runtime

## Прежний визуальный якорь (legacy)

`assets/ar/alba-table-anchor.jpeg` — фотография, предоставленная владельцем сайта, а `assets/ar/alba-table-anchor.mind` — производный от неё target-файл прежней реализации MindAR. Текущий маршрут AR-меню эти файлы не загружает: поверхность стола определяется стандартным WebXR hit-test либо нативным просмотрщиком телефона. Файлы оставлены только как архив предыдущей реализации.

## Реалистичные модели меню

### Деревянная сервировочная доска

Вместо фарфоровой тарелки используется [Wooden Cutting Board](https://polyhaven.com/a/wooden_cutting_board) от Kuutti Siitonen (Poly Haven), распространяемая по лицензии [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). `wooden-cutting-board.glb` — локальная самодостаточная GLB-копия официальной glTF 2.0-модели с PBR-текстурами 1K. Геометрия, `.bin` и три текстуры скачаны по адресам из официального Poly Haven API, проверены по опубликованным MD5 и упакованы без изменения содержимого. В интерфейсе модель применяется как ресторанная доска для подачи блюд на гриле и во время работы страницы не зависит от внешнего CDN.

### Фарфоровая тарелка

`realistic-porcelain-plate.glb` — мобильная glTF 2.0-адаптация открытой модели [`bullet3/data/dinnerware/plate.obj`](https://github.com/bulletphysics/bullet3/blob/master/data/dinnerware/plate.obj). Сохранён измеренный профиль исходной посуды, радиальная сетка сглажена, а материал заменён на компактный PBR-фарфор без внешних текстур. Исходный набор `bullet3/data` распространяется с [разрешительной zlib-подобной лицензией Bullet](https://github.com/bulletphysics/bullet3/blob/master/data/LICENSE.txt); адаптация явно обозначена как изменённая версия. Модель тарелки используется под двумя первыми мясными блюдами и двумя первыми десертами.

Тарелка встроена в мобильные производные `ar/turkish-shish-kebab-plated.glb`, `ar/turkish-adana-kebab-plated.glb`, `ar/realistic-dessert-cake-plated.glb` и `ar/strawberry-chocolate-cake-plated.glb`. Благодаря этому подача остаётся частью сцены в WebXR, Android Scene Viewer и Apple Quick Look. Производные воспроизводимо собираются скриптом `scripts/compose-restaurant-serving-plates.mjs`; исходные модели блюд сохранены без замены. Третий десерт `ar/realistic-layered-dessert-cup.glb` намеренно показывается без тарелки.

### Турецкие блюда

`ar/turkish-shish-kebab.glb`, `ar/turkish-adana-kebab.glb` и `ar/turkish-lentil-soup.glb` созданы непосредственно для меню Alba Space скриптом `scripts/create-restaurant-turkish-dishes.mjs`. Это самостоятельные glTF 2.0-модели в физическом масштабе: шиш-кебаб состоит из трёх шампуров с мясом и запечёнными овощами, адана-кебаб дополнен питой, овощами и луком с сумахом, чечевичный суп подаётся в собственной керамической миске с лимоном и зеленью. Цвет, шероховатость и металлические свойства встроены как PBR-материалы; внешние изображения, текстуры и сетевые ресурсы не требуются. Модели не являются производными от скачанных сторонних 3D-файлов.

### Клубнично-шоколадный торт

`ar/strawberry-chocolate-cake.glb` — локальная оптимизированная копия модели [Strawberry Chocolate Cake](https://polyhaven.com/a/strawberry_chocolate_cake) от Kuutti Siitonen (Poly Haven), распространяемой по лицензии [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Официальные геометрия и PBR-текстуры разрешения 1K скачаны по адресам из Poly Haven API, проверены по опубликованным MD5, упакованы в самодостаточный GLB и сжаты Draco без внешних сетевых зависимостей. Эта текстурированная модель заменила прежний фруктовый десерт в турецком и русском меню.

В репозитории также сохранены десять локальных GLB-моделей, ранее скачанных из public gallery Tripo. Страницы Tripo показывали бесплатную загрузку и GLB/GLTF-экспорт; исходные локальные файлы декодированы из `EXT_meshopt_compression` для ПК-сцены. В каталоге `assets/models/restaurant/ar/` находятся производные мобильные копии с Draco-сжатием и физическим масштабом в метрах: 0,28 для мясных блюд и 0,56 для остальных. Локальное хранение означает, что во время показа блюда страница не зависит от CDN Tripo.

> **Важно о правах.** На проверенных индивидуальных карточках Tripo не была показана стандартная CC0, CC BY или другая явная лицензия, разрешающая перераспределение файлов. Поэтому ниже сохранены источники и имена создателей, но модели не объявляются CC0/CC BY и не должны считаться юридически очищенными для коммерческой републикации без дополнительного разрешения. Ссылка на официальный Tripo pricing также различает бесплатные public models и коммерческое использование платных планов. Это предупреждение намеренно не скрывается.

| Local file | Menu item | Creator shown on Tripo | Source card | Technical note |
|---|---|---|---|---|
| `realistic-steak-board.glb` | Alba Reserve Steak (legacy, больше не в меню) | `2670443414` | [Beef steak on wooden board](https://studio.tripo3d.ai/3d-model/beef-steak-on-wooden-board-with-rosemary-asparagus-garlic-and-cherry-e7102eae-6e2f-472a-baa9-f4e85418e78a) | Decoded glTF 2.0; embedded Color texture |
| `realistic-steak-slices.glb` | Izgara Steak Dilimleri (legacy, больше не в меню) | `asas940118` | [Seared steak slices](https://studio.tripo3d.ai/3d-model/seared-steak-slices-on-a-plate-with-vegetables-3a80a847-44b3-4615-b5b2-89ed20820c5a) | Decoded glTF 2.0; embedded Color texture |
| `realistic-grilled-steak.glb` | Izgara Steak Tahtası | `yassineboukottaya29` | [Grilled steak with peppers](https://studio.tripo3d.ai/3d-model/grilled-steak-with-peppers-and-flatbread-on-a-wooden-round-board-86f15d93-a867-4fae-806f-31e98b7a4e62) | Decoded glTF 2.0; embedded Color texture |
| `realistic-dessert-cake.glb` | Alba Kirazlı Pasta | `MadlockThell248` | [Dessert cake with icing and cherries](https://studio.tripo3d.ai/3d-model/cake-with-white-icing-and-cherries-on-top-layered-sponge-dessert-03072488-b3cc-4fa2-bfdf-a2139015b258) | Decoded glTF 2.0; PBR Color/ORM/Normal textures |
| `realistic-fruit-dessert.glb` | Meyveli Kup (legacy, больше не в меню) | `kirgkb855` | [Fruit dessert bowl](https://studio.tripo3d.ai/3d-model/dessert-bowl-with-cantaloupe-ice-cream-berries-whipped-cream-and-mi-ca56f6c4-94a6-41fe-b96f-a4dea24b7359) | Decoded glTF 2.0; high-detail mesh without usable menu textures |
| `realistic-layered-dessert-cup.glb` | Orman Meyveli Kup | `abraralrajhi0102` | [Layered dessert cup](https://studio.tripo3d.ai/3d-model/pink-layered-dessert-cup-with-whipped-cream-and-toppings-two-cups-wit-dffa0dc4-4d2f-44e6-a2e5-705c3832c051) | Decoded glTF 2.0; PBR Color/ORM/Normal textures |
| `realistic-soup.glb` | Seramik Kasede Çorba (legacy, больше не в меню) | `vanurakash` | [Soup in bowl](https://studio.tripo3d.ai/3d-model/realstic-soup-in-bowl-816d98e6-212c-495c-b2aa-48609ca5a886) | Decoded glTF 2.0; source page reported 598,562 faces |
| `realistic-yogurt-drink.glb` | Çilekli Yoğurt | `projectmili6829` | [Yogurt drink bottle](https://studio.tripo3d.ai/3d-model/bottle-with-pink-label-indicating-strawberry-yogurt-drink-701644a5-0269-42f1-abd8-c1a80d73b414) | Decoded glTF 2.0; PBR Color/ORM/Normal textures |
| `realistic-coffee-cup.glb` | Alba Kahve | `MadlockThell248` | [Coffee cup](https://studio.tripo3d.ai/3d-model/brown-and-white-disposable-coffee-cup-with-brown-lid-and-abstract-wrap-c7cfcf01-c2d6-4910-9558-1288b4970c23) | Decoded glTF 2.0; source page reported 1,947,786 faces |
| `realistic-strawberry-lemonade.glb` | Çilekli Limonata | `alicanking111` | [Strawberry lemonade](https://studio.tripo3d.ai/3d-model/pink-and-yellow-layered-strawberry-lemonade-drink-in-a-clear-plastic-c-0fb6e6c1-4f69-4428-b4f1-cc0d8230e97b) | Decoded glTF 2.0; PBR Color/ORM/Normal textures |

## Дневная панорама ресторана

`assets/images/restaurant/warm-restaurant-day-2k.jpg` — оптимизированная до 2048×1024 локальная копия HDRI-панорамы [Warm Restaurant](https://polyhaven.com/a/warm_restaurant) от Poly Haven. Исходник распространяется по [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Панорама используется только как дневное окружение ПК-версии; стол и освещение создаются локальными примитивами A-Frame.

## Runtime dependencies

На мобильных устройствах маршрут использует локальную копию [Google `<model-viewer>`](https://modelviewer.dev/) 3.0.0 (Apache-2.0) с приоритетом WebXR и резервными режимами Android Scene Viewer / Apple Quick Look. WebXR использует стандартный hit-test поверхности и оценку освещения; фотография стола и серверное распознавание не применяются. A-Frame 1.5.0 загружается с официального CDN только для отдельной ПК-сцены виртуального ресторана.

Прежние `alba-table-anchor.svg`, JPEG/Mind target и старые low-poly restaurant files остаются в репозитории как legacy-ресурсы, но новый AR-маршрут их не использует.
