CREATE TABLE IF NOT EXISTS orbital_content_cache (
  cache_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  refreshed_at INTEGER NOT NULL
);
