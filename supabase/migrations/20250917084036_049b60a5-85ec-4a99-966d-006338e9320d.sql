-- Fix the migration function to have proper search_path
CREATE OR REPLACE FUNCTION migrate_profiles_to_restaurants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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