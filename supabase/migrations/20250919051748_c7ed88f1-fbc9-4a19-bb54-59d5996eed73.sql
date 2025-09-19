-- Fix RLS policy for restaurant creation
-- The issue is likely that the INSERT policy is conflicting or not properly set

-- Drop the existing INSERT policy and recreate it with a simpler check
DROP POLICY IF EXISTS "Users can create restaurants" ON public.restaurants;

-- Create a simple INSERT policy that allows any authenticated user to create restaurants
CREATE POLICY "Allow authenticated users to create restaurants" 
ON public.restaurants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also ensure the user_branches INSERT policy works properly
DROP POLICY IF EXISTS "Users can create branch relationships" ON public.user_branches;

CREATE POLICY "Allow authenticated users to create branch relationships" 
ON public.user_branches 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);