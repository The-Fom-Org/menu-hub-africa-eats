-- Phase 1: Data Preservation & Mapping Migration
-- Add user_id column to orders table
ALTER TABLE public.orders ADD COLUMN user_id UUID;

-- Populate user_id in orders based on restaurant_id mapping through user_branches
UPDATE public.orders 
SET user_id = (
  SELECT ub.user_id 
  FROM public.user_branches ub 
  WHERE ub.restaurant_id = orders.restaurant_id 
  AND ub.is_default = true
  LIMIT 1
);

-- For any orders that don't have a mapping, try to find user_id from profiles
UPDATE public.orders 
SET user_id = restaurant_id
WHERE user_id IS NULL AND EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = orders.restaurant_id
);

-- Sync restaurant information from restaurants table back to profiles table
UPDATE public.profiles 
SET 
  restaurant_name = COALESCE(r.name, profiles.restaurant_name),
  description = COALESCE(r.description, profiles.description),
  phone_number = COALESCE(r.phone_number, profiles.phone_number),
  logo_url = COALESCE(r.logo_url, profiles.logo_url),
  cover_image_url = COALESCE(r.cover_image_url, profiles.cover_image_url),
  primary_color = COALESCE(r.primary_color, profiles.primary_color),
  secondary_color = COALESCE(r.secondary_color, profiles.secondary_color),
  tagline = COALESCE(r.tagline, profiles.tagline)
FROM public.restaurants r
JOIN public.user_branches ub ON ub.restaurant_id = r.id
WHERE profiles.user_id = ub.user_id AND ub.is_default = true;

-- Update RLS policies to use user_id instead of restaurant_id for orders
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;

CREATE POLICY "Users can view their orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update order_items RLS policy to use user_id
DROP POLICY IF EXISTS "Restaurant owners can view their order items" ON public.order_items;

CREATE POLICY "Users can view their order items" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_items.order_id 
  AND o.user_id = auth.uid()
));

-- Update waiter_calls to use user_id instead of restaurant_id
ALTER TABLE public.waiter_calls ADD COLUMN user_id UUID;

-- Populate user_id in waiter_calls
UPDATE public.waiter_calls 
SET user_id = (
  SELECT ub.user_id 
  FROM public.user_branches ub 
  WHERE ub.restaurant_id = waiter_calls.restaurant_id 
  AND ub.is_default = true
  LIMIT 1
);

-- For any waiter_calls that don't have a mapping, try direct mapping
UPDATE public.waiter_calls 
SET user_id = restaurant_id
WHERE user_id IS NULL AND EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = waiter_calls.restaurant_id
);

-- Update waiter_calls RLS policies
DROP POLICY IF EXISTS "Restaurant owners can view their waiter calls" ON public.waiter_calls;
DROP POLICY IF EXISTS "Restaurant owners can update their waiter calls" ON public.waiter_calls;

CREATE POLICY "Users can view their waiter calls" 
ON public.waiter_calls 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their waiter calls" 
ON public.waiter_calls 
FOR UPDATE 
USING (auth.uid() = user_id);