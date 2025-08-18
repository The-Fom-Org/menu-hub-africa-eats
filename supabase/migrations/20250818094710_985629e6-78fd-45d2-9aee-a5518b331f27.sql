-- Restrict profiles table and provide a safe public view

-- Ensure RLS enabled (should already be enabled per schema)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove public SELECT policy on profiles
DROP POLICY IF EXISTS "Public can view all profiles" ON public.profiles;

-- Keep/ensure owner-only SELECT policy exists (already present in schema)
-- Recreate to be explicit and restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Recreate INSERT/UPDATE policies to include TO authenticated explicitly (if already exist they will be replaced)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create a sanitized public view exposing only non-sensitive fields for the public menu
CREATE OR REPLACE VIEW public.restaurant_public_profiles AS
SELECT 
  user_id,
  restaurant_name,
  logo_url
FROM public.profiles;

-- Grant read access on the view to anon and authenticated
GRANT SELECT ON public.restaurant_public_profiles TO anon, authenticated;