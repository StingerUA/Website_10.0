-- One-click Uzaydash guest accounts and short-lived Google-link intents.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS quick_accounts (
  account_no INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id NOT NULL UNIQUE,
  username TEXT COLLATE NOCASE UNIQUE,
  created_at INTEGER NOT NULL,
  linked_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quick_accounts_username_ci
  ON quick_accounts(lower(username))
  WHERE username IS NOT NULL AND trim(username) <> '';

CREATE TABLE IF NOT EXISTS google_link_intents (
  state TEXT PRIMARY KEY,
  user_id NOT NULL,
  return_url TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_google_link_intents_expiry
  ON google_link_intents(expires_at);
