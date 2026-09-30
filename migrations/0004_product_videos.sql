CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL CHECK(size > 0),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at);
CREATE TABLE IF NOT EXISTS video_chunks (
  video_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position >= 0),
  bytes BLOB NOT NULL,
  PRIMARY KEY(video_id, position),
  FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS product_videos (
  product_id TEXT NOT NULL,
  video TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position >= 0),
  PRIMARY KEY(product_id, video),
  UNIQUE(product_id, position),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_videos_video ON product_videos(video);
