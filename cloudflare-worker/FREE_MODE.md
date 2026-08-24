# Albamen AI — бесплатный режим

## Цель

Этот режим сохраняет Albamen AI в production без обязательной платы за Azure. Azure OpenAI, Azure Speech, Azure AI Search и Azure AI Content Safety не включаются автоматически, потому что для них нельзя гарантировать постоянную бесплатную эксплуатацию. Текущий LLM-контур остаётся `Groq → Cloudflare Workers AI fallback`, а голос остаётся на Workers AI.

## Что подключено бесплатно

Ресурс `albaspace-translator-2026` в Azure Portal создан как Azure Translator и проверен на тарифе `F0 Бесплатный`. Microsoft указывает для F0 до 2 миллионов символов в месяц. Worker поддерживает endpoint `POST /api/translate`, но по умолчанию он выключен через `AZURE_TRANSLATOR_ENABLED = "false"`.

Для его включения необходимы только настройки в Cloudflare secrets/vars:

```text
AZURE_TRANSLATOR_ENABLED=true
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
AZURE_TRANSLATOR_REGION=<если регион требуется ресурсом>
AZURE_TRANSLATOR_KEY=<secret, не коммитить>
```

Worker самостоятельно ограничивает запросы перевода до 10 000 символов на один запрос, 20 запросов в минуту и 1,8 миллиона зарезервированных символов в месяц. Запас 200 000 символов оставлен для защиты от расхождения счётчиков и повторных запросов.

## Важная граница

Azure Free Account показывает временный кредит $200, который действует до 23 сентября 2026 года. Это не означает, что Azure OpenAI станет постоянным бесплатным сервисом. Поэтому `AZURE_OPENAI_*` отсутствуют из бесплатного wrangler-конфига, а `AI_PROVIDER` не переключается на Azure без отдельного осознанного решения.

Cloudflare Workers AI предоставляет бесплатную дневную квоту 10 000 Neurons. После превышения на бесплатном плане операции могут завершаться ошибкой, поэтому Worker должен сохранять дружелюбный fallback и не включать платный Workers plan автоматически.

## Внесённые бесплатные улучшения

- CORS ограничен доменами AlbaSpace вместо `*`.
- Для текста добавлены лимит тела и rate limit 40 запросов в минуту.
- Для голоса добавлены лимит тела и отдельный rate limit 8 запросов в минуту.
- Разрешены только языки `ru`, `tr`, `en`.
- `sessionId` нормализуется и ограничивается безопасным шаблоном.
- Telegram-логирование пользовательского контента выключено по умолчанию через `TELEGRAM_LOGGING_ENABLED`.
- История KV защищена от повреждённого JSON.
- Для Translator F0 добавлены endpoint, лимиты и graceful error handling.

## Проверка перед production deploy

Сначала запустить `node cloudflare-worker/free-mode.smoke.mjs`. Затем проверить `node --check cloudflare-worker/divine-flower-a0ae-full-final.worker.js` и `git diff --check`.

Перед публикацией в Cloudflare необходимо проверить, что `ALLOWED_ORIGINS` содержит все реальные frontend-домены. Секрет `AZURE_TRANSLATOR_KEY` добавляется только в Cloudflare и никогда не помещается в GitHub. Нельзя нажимать переход Azure на оплату по мере использования, если требование `$0` остаётся обязательным.

## Источники

- Azure Free Account: https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
- Azure Translator pricing: https://azure.microsoft.com/en-us/pricing/details/translator/
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Groq rate limits: https://console.groq.com/docs/rate-limits
