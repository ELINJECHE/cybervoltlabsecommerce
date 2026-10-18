// Tiny "added to cart" style messages, shown by <ToastHost /> in the layout.
export const TOAST_EVENT = "cv-toast";

export function showToast(message: string, href?: string, linkLabel?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, href, linkLabel } }));
}
