-- Add a public-safe customer token to orders for customer-side access via Edge Function
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Helpful index for lookups (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_orders_customer_token ON public.orders(customer_token);