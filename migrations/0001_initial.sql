CREATE TABLE products (id TEXT PRIMARY KEY,name TEXT NOT NULL,name_gu TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,price REAL NOT NULL CHECK(price>=0),description TEXT NOT NULL DEFAULT '',image TEXT NOT NULL DEFAULT '',in_stock INTEGER NOT NULL DEFAULT 1 CHECK(in_stock IN (0,1)),created_at INTEGER NOT NULL);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_image ON products(image);
CREATE TABLE settings (id TEXT PRIMARY KEY,phone TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '');
CREATE TABLE images (id TEXT PRIMARY KEY,bytes BLOB NOT NULL,mime TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE TABLE login_attempts (id TEXT PRIMARY KEY,attempts INTEGER NOT NULL DEFAULT 0,expires_at INTEGER NOT NULL);
CREATE INDEX idx_attempts_expires ON login_attempts(expires_at);
