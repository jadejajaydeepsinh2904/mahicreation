export const MAX_PRODUCT_PHOTOS = 8;

// Existing single-photo products continue to work without a data migration.
export function productImages(product: {image?: string; images?: string[]}): string[] {
  if (product.images?.length) return [...product.images];
  return product.image ? [product.image] : [];
}
