-- Fix category name mismatches and copy remaining images (corrected)

DO $$
DECLARE
  user_record RECORD;
  cat_record RECORD;
  item_record RECORD;
  rest_cat_record RECORD;
  updated_count INTEGER := 0;
  cat_count INTEGER := 0;
BEGIN
  -- Fix category name typos and mismatches in restaurant menus
  -- Find and fix "Burgers & Sandwitches" typo
  UPDATE menu_categories
  SET name = 'Burgers & Sandwiches'
  WHERE LOWER(name) = 'burgers & sandwitches';
  GET DIAGNOSTICS cat_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % categories: Sandwitches -> Sandwiches', cat_count;
  
  -- Fix "Desserts" plural to singular
  UPDATE menu_categories mc
  SET name = 'Dessert'
  WHERE LOWER(name) = 'desserts'
  AND EXISTS (
    SELECT 1 FROM user_branches ub 
    WHERE ub.restaurant_id = mc.user_id
  );
  GET DIAGNOSTICS cat_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % categories: Desserts -> Dessert', cat_count;
  
  -- Fix "Fruits & Salads" plural to singular
  UPDATE menu_categories mc
  SET name = 'Fruits & Salad'
  WHERE LOWER(name) = 'fruits & salads'
  AND EXISTS (
    SELECT 1 FROM user_branches ub 
    WHERE ub.restaurant_id = mc.user_id
  );
  GET DIAGNOSTICS cat_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % categories: Fruits & Salads -> Fruits & Salad', cat_count;
  
  -- Now copy images from user menus to restaurant menus again with fixed names
  FOR user_record IN 
    SELECT DISTINCT ub.user_id, ub.restaurant_id
    FROM user_branches ub
    WHERE ub.is_default = true
  LOOP
    FOR cat_record IN 
      SELECT * FROM menu_categories 
      WHERE user_id = user_record.user_id
    LOOP
      -- Find matching restaurant categories
      FOR rest_cat_record IN
        SELECT id FROM menu_categories
        WHERE user_id = user_record.restaurant_id 
          AND LOWER(TRIM(name)) = LOWER(TRIM(cat_record.name))
      LOOP
        -- Copy images for matching items
        FOR item_record IN
          SELECT * FROM menu_items
          WHERE category_id = cat_record.id
            AND image_url IS NOT NULL
        LOOP
          UPDATE menu_items
          SET image_url = item_record.image_url
          WHERE category_id = rest_cat_record.id
            AND LOWER(TRIM(name)) = LOWER(TRIM(item_record.name))
            AND image_url IS NULL;
            
          IF FOUND THEN
            updated_count := updated_count + 1;
          END IF;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration completed. Total items updated: %', updated_count;
END $$;