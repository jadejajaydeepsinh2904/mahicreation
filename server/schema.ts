import type {Database} from './database.js';

// Safe for both an empty D1 database and an existing shop. Never replace data.
const statements = [
  "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY,name TEXT NOT NULL,name_gu TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,price REAL NOT NULL CHECK(price>=0),description TEXT NOT NULL DEFAULT '',image TEXT NOT NULL DEFAULT '',in_stock INTEGER NOT NULL DEFAULT 1 CHECK(in_stock IN (0,1)),created_at INTEGER NOT NULL)",
  'CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_products_image ON products(image)',
  "CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY,phone TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '')",
  'CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY,bytes BLOB NOT NULL,mime TEXT NOT NULL,created_at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS product_images (product_id TEXT NOT NULL,image TEXT NOT NULL,position INTEGER NOT NULL CHECK(position>=0),PRIMARY KEY(product_id,image),UNIQUE(product_id,position),FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE)',
  'CREATE INDEX IF NOT EXISTS idx_product_images_image ON product_images(image)',
  'CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY,mime TEXT NOT NULL,size INTEGER NOT NULL CHECK(size > 0),created_at INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at)',
  'CREATE TABLE IF NOT EXISTS video_chunks (video_id TEXT NOT NULL,position INTEGER NOT NULL CHECK(position >= 0),bytes BLOB NOT NULL,PRIMARY KEY(video_id,position),FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE)',
  'CREATE TABLE IF NOT EXISTS product_videos (product_id TEXT NOT NULL,video TEXT NOT NULL,position INTEGER NOT NULL CHECK(position >= 0),PRIMARY KEY(product_id,video),UNIQUE(product_id,position),FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE)',
  'CREATE INDEX IF NOT EXISTS idx_product_videos_video ON product_videos(video)',
  'CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
  'CREATE TABLE IF NOT EXISTS login_attempts (id TEXT PRIMARY KEY,attempts INTEGER NOT NULL DEFAULT 0,expires_at INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_attempts_expires ON login_attempts(expires_at)',
  'CREATE TABLE IF NOT EXISTS owner_credentials (id TEXT PRIMARY KEY CHECK(id=\'owner\'),email TEXT NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL,iterations INTEGER NOT NULL,updated_at INTEGER NOT NULL)',
];
const ready = new WeakMap<Database, Promise<void>>();
export async function ensureSchema(db: Database) {
  let pending = ready.get(db);
  if (!pending) {
    pending = db.batch(statements.map(sql => db.prepare(sql))).then(() => {}).catch(error => {ready.delete(db); throw error;});
    ready.set(db, pending);
  }
  await pending;
}
