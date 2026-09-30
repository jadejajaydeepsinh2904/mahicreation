CREATE TABLE IF NOT EXISTS owner_credentials (
  id TEXT PRIMARY KEY CHECK(id='owner'),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
