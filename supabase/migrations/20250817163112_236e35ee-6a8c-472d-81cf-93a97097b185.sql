
-- Create a dedicated admin user account
-- This will be a separate user specifically for admin access
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@menuhub.com',
  crypt('AdminPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "MenuHub Admin"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Add this user to admin_users table
INSERT INTO public.admin_users (user_id, email, role)
SELECT 
  u.id,
  'admin@menuhub.com',
  'admin'
FROM auth.users u
WHERE u.email = 'admin@menuhub.com'
AND NOT EXISTS (
  SELECT 1 FROM public.admin_users au 
  WHERE au.email = 'admin@menuhub.com'
);
