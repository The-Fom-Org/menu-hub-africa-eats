
-- Create (if missing) an admin record for marykieinvestments@gmail.com
-- This will make the admin check in useAdmin() pass for this user.

INSERT INTO public.admin_users (user_id, email, role)
SELECT
  '4d581f34-2b6a-4ff9-93bf-58ffc184ace0'::uuid,
  'marykieinvestments@gmail.com',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = '4d581f34-2b6a-4ff9-93bf-58ffc184ace0'
);
