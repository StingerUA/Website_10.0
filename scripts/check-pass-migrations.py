#!/usr/bin/env python3
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "cloudflare-worker" / "migrations"

conn = sqlite3.connect(":memory:")
conn.execute("PRAGMA foreign_keys = ON")

# Minimal shape proven by current Worker code. We intentionally do not guess
# the rest of the legacy production schema.
conn.executescript(
    """
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      avatar TEXT
    );
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE
    );
    INSERT INTO users (google_id, email, name, avatar)
    VALUES ('google:test-employee', 'nncdecdgc@gmail.com', 'ALBA Employee', '');
    INSERT INTO products (slug) VALUES ('vr-mission-iss');
    """
)

for filename in ("0003_albaspace_pass_mvp.sql", "0004_albaspace_pass_atomic_guards.sql"):
    sql = (MIGRATIONS / filename).read_text(encoding="utf-8")
    conn.executescript(sql)

required_tables = {
    "roles",
    "user_roles",
    "experience_events",
    "pass_product_offers",
    "product_entitlement_templates",
    "orders",
    "order_items",
    "payments",
    "passes",
    "pass_entitlements",
    "entitlement_usage",
    "pass_idempotency",
    "audit_log",
}
actual_tables = {
    row[0]
    for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
}
missing = required_tables - actual_tables
if missing:
    raise SystemExit(f"Missing Pass tables after migration: {sorted(missing)}")

employee_role = conn.execute(
    """
    SELECT r.code
    FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE lower(u.email) = lower(?) AND ur.revoked_at IS NULL
    """,
    ("nncdecdgc@gmail.com",),
).fetchone()
if not employee_role or employee_role[0] != "employee":
    raise SystemExit("Initial employee RBAC seed was not applied")

entitlement_columns = {
    row[1] for row in conn.execute("PRAGMA table_info(pass_entitlements)")
}
for column in ("last_request_id", "last_actor_user_id", "last_used_at"):
    if column not in entitlement_columns:
        raise SystemExit(f"Missing atomic redemption column: {column}")

audit_columns = {row[1] for row in conn.execute("PRAGMA table_info(audit_log)")}
if "request_id" not in audit_columns:
    raise SystemExit("Missing audit_log.request_id")

print("ALBA Space Pass migrations: OK")
