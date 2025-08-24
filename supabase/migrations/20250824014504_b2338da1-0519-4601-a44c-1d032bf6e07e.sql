-- Strengthen RLS on orders to protect customer PII (names/phones)
-- Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Recreate policies with safer constraints
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;

-- Allow customers (anon) to create orders, but force safe initial states
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  payment_status = 'pending' AND order_status = 'pending'
);

-- Only restaurant owners can view their own orders
CREATE POLICY "Restaurant owners can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = restaurant_id);

-- Only restaurant owners can update their own orders
CREATE POLICY "Restaurant owners can update their orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = restaurant_id);
