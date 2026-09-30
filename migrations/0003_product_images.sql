CREATE TABLE IF NOT EXISTS product_images (
  product_id TEXT NOT NULL,
  image TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position >= 0),
  PRIMARY KEY(product_id, image),
  UNIQUE(product_id, position),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_images_image ON product_images(image);
