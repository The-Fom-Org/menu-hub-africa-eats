-- Fix RLS policies for restaurants table by removing duplicates and ensuring proper permissions

-- Drop duplicate policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow restaurant creation" ON public.restaurants;
DROP POLICY IF EXISTS "Allow restaurant delete" ON public.restaurants;
DROP POLICY IF EXISTS "Allow restaurant read" ON public.restaurants;
DROP POLICY IF EXISTS "Allow restaurant update" ON public.restaurants;

-- Keep the more specific policies that work with user_branches
-- The existing policies should work:
-- "Users can create restaurants" - allows INSERT
-- "Users can delete restaurants they own" - allows DELETE for owners
-- "Users can update restaurants they have access to" - allows UPDATE for owners/admins
-- "Users can view restaurants they have access to" - allows SELECT for users with access

-- Add missing RLS policies for any tables that need them
-- Check if push_subscriptions needs policies (it shows no policies in the schema)
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create push subscriptions" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (true);

-- Ensure the restaurants INSERT policy allows authenticated users to create restaurants
DROP POLICY IF EXISTS "Users can create restaurants" ON public.restaurants;
CREATE POLICY "Users can create restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);