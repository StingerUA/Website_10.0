-- ALBA Space Pass follow-up guards after production identity/catalog cleanup.
-- Safe to re-run after the corresponding indexes already exist.

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique
ON users(google_id)
WHERE google_id IS NOT NULL AND trim(google_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique_ci
ON users(lower(email))
WHERE email IS NOT NULL AND trim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
ON products(slug)
WHERE slug IS NOT NULL AND trim(slug) <> '';

-- SQLite UNIQUE constraints treat NULL values as distinct. This expression index
-- makes non-day-specific entitlement templates unique as well.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlement_template_unique_nullsafe
ON product_entitlement_templates(offer_id, entitlement_code, COALESCE(day_no, 0));
