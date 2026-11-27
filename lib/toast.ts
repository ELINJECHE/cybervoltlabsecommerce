// Small messages shown by <ToastHost /> in the layout.
export const TOAST_EVENT = "cv-toast";
export const CART_TOAST_EVENT = "cv-cart-toast";

export function showToast(message: string, href?: string, linkLabel?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, href, linkLabel } }));
}

export interface AddedToCart { name: string; image: string; /** More than one product added at once ("Complete your set"). */ count?: number }

// After Add to Cart: a thumbnail, "Added to cart", and View cart / Checkout buttons.
export function showAddedToCart(detail: AddedToCart) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_TOAST_EVENT, { detail }));
}
