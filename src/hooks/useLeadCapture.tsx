
import { useMemo } from "react";
import { useCart } from "@/hooks/useCart";

/**
 * Builds a lightweight order_context snapshot from the current cart (if present).
 * Safe to use anywhere — returns an empty context when cart is unavailable.
 */
export const useLeadCapture = () => {
  const { cart } = useCart?.() || { cart: undefined };

  const orderContext = useMemo(() => {
    const items = (cart as any)?.items || [];
    const normalizedItems = Array.isArray(items)
      ? items.map((it: any) => ({
          id: it?.id ?? it?.menu_item_id ?? undefined,
          name: it?.name ?? it?.title ?? "Item",
          quantity: Number(it?.quantity ?? 1),
          unit_price: Number(it?.price ?? it?.unit_price ?? 0),
        }))
      : [];

    const itemCount = normalizedItems.reduce((acc: number, it: any) => acc + (Number(it?.quantity) || 0), 0);
    const subtotal = normalizedItems.reduce(
      (acc: number, it: any) => acc + (Number(it?.quantity) || 0) * (Number(it?.unit_price) || 0),
      0
    );

    return {
      items: normalizedItems,
      itemCount,
      subtotal,
      currency: (cart as any)?.currency || "KES",
      notes: (cart as any)?.notes || undefined,
    };
  }, [cart]);

  return { orderContext };
};
