-- AlbaSpace Game v0.2 add-only migration.
-- Apply this file to the existing auth D1 database; do not reapply legacy auth schema.
CREATE TABLE IF NOT EXISTS game_rooms (
  room_id TEXT PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE,
  teacher_user_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  phase TEXT NOT NULL,
  state_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_rooms_teacher ON game_rooms(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(join_code);
CREATE TABLE IF NOT EXISTS game_sessions (
  session_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  started_at INTEGER,
  ended_at INTEGER,
  winner_player_id TEXT,
  FOREIGN KEY (room_id) REFERENCES game_rooms(room_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS game_rounds (
  round_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  closed_at INTEGER,
  FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS game_room_players (
  room_player_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  state_json TEXT NOT NULL,
  online INTEGER NOT NULL DEFAULT 1,
  joined_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES game_rooms(room_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_game_room_players_room ON game_room_players(room_id);
CREATE TABLE IF NOT EXISTS game_answers (
  answer_id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  room_player_id TEXT NOT NULL,
  value_json TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  UNIQUE(round_id, room_player_id),
  FOREIGN KEY (round_id) REFERENCES game_rounds(round_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS game_cadets (
  cadet_id TEXT PRIMARY KEY,
  room_player_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  knowledge INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (room_player_id) REFERENCES game_room_players(room_player_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS game_modules (
  module_id TEXT PRIMARY KEY,
  room_player_id TEXT NOT NULL,
  module_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (room_player_id) REFERENCES game_room_players(room_player_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS game_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id TEXT,
  request_id TEXT,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (room_id) REFERENCES game_rooms(room_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_game_events_room ON game_events(room_id, event_id);
CREATE TABLE IF NOT EXISTS game_idempotency (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(room_id, user_id, request_id)
);
