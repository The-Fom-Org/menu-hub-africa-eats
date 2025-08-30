
import { useMemo } from "react";
import { useCart } from "@/hooks/useCart";

/**
 * Builds a lightweight order_context snapshot from the current cart (if present).
 * Safe to use anywhere — returns an empty context when cart is unavailable.
 */
export const useLeadCapture = () => {
  const cartHook = useCart?.();
  const cartItems = cartHook?.cartItems || [];

  const orderContext = useMemo(() => {
    const normalizedItems = Array.isArray(cartItems)
      ? cartItems.map((item) => ({
          id: item?.id,
          name: item?.name || "Item",
          quantity: Number(item?.quantity ?? 1),
          unit_price: Number(item?.price ?? 0),
        }))
      : [];

    const itemCount = normalizedItems.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0);
    const subtotal = normalizedItems.reduce(
      (acc, item) => acc + (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0),
      0
    );

    return {
      items: normalizedItems,
      itemCount,
      subtotal,
      currency: "KES",
      notes: undefined,
    };
  }, [cartItems]);

  return { orderContext };
};
