-- Companion migration for atomic entitlement redemption and idempotent audit records.
ALTER TABLE pass_entitlements ADD COLUMN last_request_id TEXT;
ALTER TABLE pass_entitlements ADD COLUMN last_actor_user_id INTEGER;
ALTER TABLE pass_entitlements ADD COLUMN last_used_at INTEGER;

ALTER TABLE audit_log ADD COLUMN request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_request
  ON audit_log(event_type, actor_user_id, request_id)
  WHERE request_id IS NOT NULL;
