# AlbaSpace Auth Worker

This folder contains a ready-to-deploy Cloudflare Worker for:

- Google OAuth login
- Session cookies
- `GET /me`
- `POST /logout`
- D1 storage for users and sessions

## Why the current login fails

`https://albaspace-api.nncdecdgc.workers.dev/auth/google` currently returns `401 invalid_client`.

That usually means one of these is wrong in the deployed Worker:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- the Google OAuth client was deleted
- the Google redirect URI does not exactly match the Worker callback URL

## Recommended domain setup

Use a custom Worker domain such as:

- `https://api.albaspace.com.tr`

This is better than `workers.dev` because your frontend is on:

- `https://albaspace.com.tr`

Using the same site family avoids third-party cookie problems. If you keep `workers.dev`,
some browsers may block the session cookie even when `credentials: "include"` is used.

## Google Cloud setup

Create a Google OAuth client of type `Web application`.

Use these values:

- Homepage URL: `https://albaspace.com.tr`
- Authorized JavaScript origins:
- `https://albaspace.com.tr`
- `https://www.albaspace.com.tr`
- `https://api.albaspace.com.tr`
- Authorized redirect URIs:
- `https://api.albaspace.com.tr/auth/google/callback`

If you deploy temporarily on `workers.dev`, then the redirect URI must instead be:

- `https://albaspace-api.nncdecdgc.workers.dev/auth/google/callback`

Important: the redirect URI in Google must exactly match `PUBLIC_BASE_URL + "/auth/google/callback"`.

## Cloudflare setup

1. Create a D1 database.
2. Apply `schema.sql`.
3. Copy `wrangler.toml.example` to `wrangler.toml`.
4. Replace `database_id`.
5. Add secrets:

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

6. Deploy:

```bash
wrangler deploy
```

7. Add a custom domain in Cloudflare for the Worker:

```text
api.albaspace.com.tr
```

## D1 schema

Tables:

- `users`
- `sessions`

The Worker automatically:

- upserts the Google user into `users`
- creates a session row in `sessions`
- returns the logged-in user from `/me`

## Routes

- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /me`
- `POST /logout`

## Orbital Atlas refresh worker

The Worker also serves the public Orbital Atlas routes `GET /api/orbital/overview` and `GET /api/orbital/iss-tle`. The overview remains live when upstream sources respond, while the `orbital_content_cache` D1 table preserves the last usable normalized response for fallback.

Apply `migrations/0002_orbital_content_cache.sql` (or the updated additive `schema.sql`) to the existing D1 database before deployment. The Wrangler configuration contains the UTC trigger `0 */5 * * *`; it invokes the Worker `scheduled()` handler every five hours and refreshes the stored snapshot without replacing a correct prior snapshot when every source fails.

After deployment, use **Workers & Pages → Worker → Settings → Trigger Events → View events** to review the last cron invocations. Cron configuration changes can take several minutes to propagate.

## Frontend changes after custom domain

After the Worker is live on `api.albaspace.com.tr`, update:

- `assets/js/worker-auth.js`

Change:

```js
const WORKER_AUTH_URL = "https://albaspace-api.nncdecdgc.workers.dev/auth/google";
const WORKER_ME_URL = "https://albaspace-api.nncdecdgc.workers.dev/me";
```

To:

```js
const WORKER_AUTH_URL = "https://api.albaspace.com.tr/auth/google";
const WORKER_ME_URL = "https://api.albaspace.com.tr/me";
```

## Quick verification checklist

After deployment, these should work:

- open `https://api.albaspace.com.tr/`
- open `https://api.albaspace.com.tr/auth/google`
- after Google login, return to `https://albaspace.com.tr/`
- call `https://api.albaspace.com.tr/me` with credentials

## If login still fails

Check:

- Client ID and Client Secret are the current values from Google Cloud
- redirect URI matches exactly
- OAuth consent screen is published
- test user is added if the app is still in testing mode


## AlbaSpace Game v0.2

Этот же Worker теперь может обслуживать игру через `/api/game/*`, используя ту же `albaspace_session`, что и основной сайт. Игровые комнаты сериализуются Durable Object `GameRoomDO`, а D1 хранит durable snapshot и audit events.

Перед деплоем примените обновлённый `schema.sql` к существующей D1 database и добавьте binding `GAME_ROOMS` из `wrangler.toml.example`. Entry point должен быть `worker-auth.index.js`; класс `GameRoomDO` экспортируется из этого entrypoint. Существующие Google OAuth secrets менять не нужно.

Основные маршруты игры: `POST /api/game/rooms`, `POST /api/game/rooms/join`, `GET /api/game/rooms/<roomId>/snapshot`, `GET /api/game/rooms/<roomId>/events` и `POST /api/game/rooms/<roomId>/command`. Realtime используется через авторизованный SSE-канал; каждая команда содержит `requestId`, а Durable Object предотвращает повторное выполнение одной и той же команды.

Для проверки логики без Cloudflare можно выполнить из корня репозитория:

```bash
node cloudflare-worker/tests/game-backend.smoke.mjs
```

Для рабочего запуска после применения D1 schema и настройки binding:

```bash
cd cloudflare-worker
wrangler deploy
```
