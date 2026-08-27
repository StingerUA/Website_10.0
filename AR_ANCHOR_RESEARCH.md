# Исследование привязки AR-меню к столу

Дата: 2026-08-27

## Выводы

1. Официальная документация Google указывает, что `<model-viewer ar>` на совместимом Android-устройстве запускает WebXR или Scene Viewer в зависимости от `ar-modes`; для AR нужны ARCore-совместимое устройство и Google Play Services for AR. WebXR поддержка зависит от браузера.
2. В официальных примерах model-viewer `ar-placement="wall"` задаёт тип поверхности для размещения. Для стола используется стандартное размещение на горизонтальной поверхности (`floor`). Само наличие атрибутов не запускает AR автоматически: пользователь должен инициировать AR-переход жестом/кнопкой, а браузер или Scene Viewer затем ищет поверхность.
3. Автоматическая «приклейка» модели к физическому столу в обычном camera overlay без WebXR hit-test/image-tracking API невозможна надёжно одним HTML/CSS. Для Yandex Browser и других неподдерживаемых браузеров нужен fallback.
4. WebXR image tracking остаётся ограниченно доступным и зависит от устройства/браузера/флагов, поэтому marker-режим можно использовать как подготовительный сценарий, но нельзя обещать одинаковое распознавание печатного изображения на всех телефонах без нативного AR API.

## Практическое решение

- Увеличить визуальный размер карточки модели в 2 раза относительно текущей controls-4 версии.
- Вернуть `ar`, `ar-modes="webxr scene-viewer quick-look"`, `ar-placement="floor"` и автоматически пытаться вызвать native AR после явного нажатия «Камера» только при наличии `modelViewer.canActivateAR`; если вызов не сработает, оставить текущий camera overlay и hand-tracking.
- Добавить локальный высококонтрастный SVG marker-инструкцию и режим «Якорь стола»: пользователь заранее фотографирует marker через страницу, снимок сохраняется/скачивается как калибровка. В браузерах без WebXR image tracking это будет визуальная калибровка/референс, а не настоящее отслеживание физического marker-а.

## Источники

- Google ARCore, «Augmented reality with `<model-viewer>`»: https://developers.google.com/ar/develop/webxr/model-viewer
- model-viewer, «Augmented Reality examples»: https://modelviewer.dev/examples/augmentedreality/
- Immersive Web, AR plane detection sample: https://immersive-web.github.io/webxr-samples/proposals/plane-detection.html
- Needle Engine, WebXR image tracking notes: https://engine.needle.tools/docs/how-to-guides/xr/image-tracking.html
