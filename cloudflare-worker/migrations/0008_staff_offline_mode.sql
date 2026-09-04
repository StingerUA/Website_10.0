CREATE TABLE IF NOT EXISTS staff_offline_leases (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  zone TEXT NOT NULL,
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_offline_leases_scope_zone
ON staff_offline_leases(scope, zone);

CREATE INDEX IF NOT EXISTS idx_staff_offline_leases_expiry
ON staff_offline_leases(expires_at);

CREATE INDEX IF NOT EXISTS idx_staff_offline_leases_device
ON staff_offline_leases(device_id, expires_at);
