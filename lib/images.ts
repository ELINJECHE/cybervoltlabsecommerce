// Products created via /admin can be saved without an uploaded image (the
// form doesn't hard-block it). next/image throws if given an undefined src,
// so every display site must go through this rather than indexing
// product.images directly.
const PLACEHOLDER_IMAGE = "/assets/images/no-image-placeholder.svg";

export function getProductImage(images: string[], index = 0): string {
  return images[index] ?? PLACEHOLDER_IMAGE;
}
