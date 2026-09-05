let schemaReady = false;
let schemaPromise = null;

export async function ensurePasswordResetSchema(env) {
  if (schemaReady) return;
  if (!env.DB) throw new Error('D1 binding DB is unavailable');
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_google_id TEXT NOT NULL,
        email TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
        ON password_reset_tokens(user_google_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry
        ON password_reset_tokens(expires_at);
      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        rate_key TEXT PRIMARY KEY,
        window_started_at INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_updated
        ON auth_rate_limits(updated_at);
    `);
    schemaReady = true;
  })();

  try {
    await schemaPromise;
  } finally {
    if (!schemaReady) schemaPromise = null;
  }
}
