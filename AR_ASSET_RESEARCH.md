# Исследование новых 3D-моделей еды

Источник-кандидат: [Open Source 3D Assets](https://www.opensource3dassets.com/en) и связанный [GitHub-реестр](https://github.com/ToxSam/open-source-3D-assets).

Каталог заявляет 991+ GLB/glTF-ассетов, прямые загрузки и понятную маркировку лицензий; в репозитории указано, что CC0-коллекции можно использовать без обязательной атрибуции. Перед добавлением каждой модели нужно проверить конкретную запись лицензии и фактический формат файла.

Другие рассмотренные источники: Sketchfab, Free3D и Meshy/Polycam. Их выдача содержит бесплатные модели, но лицензия и стабильная прямая загрузка должны проверяться для каждой конкретной модели; поэтому при равном качестве приоритет отдаётся CC0-реестру.

## Проверенная модель 1: Banana

- Карточка: https://poly.pizza/m/ruOFtE0B6Z
- Автор: Quaternius
- Категория: Low Poly / Food & Drink / Fruit
- Формат: FBX/GLTF
- Лицензия: Public Domain (CC0), ссылка на https://creativecommons.org/publicdomain/zero/1.0/
- Карточка Poly Pizza предлагает бесплатную загрузку без обязательного входа.

## Проверенная модель 2: Cheeseburger

- Карточка: https://poly.pizza/m/eke7qcu_FR2
- Автор: Poly by Google
- Категория: Low Poly / Food & Drink / Hamburger / Burger
- Формат на карточке: OBJ/GLTF; на странице доступно отдельное скачивание GLB.
- Лицензия: Creative Commons Attribution 3.0, ссылка на https://creativecommons.org/licenses/by/3.0/
- Для публикации в репозитории добавлю атрибуцию автора и ссылку на карточку модели.

## Expansion search — 2026-08-27

Poly Pizza search found a concrete `Juice` model by Poly by Google at https://poly.pizza/m/f9zLzhRRkZg. Its page states OBJ/GLTF format and Creative Commons Attribution 3.0. The `Soup Bowl` search at https://poly.pizza/search/Soup%20Bowl listed `Bowl Soup` by Kenney, `Stew` by Kay Lousberg, and `Bowl Broth` by Kenney; each specific model page still needs an individual license check before download.

## Проверенная модель супа

`Bowl Soup` от Kenney: https://poly.pizza/m/GwyYbV6NNw. Карточка указывает категорию Food & Drink, формат OBJ/GLTF и Public Domain (CC0) с официальной ссылкой https://creativecommons.org/publicdomain/zero/1.0/.

## Added models

The new soup item is `Bowl Soup` by Kenney from https://poly.pizza/m/GwyYbV6NNw, published as Public Domain (CC0). The new drink item is `Juice` by Poly by Google from https://poly.pizza/m/f9zLzhRRkZg, published under Creative Commons Attribution 3.0; attribution is included in `assets/models/restaurant/THIRD_PARTY_NOTICES.md`.

## Realistic model search — Sketchfab

The Sketchfab `Free Food` collection lists realistic candidates including `Burger Realistic (Free)`, `Strawberry Ice Cream`, `Plate with chicken slices`, `Maccaroni`, and `Cupcake #RealityScan`. The `Burger Realistic (Free)` page is https://sketchfab.com/3d-models/burger-realistic-free-18e59d7dbd2243c69f469e0f056f44c4 and states 11.7k triangles, 6.5k vertices, downloadable free model, and Creative Commons Attribution 4.0. The browser download action opened a Sketchfab login wall, so no file was downloaded from this source without user credentials.

Polycam's food catalog contains photogrammetry-looking candidates such as KFC zinger burger, pepperoni pizza, Korean BBQ wings, cupcake, and a high-resolution homemade bread: https://poly.cam/3d-models/food. The public catalog says the models can be viewed/downloaded, but the pages inspected so far do not expose a clear redistribution license; these assets are not safe to commit until rights are individually confirmed.

A second check of the Sketchfab Burger Realistic page confirmed the model is explicitly downloadable and licensed CC Attribution 4.0, but the browser's download control opens a login modal. The API probe also returned a protected response, so this source will not be used without user authentication or a separately published direct asset URL.

## Strong candidate: Sloyd

Sloyd's food catalog states that its 11 food models are available as GLB and released under CC BY 4.0, with commercial use allowed when credited: https://www.sloyd.ai/free-3d-models/props-items/food-drink. The `Burger` by SimForge is a strong realistic candidate: https://www.sloyd.ai/free-3d-models/model/burger-13pj3b1n. Its page exposes a direct GLB URL https://storage.googleapis.com/ai-services-quality/jobs/13pj3b1n.glb and displays a detailed textured burger preview rather than a low-poly placeholder.

A stronger soup candidate is `CC0 - Soup Bowl` by plaggy: https://sketchfab.com/3d-models/cc0-soup-bowl-0f9bbfa7baf14005b72b12335f9ef59b. The page displays CC0 1.0 Public Domain, 4096x4096 PBR textures, high-poly-baked normal map, glTF/USDZ formats, and about 2.3k triangles. The page still uses Sketchfab's download control, so it is a candidate only until a permitted direct download is available.

## Other realistic sources

iMeshh has realistic food/drink props with glTF/GLB packages and royalty-free commercial-use terms, but the free downloads require a user account and are delivered as packages through the iMeshh library: https://imeshh.com/assets/fruit-juice-jars. This makes it unsuitable for unattended asset retrieval in the current session unless the user provides login access. Free3D was also checked as a possible source, but its food listing did not render in the sandbox; no asset was downloaded from it.

Another soup candidate is `Bowl with Soup` by mornaista: https://sketchfab.com/3d-models/bowl-with-soup-de4ecf2c5040488ab98d214a0d9362cc. The page describes an import-ready model with bowl and soup textures, 4.9k triangles, and CC BY 4.0; however, the model download is still served through Sketchfab's login-protected workflow.

Meshy browser verification: the signed CDN `model.meshy` URL for Golden Pastry returned HTTP 200 from the page's browser context, and the browser downloaded a 785,368-byte `model.meshy` file. The file is not yet confirmed as standard GLB; it must be inspected/convered with an offline format-aware step before committing.

## Meshy format conversion

Meshy's official File Converter page https://www.meshy.ai/3d-tools/file-converter states that conversion is free, requires no login, runs in the browser, keeps files on-device, and supports standard 3D formats including OBJ, FBX, GLTF, GLB, USDZ, STL and others with a 50 MB 3D-model limit. The downloaded Meshy community asset is a proprietary `MESHY.AI` binary rather than a standard GLB; the converter upload control accepts standard formats but does not list `.meshy`, so it cannot be assumed to convert this file directly.

## Tripo public gallery candidates

Tripo's public gallery lists free downloadable GLB/FBX/OBJ/USDZ models in food, steak, dessert, drink and coffee categories. A checked model `soup in bowl 3d model` by `vanurakash` has tags `food realistic` and `food rendering realistic`, topology 598,562 triangles / 310,234 vertices, and a public signed `tripo_model_..._meshopt.glb` URL exposed by the gallery detail endpoint. The detail page's Export dialog defaulted to GLB and 4K texture resolution, but the public model page did not expose a clear copyright license; this should be stated honestly if the model is used.

Tripo gallery candidate IDs from public pages:
- Steak: e7102eae-6e2f-472a-baa9-f4e85418e78a (`beef steak on wooden board with rosemary asparagus garlic and cherry`), 3a80a847-44b3-4615-b5b2-89ed20820c5a (`seared steak slices on a plate with vegetables`), 86f15d93-a867-4fae-806f-31e98b7a4e62 (`grilled steak with peppers and flatbread on a wooden round board`).
- Drink: 701644a5-0269-42f1-abd8-c1a80d73b414 (`yogurt drink bottle`), 0fb6e6c1-4f69-4428-b4f1-cc0d8230e97b (`strawberry lemonade`).
- Dessert: 03072488-b3cc-4fa2-bfdf-a2139015b258 (`cake with white icing and cherries`), ca56f6c4-94a6-41fe-b96f-a4dea24b7359 (`dessert bowl with cantaloupe, ice cream, berries, whipped cream`), dffa0dc4-4d2f-44e6-a2e5-705c3832c051 (`pink layered dessert cup`).
The public gallery presents these as free downloads in GLB/FBX/OBJ/USDZ/STL; individual cards require detail-endpoint checks for model URLs and ownership/license metadata.

## Public Tripo GLB retrieval

Tripo's public detail API is accessible in the official browser context and exposes `data.model_url` as a signed `.glb` URL. Direct curl requests receive 403, while an anchor click from the public Tripo page starts a browser download without using the Export dialog or credits. The first downloaded steak board is a valid standard glTF binary, 3,844,872 bytes; the second steak slices download completed as `tripo_model_d835a392-3fee-4e08-844e-78bea51d1609_meshopt.glb`, 6,593,308 bytes. Public gallery detail pages are free-download pages, but individual Tripo pages do not show an explicit CC0/CC-BY license; source/creator URLs will be recorded and this license ambiguity will not be hidden.

Tripo realistic drink card: `yogurt drink bottle 3d model` by `projectmili6829`, public project ID `701644a5-0269-42f1-abd8-c1a80d73b414`, page https://studio.tripo3d.ai/3d-model/bottle-with-pink-label-indicating-strawberry-yogurt-drink-701644a5-0269-42f1-abd8-c1a80d73b414. The page tags it `props realistic` and `props rendering realistic`, and its public detail endpoint is the source for the signed GLB.

Additional Tripo checks:
- `coffee cup 3d model` by `MadlockThell248`, project `c7cfcf01-c2d6-4910-9558-1288b4970c23`, page https://studio.tripo3d.ai/3d-model/brown-and-white-disposable-coffee-cup-with-brown-lid-and-abstract-wrap-c7cfcf01-c2d6-4910-9558-1288b4970c23; page labels it 4K/PBR and reports 1,947,786 faces / 1,002,973 vertices.
- `dessert cup 3d model` by `abraralrajhi0102`, project `dffa0dc4-4d2f-44e6-a2e5-705c3832c051`, page https://studio.tripo3d.ai/3d-model/pink-layered-dessert-cup-with-whipped-cream-and-toppings-two-cups-wit-dffa0dc4-4d2f-44e6-a2e5-705c3832c051; page labels it 4K/PBR and reports 41,194 faces / 23,408 vertices.
- `strawberry lemonade 3d model` by `alicanking111`, project `0fb6e6c1-4f69-4428-b4f1-cc0d8230e97b`, page https://studio.tripo3d.ai/3d-model/pink-and-yellow-layered-strawberry-lemonade-drink-in-a-clear-plastic-c-0fb6e6c1-4f69-4428-b4f1-cc0d8230e97b; page labels it `props realistic` and `props rendering realistic`.
- `dessert cake 3d model` by `MadlockThell248`, project `03072488-b3cc-4fa2-bfdf-a2139015b258`, page https://studio.tripo3d.ai/3d-model/cake-with-white-icing-and-cherries-on-top-layered-sponge-dessert-03072488-b3cc-4fa2-bfdf-a2139015b258.
- Chrome's download history shows one failed Tripo request, which will be excluded. Completed realistic GLBs currently have generated names (`tripo_model_*`, `tripo_pbr_model_*`, `tripo_base_model_*`) and validate as glTF 2.0 binaries with embedded Color/PBR/Normal images where available.


## Single-image anchor implementation — 2026-08-28

Для нового режима пользователь предоставил фотографию белого стола/поверхности: `assets/ar/alba-table-anchor.jpeg`. Я не изменял исходное изображение и не добавлял к нему стороннюю лицензию. Из него локально скомпилирован `assets/ar/alba-table-anchor.mind` с помощью offline compiler из MindAR 1.2.5. На странице используется один `mindar-image-target="targetIndex: 0"`; все десять realistic GLB назначаются дочернему объекту этого target, поэтому блюдо не получает свободного drag-перемещения.

Решение по realistic Tripo-ассетам принято пользователем как вариант 1: сохранить высокодетальные локальные GLB с attribution/source links и явным предупреждением о неподтверждённых правах на републикацию. Официальная страница тарифов Tripo указывает для Free-плана `Public Models · Non-Commercial Use`, а для Pro/Max/Team отдельно указывает `Commercial Use`: https://www.tripo3d.ai/pricing. Поэтому репозиторий не маркирует эти файлы CC0/CC BY и не делает юридического вывода о разрешённом коммерческом использовании.

Для совместимости с текущим браузерным `model-viewer`/glTF loader исходные meshopt-файлы были декодированы локально через `scripts/decompress-tripo-glb.mjs`; проверка `scripts/check-glb-extensions.py` подтверждает отсутствие `EXT_meshopt_compression` во всех десяти финальных файлах. MindAR/A-Frame runtime остаётся browser-only; физическая работа камеры и image tracking требует проверки на реальном телефоне и не может быть подтверждена в sandbox без камеры.
