-- Add missing DELETE policies to complete RLS setup
CREATE POLICY "Users can delete restaurants they own"
ON public.restaurants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_branches ub
    WHERE ub.restaurant_id = restaurants.id 
    AND ub.user_id = auth.uid()
    AND ub.role = 'owner'
  )
);

CREATE POLICY "Users can delete their own branch relationships"
ON public.user_branches
FOR DELETE
USING (auth.uid() = user_id);