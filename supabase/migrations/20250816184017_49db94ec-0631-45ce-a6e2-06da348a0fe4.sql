
-- 1) Fix critical data exposure in order_items SELECT policy
-- The existing policy includes "OR true" which exposes all order items to anyone.
-- We drop it and replace with a strict owner-only policy aligned with the orders table.

-- Drop the flawed policy (name from current schema)
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;

-- Create a secure owner-only SELECT policy
CREATE POLICY "Restaurant owners can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.restaurant_id = auth.uid()
  )
);

-- Note: INSERT policy remains unchanged (public insert) to allow customer checkout flows.
-- If you want to restrict who can add order_items further, we can add additional policies later.
