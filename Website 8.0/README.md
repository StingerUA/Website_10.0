# AlbaSpace-main2

## Model preloader localization

The site includes a shared model preloader that is injected for every `<model-viewer>` element by `assets/js/model-preloader.js`.

Features:
- Default language texts for Turkish (`tr`) and English (`en`). The script picks the language from `document.documentElement.lang` (falls back to `tr`).
- **Global override**: set `window.MODEL_PRELOADER_TEXTS` before the script runs to replace default texts per language:

## Deployment Status
Last push attempt: 2026-02-28
