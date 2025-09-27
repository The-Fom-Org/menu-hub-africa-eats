-- Fix RLS policy for restaurant_notification_settings to use user_branches relationship
-- This will allow proper insertion and access based on user-restaurant ownership

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Restaurant owners can create their notification settings" ON public.restaurant_notification_settings;

-- Create the correct policy that checks user_branches relationship
CREATE POLICY "Restaurant owners can create their notification settings" 
ON public.restaurant_notification_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_branches ub 
    WHERE ub.restaurant_id = restaurant_notification_settings.restaurant_id 
    AND ub.user_id = auth.uid()
  )
);