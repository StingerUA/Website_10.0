# Albamen AI — бесплатный режим

## Цель

Этот режим сохраняет Albamen AI в production без обязательной платы за Azure. Azure OpenAI, Azure Speech, Azure AI Search и Azure AI Content Safety не включаются автоматически, потому что для них нельзя гарантировать постоянную бесплатную эксплуатацию. Текущий LLM-контур остаётся `Groq → Cloudflare Workers AI fallback`, а голос остаётся на Workers AI. Telegram-логирование пользовательского контента включено по решению владельца.

## Azure отключён в production

Ресурс `albaspace-translator-2026` в Azure Portal не используется. Endpoint `POST /api/translate` удалён и возвращает `404`, а любые Azure Translator настройки исключены из wrangler-конфига. Это сделано по прямому решению владельца.

Azure OpenAI, Azure Speech, Azure AI Search и Azure AI Content Safety можно рассматривать только как отдельные тестовые функции после подтверждения бюджета и лимитов. Ни одна из них не должна включаться через production-конфиг автоматически.

## Важная граница

Azure Free Account показывает временный кредит $200, который действует до 23 сентября 2026 года. Это не означает, что Azure OpenAI станет постоянным бесплатным сервисом. Поэтому `AZURE_OPENAI_*` отсутствуют из бесплатного wrangler-конфига, а `AI_PROVIDER` не переключается на Azure без отдельного осознанного решения.

Cloudflare Workers AI предоставляет бесплатную дневную квоту 10 000 Neurons. После превышения на бесплатном плане операции могут завершаться ошибкой, поэтому Worker должен сохранять дружелюбный fallback и не включать платный Workers plan автоматически.

## Внесённые бесплатные улучшения

- CORS ограничен доменами AlbaSpace вместо `*`.
- Для текста добавлены лимит тела и rate limit 40 запросов в минуту.
- Для голоса добавлены лимит тела и отдельный rate limit 8 запросов в минуту.
- Разрешены только языки `ru`, `tr`, `en`.
- `sessionId` нормализуется и ограничивается безопасным шаблоном.
- Telegram-логирование пользовательского контента включено по умолчанию; его можно отключить через `TELEGRAM_LOGGING_ENABLED=false`.
- История KV защищена от повреждённого JSON.
- Удалён Azure Translator route, чтобы он не мог случайно вызываться.

## Проверка перед production deploy

Сначала запустить `node cloudflare-worker/free-mode.smoke.mjs`. Затем проверить `node --check cloudflare-worker/divine-flower-a0ae-full-final.worker.js` и `git diff --check`.

Перед публикацией в Cloudflare необходимо проверить, что `ALLOWED_ORIGINS` содержит все реальные frontend-домены, а `TELEGRAM_TOKEN` и `TELEGRAM_CHAT_ID` добавлены только как Cloudflare secrets. Секреты никогда не помещаются в GitHub. Нельзя нажимать переход Azure на оплату по мере использования, если требование `$0` остаётся обязательным.

## Источники

- Azure Free Account: https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
- Azure Translator pricing: https://azure.microsoft.com/en-us/pricing/details/translator/
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Groq rate limits: https://console.groq.com/docs/rate-limits
