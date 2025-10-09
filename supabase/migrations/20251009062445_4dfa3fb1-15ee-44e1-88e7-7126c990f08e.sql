-- Remove orphaned items from restaurant menus that don't exist in user menus
-- First delete associated order_items, then delete the items

DO $$
DECLARE
  deleted_items_count INTEGER := 0;
  deleted_order_items_count INTEGER := 0;
BEGIN
  -- Identify orphaned restaurant menu items
  WITH user_items AS (
    SELECT 
      ub.restaurant_id,
      mc.name as category_name,
      mi.name as item_name
    FROM user_branches ub
    JOIN menu_categories mc ON mc.user_id = ub.user_id
    JOIN menu_items mi ON mi.category_id = mc.id
    WHERE ub.is_default = true
  ),
  restaurant_items_to_delete AS (
    SELECT 
      mi.id as item_id
    FROM menu_categories mc
    JOIN menu_items mi ON mi.category_id = mc.id
    WHERE EXISTS (SELECT 1 FROM user_branches ub WHERE ub.restaurant_id = mc.user_id)
      AND NOT EXISTS (
        SELECT 1 FROM user_items ui
        WHERE ui.restaurant_id = mc.user_id
          AND LOWER(TRIM(ui.category_name)) = LOWER(TRIM(mc.name))
          AND LOWER(TRIM(ui.item_name)) = LOWER(TRIM(mi.name))
      )
  )
  -- First, delete associated order_items
  DELETE FROM order_items
  WHERE menu_item_id IN (SELECT item_id FROM restaurant_items_to_delete);
  
  GET DIAGNOSTICS deleted_order_items_count = ROW_COUNT;
  
  -- Now delete the orphaned menu items
  WITH user_items AS (
    SELECT 
      ub.restaurant_id,
      mc.name as category_name,
      mi.name as item_name
    FROM user_branches ub
    JOIN menu_categories mc ON mc.user_id = ub.user_id
    JOIN menu_items mi ON mi.category_id = mc.id
    WHERE ub.is_default = true
  ),
  restaurant_items_to_delete AS (
    SELECT 
      mi.id as item_id
    FROM menu_categories mc
    JOIN menu_items mi ON mi.category_id = mc.id
    WHERE EXISTS (SELECT 1 FROM user_branches ub WHERE ub.restaurant_id = mc.user_id)
      AND NOT EXISTS (
        SELECT 1 FROM user_items ui
        WHERE ui.restaurant_id = mc.user_id
          AND LOWER(TRIM(ui.category_name)) = LOWER(TRIM(mc.name))
          AND LOWER(TRIM(ui.item_name)) = LOWER(TRIM(mi.name))
      )
  )
  DELETE FROM menu_items
  WHERE id IN (SELECT item_id FROM restaurant_items_to_delete);
  
  GET DIAGNOSTICS deleted_items_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % order items and % orphaned menu items', deleted_order_items_count, deleted_items_count;
END $$;