-- Initial ALBA Space festival configuration.
-- Deliberately creates the event as DRAFT. Review the offers/entitlements before activation.
-- The Combined Experience Pass is intentionally not offered yet because its sale price is not final.

INSERT OR IGNORE INTO products (slug, type, price) VALUES
  ('vr-mission-iss', 'experience', 400),
  ('sun-observation', 'experience', 200),
  ('moon-observation', 'experience', 200),
  ('telescope-vr-1day', 'experience', 500),
  ('telescope-vr-2day', 'experience', 1000),
  ('combined-experience-pass', 'experience', 0);

INSERT OR IGNORE INTO experience_events
  (code, name, venue, timezone, status)
VALUES
  ('festival-2026', 'ALBA Space Festival 2026', '', 'Europe/Istanbul', 'draft');

INSERT OR IGNORE INTO pass_product_offers
  (event_id, product_id, title, description, price_amount, currency, active)
SELECT e.id, p.id, 'VR Space Experience — Mission: ISS', 'Mission: ISS VR experience, 5 minutes.', 400, 'TRY', 1
FROM experience_events e JOIN products p ON p.slug = 'vr-mission-iss'
WHERE e.code = 'festival-2026';

INSERT OR IGNORE INTO pass_product_offers
  (event_id, product_id, title, description, price_amount, currency, active)
SELECT e.id, p.id, 'Güneş Gözlemi', 'Teleskopla Güneş gözlemi.', 200, 'TRY', 1
FROM experience_events e JOIN products p ON p.slug = 'sun-observation'
WHERE e.code = 'festival-2026';

INSERT OR IGNORE INTO pass_product_offers
  (event_id, product_id, title, description, price_amount, currency, active)
SELECT e.id, p.id, 'Ay Gözlemi', 'Teleskopla Ay gözlemi.', 200, 'TRY', 1
FROM experience_events e JOIN products p ON p.slug = 'moon-observation'
WHERE e.code = 'festival-2026';

INSERT OR IGNORE INTO pass_product_offers
  (event_id, product_id, title, description, price_amount, currency, active)
SELECT e.id, p.id, '1 Gün Telescope + VR', '1 günlük teleskop ve VR paketi.', 500, 'TRY', 1
FROM experience_events e JOIN products p ON p.slug = 'telescope-vr-1day'
WHERE e.code = 'festival-2026';

INSERT OR IGNORE INTO pass_product_offers
  (event_id, product_id, title, description, price_amount, currency, active)
SELECT e.id, p.id, '2 Gün Telescope + VR', '2 günlük teleskop ve VR paketi.', 1000, 'TRY', 1
FROM experience_events e JOIN products p ON p.slug = 'telescope-vr-2day'
WHERE e.code = 'festival-2026';

-- Single VR: 5 minutes.
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'vr_minutes', 'VR — Mission: ISS', 'minute', 5, 1, 10
FROM pass_product_offers o
JOIN experience_events e ON e.id = o.event_id
JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'vr-mission-iss';

-- Single Sun observation.
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'sun_observation', 'Güneş Gözlemi', 'use', 1, 1, 10
FROM pass_product_offers o
JOIN experience_events e ON e.id = o.event_id
JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'sun-observation';

-- Single Moon observation.
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'moon_observation', 'Ay Gözlemi', 'use', 1, 1, 10
FROM pass_product_offers o
JOIN experience_events e ON e.id = o.event_id
JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'moon-observation';

-- One-day package: Sun + Moon + 5 VR minutes.
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'sun_observation', 'Güneş Gözlemi — Gün 1', 'use', 1, 1, 10
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-1day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'moon_observation', 'Ay Gözlemi — Gün 1', 'use', 1, 1, 20
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-1day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'vr_minutes', 'VR — Mission: ISS — Gün 1', 'minute', 5, 1, 30
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-1day';

-- Two-day working configuration: each day has Sun + Moon + 5 VR minutes.
-- This remains draft until the business rule is explicitly accepted.
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'sun_observation', 'Güneş Gözlemi — Gün 1', 'use', 1, 1, 10
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-2day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'moon_observation', 'Ay Gözlemi — Gün 1', 'use', 1, 1, 20
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-2day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'vr_minutes', 'VR — Mission: ISS — Gün 1', 'minute', 5, 1, 30
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-2day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'sun_observation', 'Güneş Gözlemi — Gün 2', 'use', 1, 2, 40
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-2day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'moon_observation', 'Ay Gözlemi — Gün 2', 'use', 1, 2, 50
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-2day';
INSERT OR IGNORE INTO product_entitlement_templates
  (offer_id, entitlement_code, label, unit, quantity, day_no, sort_order)
SELECT o.id, 'vr_minutes', 'VR — Mission: ISS — Gün 2', 'minute', 5, 2, 60
FROM pass_product_offers o JOIN experience_events e ON e.id = o.event_id JOIN products p ON p.id = o.product_id
WHERE e.code = 'festival-2026' AND p.slug = 'telescope-vr-2day';
