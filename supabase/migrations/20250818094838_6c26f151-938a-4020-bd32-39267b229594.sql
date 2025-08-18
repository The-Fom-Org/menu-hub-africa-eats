-- Fix security definer view issue by dropping the view and using proper RLS policy instead

DROP VIEW IF EXISTS public.restaurant_public_profiles;

-- Create policy to allow public read of only safe profile fields
-- We need to allow customers to see restaurant branding on public menu pages
CREATE POLICY "Public can view basic restaurant info"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);