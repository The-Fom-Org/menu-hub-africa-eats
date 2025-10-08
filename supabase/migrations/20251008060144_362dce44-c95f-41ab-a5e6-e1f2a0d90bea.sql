-- Migration to copy all missing menu item images from user-based menus to restaurant-based menus

DO $$
DECLARE
  user_record RECORD;
  cat_record RECORD;
  item_record RECORD;
  restaurant_category_id UUID;
  updated_count INTEGER := 0;
BEGIN
  -- Loop through all users who have restaurants
  FOR user_record IN 
    SELECT DISTINCT ub.user_id, ub.restaurant_id
    FROM public.user_branches ub
    WHERE ub.is_default = true
  LOOP
    RAISE NOTICE 'Processing user: % with restaurant: %', user_record.user_id, user_record.restaurant_id;
    
    -- Loop through each category in the user's menu
    FOR cat_record IN 
      SELECT * FROM public.menu_categories 
      WHERE user_id = user_record.user_id
    LOOP
      -- Find the corresponding category in the restaurant's menu
      SELECT id INTO restaurant_category_id
      FROM public.menu_categories
      WHERE user_id = user_record.restaurant_id 
        AND name = cat_record.name
      LIMIT 1;
      
      IF restaurant_category_id IS NOT NULL THEN
        -- Loop through items in the user's category that have images
        FOR item_record IN
          SELECT * FROM public.menu_items
          WHERE category_id = cat_record.id
            AND image_url IS NOT NULL
        LOOP
          -- Update the corresponding item in the restaurant's category if it has null image_url
          UPDATE public.menu_items
          SET image_url = item_record.image_url
          WHERE category_id = restaurant_category_id
            AND name = item_record.name
            AND image_url IS NULL;
            
          IF FOUND THEN
            updated_count := updated_count + 1;
            RAISE NOTICE 'Updated item: % with image: %', item_record.name, item_record.image_url;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration completed. Total items updated: %', updated_count;
END $$;