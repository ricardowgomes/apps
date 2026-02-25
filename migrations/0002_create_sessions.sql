CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
