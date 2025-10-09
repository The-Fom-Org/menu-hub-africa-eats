-- Comprehensive fix: Sync all menu data from user-based to restaurant-based
-- This ensures customer menu always shows latest edits

DO $$
DECLARE
  user_record RECORD;
  cat_record RECORD;
  item_record RECORD;
  rest_cat_id UUID;
  rest_item_id UUID;
  synced_categories INTEGER := 0;
  synced_items INTEGER := 0;
BEGIN
  -- For each user with a default restaurant
  FOR user_record IN 
    SELECT DISTINCT ub.user_id, ub.restaurant_id
    FROM user_branches ub
    WHERE ub.is_default = true
  LOOP
    RAISE NOTICE 'Processing user: % -> restaurant: %', user_record.user_id, user_record.restaurant_id;
    
    -- Process each user-based category
    FOR cat_record IN 
      SELECT * FROM menu_categories 
      WHERE user_id = user_record.user_id
    LOOP
      -- Check if restaurant-based category exists
      SELECT id INTO rest_cat_id
      FROM menu_categories
      WHERE user_id = user_record.restaurant_id 
        AND LOWER(TRIM(name)) = LOWER(TRIM(cat_record.name))
      LIMIT 1;
      
      -- Create restaurant category if it doesn't exist
      IF rest_cat_id IS NULL THEN
        INSERT INTO menu_categories (user_id, name, description, category_name, created_at, updated_at)
        VALUES (
          user_record.restaurant_id,
          cat_record.name,
          cat_record.description,
          cat_record.category_name,
          cat_record.created_at,
          now()
        )
        RETURNING id INTO rest_cat_id;
        synced_categories := synced_categories + 1;
        RAISE NOTICE 'Created restaurant category: %', cat_record.name;
      END IF;
      
      -- Now sync all items from user category to restaurant category
      FOR item_record IN
        SELECT * FROM menu_items
        WHERE category_id = cat_record.id
      LOOP
        -- Check if restaurant-based item exists
        SELECT id INTO rest_item_id
        FROM menu_items
        WHERE category_id = rest_cat_id
          AND LOWER(TRIM(name)) = LOWER(TRIM(item_record.name))
        LIMIT 1;
        
        IF rest_item_id IS NULL THEN
          -- Create new restaurant item
          INSERT INTO menu_items (
            category_id, name, description, persuasion_description, 
            price, image_url, is_available, is_chef_special, 
            popularity_badge, created_at, updated_at
          )
          VALUES (
            rest_cat_id,
            item_record.name,
            item_record.description,
            item_record.persuasion_description,
            item_record.price,
            item_record.image_url,
            item_record.is_available,
            item_record.is_chef_special,
            item_record.popularity_badge,
            item_record.created_at,
            now()
          );
          synced_items := synced_items + 1;
        ELSE
          -- Update existing restaurant item with latest user data
          UPDATE menu_items
          SET 
            description = item_record.description,
            persuasion_description = item_record.persuasion_description,
            price = item_record.price,
            image_url = item_record.image_url,
            is_available = item_record.is_available,
            is_chef_special = item_record.is_chef_special,
            popularity_badge = item_record.popularity_badge,
            updated_at = now()
          WHERE id = rest_item_id
            -- Only update if user item is newer
            AND item_record.updated_at > (SELECT updated_at FROM menu_items WHERE id = rest_item_id);
          
          IF FOUND THEN
            synced_items := synced_items + 1;
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Sync completed. Categories: %, Items: %', synced_categories, synced_items;
END $$;