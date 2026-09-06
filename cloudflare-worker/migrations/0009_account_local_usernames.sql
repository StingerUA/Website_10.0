-- Local usernames for non-Google/password-backed accounts.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS local_usernames (
  user_id NOT NULL PRIMARY KEY,
  username TEXT COLLATE NOCASE NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_usernames_ci
  ON local_usernames(lower(username));

-- Existing Uzaydash accounts become local usernames immediately.
INSERT OR IGNORE INTO local_usernames (user_id, username, created_at, updated_at)
SELECT user_id, username, created_at, COALESCE(linked_at, created_at)
FROM quick_accounts
WHERE username IS NOT NULL AND trim(username) <> '';

-- Keep future quick-account usernames synchronized automatically.
CREATE TRIGGER IF NOT EXISTS trg_quick_username_insert
AFTER INSERT ON quick_accounts
WHEN NEW.username IS NOT NULL AND trim(NEW.username) <> ''
BEGIN
  INSERT INTO local_usernames (user_id, username, created_at, updated_at)
  VALUES (NEW.user_id, NEW.username, NEW.created_at, NEW.created_at)
  ON CONFLICT(user_id) DO UPDATE SET
    username = excluded.username,
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_quick_username_update
AFTER UPDATE OF username ON quick_accounts
WHEN NEW.username IS NOT NULL AND trim(NEW.username) <> ''
BEGIN
  INSERT INTO local_usernames (user_id, username, created_at, updated_at)
  VALUES (
    NEW.user_id,
    NEW.username,
    COALESCE((SELECT created_at FROM local_usernames WHERE user_id = NEW.user_id), NEW.created_at),
    CAST(strftime('%s','now') AS INTEGER)
  )
  ON CONFLICT(user_id) DO UPDATE SET
    username = excluded.username,
    updated_at = excluded.updated_at;
END;
