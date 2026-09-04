# ALBA Space Pass MVP

This module extends the existing AlbaSpace auth D1 database. It does **not** replace `users`, `sessions`, `products`, or `purchases`, and it must not be applied to the separate 3D-model database.

## Architecture

`albaspace.com.tr` (GitHub Pages) → `api.albaspace.com.tr` (Cloudflare Worker) → existing `albaspace-db` D1.

New domain tables: RBAC, events, event-specific product offers, orders, payments, passes, entitlements, usage, idempotency and audit log.

Existing `products` remains the product catalogue. Cash/IBAN financial state lives in the new `orders` + `payments` tables. Existing `purchases` remains untouched.

## Files

- `pass-entry.js` — wraps the existing Worker stack and only intercepts `/api/pass/*`, `/api/staff/*`, `/api/admin/pass/*`.
- `pass-backend.js` — Pass API, staff workflow and admin configuration.
- `pass-offline-backend.js` — 20-minute signed Offline Staff session bootstrap + queued-action sync.
- `migrations/0003_albaspace_pass_mvp.sql` — add-only Pass schema.
- `migrations/0004_albaspace_pass_atomic_guards.sql` — atomic redemption markers + idempotent audit request IDs.
- `/experience-pass.html` — customer Experience selection.
- `/passes.html` — customer orders and QR Passes.
- `/staff-pass.html` — tablet-first staff payment/QR scanner UI with Offline Staff Mode.
- `/admin-pass.html` — event/offer/RBAC configuration.
- `/sw-pass-staff.js` — caches the staff UI so it can reopen during a temporary connection loss.

## Required Cloudflare configuration before deploy

### 1. Apply migrations to the existing auth database only

From `cloudflare-worker/`:

```bash
npx wrangler d1 execute albaspace-db --remote --file=migrations/0003_albaspace_pass_mvp.sql
npx wrangler d1 execute albaspace-db --remote --file=migrations/0004_albaspace_pass_atomic_guards.sql
```

Do not run these against the 3D-model database.

### 2. Add the Pass signing secret

Generate a long random secret (at least 32 random bytes) and store it as a Cloudflare Worker secret. Never commit the value to GitHub.

```bash
npx wrangler secret put PASS_SIGNING_SECRET
```

The Worker derives a signed QR token from the Pass ID using HMAC-SHA256. The QR secret itself is therefore not stored as plaintext in D1.

### 3. Configure IBAN display values

`pass-backend.js` reads these optional Worker variables:

- `PAYMENT_IBAN`
- `PAYMENT_IBAN_NAME`
- `PAYMENT_BANK_NAME`

They are customer-visible payment instructions, not card checkout credentials. The system has no card/Stripe/PayPal flow.

Do not add placeholder IBAN values. Configure the real ALBA Space banking data before enabling IBAN orders.

### 4. Initial employee role

Migration `0003` grants `employee` to the existing user row for `nncdecdgc@gmail.com`, if that user already exists when the migration runs.

Verify after migration:

```sql
SELECT u.email, r.code
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE lower(u.email) = lower('nncdecdgc@gmail.com')
  AND ur.revoked_at IS NULL;
```

If the account was not present when the migration ran, grant the role after the user signs in. Admin accounts can later be added through `/admin-pass.html` once an initial admin role is assigned.

### 5. Product catalogue requirement

The repository only proves that the legacy `products` table contains at least `id` and `slug`; its full legacy CREATE TABLE definition is not committed. For that reason this implementation deliberately does not guess the other required columns or insert new rows into `products`.

Before creating festival offers, make sure the required Experience products exist in the existing `products` table. Then use `/admin-pass.html` to create event-specific price/entitlement configuration in `pass_product_offers`.

Suggested product slugs (only create them using the existing product-management mechanism after verifying the legacy schema):

- `vr-mission-iss`
- `sun-observation`
- `moon-observation`
- `telescope-vr-1day`
- `telescope-vr-2day`
- `combined-experience-pass`

Known prices from the current business brief:

- VR Mission: ISS, 5 min — 400 TRY
- Sun observation — 200 TRY
- Moon observation — 200 TRY
- 1 Day Telescope + VR — 500 TRY
- 2 Day Telescope + VR — 1000 TRY
- Combined Experience Pass — configurable later

