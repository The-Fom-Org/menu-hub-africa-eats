-- Add phone number column to profiles table for restaurant contact
ALTER TABLE public.profiles 
ADD COLUMN phone_number text;

-- Add comment to describe the new column
COMMENT ON COLUMN public.profiles.phone_number IS 'Restaurant contact phone number for customer inquiries';