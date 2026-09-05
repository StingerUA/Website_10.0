# AlbaSpace password reset — free setup

This implementation uses the existing Cloudflare Worker + D1 auth system and Resend only as the outbound email transport.

## What is implemented

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- one-time 256-bit reset tokens
- only SHA-256 token hashes are stored in D1
- 30-minute default expiry
- previous reset links are invalidated when a new one is created
- successful password reset invalidates all existing sessions for the account
- email/account enumeration protection
- IP + email rate limiting
- Turkish, English, and Russian email/UI copy
- forgot-password and reset-password pages for TR/EN/RU
- automatic D1 schema initialization with `CREATE TABLE IF NOT EXISTS`

## 1. Resend domain

Add `albaspace.com.tr` under Resend Domains and configure the exact SPF/DKIM DNS records shown by Resend in Cloudflare DNS.

The domain must show as verified before production use.

## 2. Resend API key

In Cloudflare Dashboard:

Workers & Pages → `albaspace-api` → Settings → Variables and Secrets → Add

Create an encrypted secret named:

```text
RESEND_API_KEY
```

Never commit the value to GitHub.

The non-secret defaults are already present in `wrangler.toml`:

```text
PASSWORD_RESET_TTL_SECONDS=1800
PASSWORD_RESET_FROM=AlbaSpace <no-reply@albaspace.com.tr>
```

## 3. D1 schema

No manual D1 migration is required for deployment.

On the first request to `/auth/forgot-password` or `/auth/reset-password`, the Worker runs safe additive `CREATE TABLE IF NOT EXISTS` statements for:

- `password_reset_tokens`
- `auth_rate_limits`

The standalone `migrations/0008_password_reset.sql` file remains in the repository for environments that prefer explicit migrations, but it is optional.

## 4. Worker entrypoint

The feature uses:

```text
worker-auth.reset.index.js
```

This wrapper delegates all existing traffic and scheduled jobs to the current production `pass-entry.js`, preserving AlbaSpace Pass, avatar routes, LL2 refresh, auth, game routes and existing cron behaviour.

The feature branch `cloudflare-worker/wrangler.toml` already points to the wrapper and preserves the current production cron schedules and bindings.

## 5. Deploy

```bash
cd cloudflare-worker
wrangler deploy
```

## 6. Verification checklist

1. Open `/forgot-password.html`.
2. Enter a real email/password AlbaSpace account.
3. Confirm the UI always shows the generic success message.
4. Confirm the message arrives from the verified AlbaSpace domain.
5. Open the reset link from the email.
6. Set a password of at least 8 characters.
7. Confirm the same link cannot be used a second time.
8. Confirm the old password no longer works.
9. Confirm existing sessions for that account have been invalidated.
10. Repeat once from `/eng/forgot-password.html` and `/rus/forgot-password.html` to verify localization.

## Notes

Google-only accounts deliberately do not receive a password-reset email because they do not have an AlbaSpace password. The endpoint still returns the same generic response so it does not reveal how an email address is registered.
