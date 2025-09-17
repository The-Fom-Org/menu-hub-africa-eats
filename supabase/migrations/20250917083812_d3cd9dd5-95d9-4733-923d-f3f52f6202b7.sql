-- Create restaurants table for branch information
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone_number TEXT,
  email TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  secondary_color TEXT DEFAULT '#dc2626',
  tagline TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_branches junction table for user-restaurant relationships
CREATE TABLE public.user_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
CREATE POLICY "Users can view restaurants they have access to"
ON public.restaurants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_branches ub
    WHERE ub.restaurant_id = restaurants.id 
    AND ub.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create restaurants"
ON public.restaurants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update restaurants they have access to"
ON public.restaurants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_branches ub
    WHERE ub.restaurant_id = restaurants.id 
    AND ub.user_id = auth.uid()
    AND ub.role IN ('owner', 'admin')
  )
);

-- RLS Policies for user_branches
CREATE POLICY "Users can view their own branches"
ON public.user_branches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create branch relationships"
ON public.user_branches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own branch relationships"
ON public.user_branches
FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_branches_updated_at
BEFORE UPDATE ON public.user_branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to migrate existing profiles to restaurants
CREATE OR REPLACE FUNCTION migrate_profiles_to_restaurants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  new_restaurant_id UUID;
BEGIN
  -- Migrate each profile to a restaurant entry
  FOR profile_record IN 
    SELECT * FROM public.profiles 
    WHERE restaurant_name IS NOT NULL OR user_id IS NOT NULL
  LOOP
    -- Insert into restaurants table
    INSERT INTO public.restaurants (
      name, 
      description, 
      phone_number, 
      logo_url, 
      cover_image_url, 
      primary_color, 
      secondary_color, 
      tagline
    ) VALUES (
      COALESCE(profile_record.restaurant_name, 'My Restaurant'),
      profile_record.description,
      profile_record.phone_number,
      profile_record.logo_url,
      profile_record.cover_image_url,
      profile_record.primary_color,
      profile_record.secondary_color,
      profile_record.tagline
    ) RETURNING id INTO new_restaurant_id;
    
    -- Create user-restaurant relationship
    INSERT INTO public.user_branches (
      user_id, 
      restaurant_id, 
      role, 
      is_default
    ) VALUES (
      profile_record.user_id,
      new_restaurant_id,
      'owner',
      true
    );
    
    -- Update existing menu_categories to use restaurant_id instead of user_id
    UPDATE public.menu_categories 
    SET user_id = new_restaurant_id 
    WHERE user_id = profile_record.user_id;
    
  END LOOP;
END;
$$;

-- Run the migration
SELECT migrate_profiles_to_restaurants();