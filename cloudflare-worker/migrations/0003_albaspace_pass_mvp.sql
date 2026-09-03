-- ALBA Space Pass MVP — add-only migration for the existing auth D1 database.
-- Existing tables such as users/products/purchases are intentionally preserved.
-- Do not apply this migration to the 3D-model database.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO roles (code, name) VALUES
  ('customer', 'Customer'),
  ('employee', 'Employee'),
  ('admin', 'Administrator'),
  ('superadmin', 'Super Administrator');

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  granted_by INTEGER,
  granted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  revoked_at INTEGER,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id, revoked_at);

-- Initial employee requested for the festival workflow. The role is stored in D1,
-- not used as a frontend authorization check. If the user row does not exist when
-- the migration is applied, assign the role later through the admin endpoint/SQL.
INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by)
SELECT u.id, r.id, NULL
FROM users u
JOIN roles r ON r.code = 'employee'
WHERE lower(u.email) = lower('nncdecdgc@gmail.com');

CREATE TABLE IF NOT EXISTS experience_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  venue TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  starts_at INTEGER,
  ends_at INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','closed','cancelled')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS pass_product_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_amount INTEGER NOT NULL CHECK(price_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  sales_start_at INTEGER,
  sales_end_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(event_id, product_id),
  FOREIGN KEY (event_id) REFERENCES experience_events(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_pass_offers_event_active ON pass_product_offers(event_id, active);

CREATE TABLE IF NOT EXISTS product_entitlement_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  entitlement_code TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'use' CHECK(unit IN ('use','minute')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  day_no INTEGER,
  valid_from INTEGER,
  valid_until INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(offer_id, entitlement_code, day_no),
  FOREIGN KEY (offer_id) REFERENCES pass_product_offers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment','paid','cancelled','refunded')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','iban')),
  currency TEXT NOT NULL DEFAULT 'TRY',
  total_amount INTEGER NOT NULL CHECK(total_amount >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cancelled_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id) REFERENCES experience_events(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  offer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  unit_price INTEGER NOT NULL CHECK(unit_price >= 0),
  total_price INTEGER NOT NULL CHECK(total_price >= 0),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES pass_product_offers(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('cash','iban')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','reversed')),
  amount INTEGER NOT NULL CHECK(amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY',
  reference_code TEXT NOT NULL UNIQUE,
  bank_reference TEXT,
  note TEXT,
  confirmed_by INTEGER,
  confirmed_at INTEGER,
  cancelled_by INTEGER,
  cancelled_at INTEGER,
  reversed_by INTEGER,
  reversed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reversed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS passes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('inactive','active','revoked','expired')),
  activated_at INTEGER,
  expires_at INTEGER,
  revoked_at INTEGER,
  revoked_by INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id) REFERENCES experience_events(id) ON DELETE RESTRICT,
  FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_passes_user ON passes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passes_event_status ON passes(event_id, status);

CREATE TABLE IF NOT EXISTS pass_entitlements (
  id TEXT PRIMARY KEY,
  pass_id TEXT NOT NULL,
  entitlement_code TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'use' CHECK(unit IN ('use','minute')),
  total_quantity INTEGER NOT NULL CHECK(total_quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK(remaining_quantity >= 0),
  day_no INTEGER,
  valid_from INTEGER,
  valid_until INTEGER,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','used','disabled')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pass_entitlements_pass ON pass_entitlements(pass_id, status);

CREATE TABLE IF NOT EXISTS entitlement_usage (
  id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL,
  pass_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  actor_user_id INTEGER NOT NULL,
  request_id TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(actor_user_id, request_id),
  FOREIGN KEY (entitlement_id) REFERENCES pass_entitlements(id) ON DELETE RESTRICT,
  FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_entitlement_usage_pass ON entitlement_usage(pass_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pass_idempotency (
  scope TEXT NOT NULL,
  actor_user_id INTEGER NOT NULL,
  request_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(scope, actor_user_id, request_id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type, id DESC);
