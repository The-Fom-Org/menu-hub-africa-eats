-- Migration to copy menu item images from user-based menu to restaurant-based menu
-- for mucherupet@gmail.com user

DO $$
DECLARE
  target_user_id UUID;
  target_restaurant_id UUID;
  cat_record RECORD;
  item_record RECORD;
  restaurant_category_id UUID;
BEGIN
  -- Get the user ID for mucherupet@gmail.com
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'mucherupet@gmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User mucherupet@gmail.com not found';
    RETURN;
  END IF;
  
  -- Get their restaurant ID
  SELECT restaurant_id INTO target_restaurant_id
  FROM public.user_branches
  WHERE user_id = target_user_id AND is_default = true
  LIMIT 1;
  
  IF target_restaurant_id IS NULL THEN
    RAISE NOTICE 'No restaurant found for user';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user ID: % and restaurant ID: %', target_user_id, target_restaurant_id;
  
  -- Loop through each category in the user's menu
  FOR cat_record IN 
    SELECT * FROM public.menu_categories 
    WHERE user_id = target_user_id
  LOOP
    -- Find the corresponding category in the restaurant's menu
    SELECT id INTO restaurant_category_id
    FROM public.menu_categories
    WHERE user_id = target_restaurant_id 
      AND name = cat_record.name
    LIMIT 1;
    
    IF restaurant_category_id IS NOT NULL THEN
      -- Loop through items in the user's category
      FOR item_record IN
        SELECT * FROM public.menu_items
        WHERE category_id = cat_record.id
          AND image_url IS NOT NULL
      LOOP
        -- Update the corresponding item in the restaurant's category
        UPDATE public.menu_items
        SET image_url = item_record.image_url
        WHERE category_id = restaurant_category_id
          AND name = item_record.name;
          
        RAISE NOTICE 'Updated item: % with image: %', item_record.name, item_record.image_url;
      END LOOP;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;