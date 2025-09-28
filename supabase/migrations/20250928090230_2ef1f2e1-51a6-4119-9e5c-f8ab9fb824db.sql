-- Fix existing orders to use correct restaurant_id
UPDATE orders 
SET restaurant_id = (
  SELECT restaurant_id 
  FROM user_branches 
  WHERE user_id = orders.restaurant_id 
  AND is_default = true
)
WHERE restaurant_id IN (
  SELECT user_id 
  FROM user_branches 
  WHERE is_default = true
);

-- Update RLS policy for restaurant_notification_settings
DROP POLICY IF EXISTS "Restaurant owners can create their notification settings" ON restaurant_notification_settings;

CREATE POLICY "Restaurant owners can create their notification settings"
ON restaurant_notification_settings
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_branches ub
    WHERE ub.restaurant_id = restaurant_notification_settings.restaurant_id
    AND ub.user_id = auth.uid()
  )
);