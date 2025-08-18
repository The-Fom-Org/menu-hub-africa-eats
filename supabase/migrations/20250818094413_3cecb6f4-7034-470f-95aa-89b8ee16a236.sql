-- Tighten RLS policies to ensure orders and order_items are not readable by anonymous users
-- This preserves public INSERT for checkout while restricting SELECT/UPDATE to authenticated owners only

-- Orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Replace SELECT policy to restrict to authenticated users only
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
CREATE POLICY "Restaurant owners can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = restaurant_id);

-- Replace UPDATE policy to restrict to authenticated users only
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;
CREATE POLICY "Restaurant owners can update their orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = restaurant_id);

-- Keep existing INSERT policy allowing public inserts (for customer checkout)
-- INSERT policy remains unchanged

-- Order items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Replace SELECT policy to restrict to authenticated users only
DROP POLICY IF EXISTS "Restaurant owners can view their order items" ON public.order_items;
CREATE POLICY "Restaurant owners can view their order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.restaurant_id = auth.uid()
  )
);

-- Keep existing INSERT policy for order_items (public can insert)
