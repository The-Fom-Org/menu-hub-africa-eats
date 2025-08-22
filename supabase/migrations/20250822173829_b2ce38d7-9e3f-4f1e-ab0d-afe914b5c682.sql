
-- Create table to store Web Push subscriptions per order
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, endpoint)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- NOTE:
-- We will access this table from Supabase Edge Functions using the Service Role key,
-- so no public RLS policies are needed. This keeps subscriptions protected from client-side access.

-- Helpful indexes
CREATE INDEX idx_push_subscriptions_order_id ON public.push_subscriptions(order_id);
