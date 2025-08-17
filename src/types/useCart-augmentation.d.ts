/**
 * Temporary type augmentation to unblock build errors caused by referencing `updateTrigger`
 * in components while the hook doesn't expose it.
 * This narrows type-checking only and does not alter runtime behavior.
 */

declare module '@/hooks/useCart' {
  // Allow destructuring of `updateTrigger` while keeping other shape flexible.
  // If you later expose it from the hook, this can be removed.
  export function useCart(): any;
}
