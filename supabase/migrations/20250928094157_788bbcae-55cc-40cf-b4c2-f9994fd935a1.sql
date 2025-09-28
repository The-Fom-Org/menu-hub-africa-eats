-- Drop existing RLS policies on restaurant_settings
DROP POLICY IF EXISTS "Restaurant owners can create their settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Restaurant owners can update their settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Restaurant owners can view their settings" ON public.restaurant_settings;

-- Add user_id column to restaurant_settings
ALTER TABLE public.restaurant_settings 
ADD COLUMN user_id UUID;

-- Migrate data from restaurant_id to user_id
UPDATE public.restaurant_settings 
SET user_id = restaurant_id;

-- Make user_id NOT NULL since it's required
ALTER TABLE public.restaurant_settings 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the old restaurant_id column
ALTER TABLE public.restaurant_settings 
DROP COLUMN restaurant_id;

-- Create simplified RLS policies using user_id directly
CREATE POLICY "Users can view their restaurant settings" 
ON public.restaurant_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their restaurant settings" 
ON public.restaurant_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their restaurant settings" 
ON public.restaurant_settings 
FOR UPDATE 
USING (auth.uid() = user_id);