The exact entitlement composition of bundled products remains configurable rather than hardcoded.

## Payment state machine

Order creation:

`pending_payment` → staff verifies real cash/IBAN receipt → `paid`.

Payment:

`pending` → staff confirmation → `confirmed`.

Pass:

`inactive` → confirmed payment → `active`.

The customer has no endpoint that can confirm their own payment.

## Staff workflow

1. Staff logs into the existing AlbaSpace account system.
2. Backend resolves the existing `albaspace_session`/Bearer session and loads `users.id`.
3. `/api/staff/*` checks D1 RBAC (`user_roles`).
4. Staff opens `/staff-pass.html` on a tablet/phone.
5. Cash/IBAN confirmation records the actor, timestamp, amount, method and request ID in `audit_log`.
6. Confirmation activates the pass and creates entitlement rows from the configured template.
7. QR scan resolves a server-signed token to a Pass ID.
8. Staff redeems only the selected entitlement.

## Offline Staff Mode v1

The staff UI can be prepared while online for a signed **20-minute offline transaction window**. The browser stores a compact event snapshot in IndexedDB and the service worker caches the staff UI assets.

During the 20-minute window, **any authorized staff tablet can perform any staff operation** supported by the offline snapshot. There are no Sun/Moon/VR/payment device assignments or zone leases. This is intentional for the current small-event operating model.

Offline-capable operations:

- scan/lookup an already-issued QR Pass from the cached snapshot;
- redeem Sun, Moon or VR entitlements;
- search cached customers/orders;
- view cached activity;
- queue confirmation of an already-existing pending Cash/IBAN payment.

Each offline write is stored locally with a unique `request_id`, device ID and timestamp. When connectivity returns, `/api/staff/offline/sync` replays the queued actions through the normal server-side Pass handlers, so D1 remains the final source of truth and the existing idempotency/atomic guards still apply.

If two offline tablets happen to act on the same final entitlement before either can see the other device's change, the first valid sync can succeed and the stale one is returned as a conflict instead of driving `remaining_quantity` below zero. For the current event profile this is treated as an operational edge case rather than a reason to restrict staff devices by zone.

After 20 minutes, the cached snapshot remains available for read-only lookup, but new offline redemptions and payment confirmations are rejected until the device reconnects and prepares a fresh 20-minute session.

Offline v1 deliberately does **not** create brand-new orders/Passes while disconnected. New Pass issuance still requires the backend.

## Double-spend protection

Entitlement redemption uses a conditional D1 update that requires the exact previously-read `remaining_quantity`, active Pass state, validity window and a new request ID. The same batch writes usage, audit and idempotency records only when the entitlement row was marked with that request ID.

Two tablets cannot both consume the same final unit successfully on the server: after one update changes the remaining quantity, the stale competing update fails with `ENTITLEMENT_REDEEM_CONFLICT` and the client must reload/retry.

## QR scanning support

`staff-pass.html` uses the browser `BarcodeDetector` API when available and provides manual Pass-token entry as a fallback. Customer QR rendering currently uses the browser-loaded `qrcodejs` library from cdnjs; before a high-security production rollout, vendoring a reviewed local QR renderer is preferable so Pass presentation does not depend on a third-party CDN.

## Current auth decision

The existing `localStorage` Bearer/session compatibility path is intentionally left unchanged for this phase, per project decision. Pass endpoints accept the same existing session model. No auth/session migration is included in this branch.

## Deployment order

1. Review and merge code.
2. Back up / export the auth D1 database.
3. Confirm existing Pass migrations are already applied to `albaspace-db`.
4. Confirm `PASS_SIGNING_SECRET` is configured.
5. Configure real IBAN variables if IBAN payment is enabled.
6. Deploy Worker from `cloudflare-worker/wrangler.toml` (`main = "pass-entry.js"`).
7. GitHub Pages deploys the staff PWA/service-worker assets.
8. Open the staff page online and use **Prepare 20 min** before relying on temporary offline operation.
9. Test: prepare → disconnect network → QR lookup/redeem → reconnect → sync → verify D1 state.

## Not deployed by this branch

This branch contains code only. Creating the branch/PR does not modify production D1 or deploy the Worker.
