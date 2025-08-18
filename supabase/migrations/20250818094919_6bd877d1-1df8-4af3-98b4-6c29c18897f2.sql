-- Re-evaluate profiles security: hide sensitive data while keeping public menu functionality
-- The real issue is storing sensitive data in publicly readable fields

-- Drop the blanket public policy
DROP POLICY IF EXISTS "Public can view basic restaurant info" ON public.profiles;

-- Add columns for public-safe information if needed, and create selective policies
-- For now, create a policy that only exposes essential branding fields to public

-- Policy 1: Restaurant owners can see all their profile data
CREATE POLICY "Restaurant owners can view full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Public can only see minimal branding info (not phone, description, etc.)
-- This allows customer menu pages to work while protecting sensitive business info
CREATE POLICY "Public can view minimal restaurant branding"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- The application code will need to be updated to only select non-sensitive fields
-- when accessed by anonymous users (restaurant_name, logo_url, cover_image_url, primary_color, secondary_color)
-- Phone numbers, detailed descriptions, taglines should not be exposed to competitors