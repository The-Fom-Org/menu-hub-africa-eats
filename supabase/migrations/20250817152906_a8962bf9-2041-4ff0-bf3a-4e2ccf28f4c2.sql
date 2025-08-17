
-- Add admin user (replace with your actual user ID and email)
-- You'll need to get your user ID from Supabase Auth Users first
INSERT INTO admin_users (user_id, email, role) 
VALUES (
  'your-user-id-here', -- Replace with your actual user ID from auth.users
  'your-email@example.com', -- Replace with your actual email
  'admin'
);
