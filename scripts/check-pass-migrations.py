#!/usr/bin/env python3
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "cloudflare-worker" / "migrations"
REQUIRED_TABLES = {
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
    "staff_offline_leases",
}
EXPECTED_EMPLOYEES = (
    "nncdecdgc@gmail.com",
    "idrisalbayrak10@gmail.com",
    "rikir8284@gmail.com",
)


def apply_pass_migrations(conn: sqlite3.Connection) -> None:
    for filename in (
        "0003_albaspace_pass_mvp.sql",
        "0004_albaspace_pass_atomic_guards.sql",
        "0007_add_staff_employees.sql",
        "0008_staff_offline_mode.sql",
    ):
        sql = (MIGRATIONS / filename).read_text(encoding="utf-8")
        conn.executescript(sql)


def validate(conn: sqlite3.Connection, label: str) -> None:
    actual_tables = {
        row[0]
        for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    }
    missing = REQUIRED_TABLES - actual_tables
    if missing:
        raise SystemExit(f"[{label}] Missing Pass tables after migration: {sorted(missing)}")

    for email in EXPECTED_EMPLOYEES:
        employee_role = conn.execute(
            """
            SELECT r.code
            FROM user_roles ur
            JOIN users u ON u.id = ur.user_id
            JOIN roles r ON r.id = ur.role_id
            WHERE lower(u.email) = lower(?) AND ur.revoked_at IS NULL
            """,
            (email,),
        ).fetchone()
        if not employee_role or employee_role[0] != "employee":
            raise SystemExit(f"[{label}] Employee RBAC seed missing for {email}")

    entitlement_columns = {
        row[1] for row in conn.execute("PRAGMA table_info(pass_entitlements)")
    }
    for column in ("last_request_id", "last_actor_user_id", "last_used_at"):
        if column not in entitlement_columns:
            raise SystemExit(f"[{label}] Missing atomic redemption column: {column}")

    audit_columns = {row[1] for row in conn.execute("PRAGMA table_info(audit_log)")}
    if "request_id" not in audit_columns:
        raise SystemExit(f"[{label}] Missing audit_log.request_id")

    fk_errors = list(conn.execute("PRAGMA foreign_key_check"))
    if fk_errors:
        raise SystemExit(f"[{label}] Foreign key check failed: {fk_errors[:5]}")


def integer_id_case() -> None:
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
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
        INSERT INTO users (google_id, email, name, avatar) VALUES
          ('google:test-employee', 'nncdecdgc@gmail.com', 'ALBA Employee', ''),
          ('google:test-idris', 'idrisalbayrak10@gmail.com', 'Idris', ''),
          ('google:test-rikir', 'rikir8284@gmail.com', 'Rikir', '');
        INSERT INTO products (slug) VALUES ('vr-mission-iss');
        """
    )
    apply_pass_migrations(conn)
    validate(conn, "integer users.id")
    conn.close()


def text_id_case() -> None:
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    # Historical AlbaSpace auth schema used TEXT users.id. This case verifies that
    # the add-only Pass migrations remain compatible with that D1 representation.
    conn.executescript(
        """
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          google_id TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          avatar TEXT
        );
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE
        );
        INSERT INTO users (id, google_id, email, name, avatar) VALUES
          ('usr_employee_1', 'google:test-employee', 'nncdecdgc@gmail.com', 'ALBA Employee', ''),
          ('usr_employee_2', 'google:test-idris', 'idrisalbayrak10@gmail.com', 'Idris', ''),
          ('usr_employee_3', 'google:test-rikir', 'rikir8284@gmail.com', 'Rikir', '');
        INSERT INTO products (slug) VALUES ('vr-mission-iss');
        """
    )
    apply_pass_migrations(conn)
    validate(conn, "text users.id")
    conn.close()


integer_id_case()
text_id_case()
print("ALBA Space Pass migrations: OK (INTEGER/TEXT ids + staff RBAC seeds)")
