-- Create function to handle new user restaurant setup
CREATE OR REPLACE FUNCTION public.handle_new_user_restaurant()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_restaurant_id UUID;
  restaurant_name TEXT;
BEGIN
  -- Extract restaurant name from user metadata
  restaurant_name := COALESCE(
    NEW.raw_user_meta_data ->> 'business_name',
    NEW.raw_user_meta_data ->> 'restaurant_name',
    'My Restaurant'
  );

  -- Create a default restaurant for the new user
  INSERT INTO public.restaurants (
    name,
    description,
    phone_number,
    primary_color,
    secondary_color
  ) VALUES (
    restaurant_name,
    'Welcome to ' || restaurant_name || '! We are excited to serve you.',
    NEW.raw_user_meta_data ->> 'phone',
    '#059669',
    '#dc2626'
  ) RETURNING id INTO new_restaurant_id;

  -- Create user-restaurant relationship as owner
  INSERT INTO public.user_branches (
    user_id,
    restaurant_id,
    role,
    is_default
  ) VALUES (
    NEW.id,
    new_restaurant_id,
    'owner',
    true
  );

  -- If user has existing menu categories tied to their user_id, migrate them
  UPDATE public.menu_categories 
  SET user_id = new_restaurant_id 
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically set up restaurant for new users
DROP TRIGGER IF EXISTS on_auth_user_created_restaurant ON auth.users;
CREATE TRIGGER on_auth_user_created_restaurant
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_restaurant();

-- Create function to ensure existing users have restaurants
CREATE OR REPLACE FUNCTION public.ensure_user_has_restaurant(target_user_id UUID)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  existing_restaurant_id UUID;
  new_restaurant_id UUID;
  user_email TEXT;
BEGIN
  -- Check if user already has a restaurant
  SELECT restaurant_id INTO existing_restaurant_id
  FROM public.user_branches 
  WHERE user_id = target_user_id AND is_default = true
  LIMIT 1;
  
  -- If user already has a restaurant, return it
  IF existing_restaurant_id IS NOT NULL THEN
    RETURN existing_restaurant_id;
  END IF;
  
  -- Get user email for restaurant name
  SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
  
  -- Create a default restaurant
  INSERT INTO public.restaurants (
    name,
    description,
    primary_color,
    secondary_color
  ) VALUES (
    COALESCE(SPLIT_PART(user_email, '@', 1) || '''s Restaurant', 'My Restaurant'),
    'Welcome to our restaurant! We are excited to serve you.',
    '#059669',
    '#dc2626'
  ) RETURNING id INTO new_restaurant_id;

  -- Create user-restaurant relationship
  INSERT INTO public.user_branches (
    user_id,
    restaurant_id,
    role,
    is_default
  ) VALUES (
    target_user_id,
    new_restaurant_id,
    'owner',
    true
  );

  -- Migrate any existing menu categories
  UPDATE public.menu_categories 
  SET user_id = new_restaurant_id 
  WHERE user_id = target_user_id;

  RETURN new_restaurant_id;
END;
$$;