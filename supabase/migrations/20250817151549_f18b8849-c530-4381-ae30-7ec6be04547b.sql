
-- Create admin_users table to control who can access the admin dashboard
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view admin users
CREATE POLICY "Admins can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  ));

-- Create subscribers table to track restaurant subscriptions
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES auth.users NOT NULL,
  email TEXT NOT NULL,
  restaurant_name TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  billing_method TEXT DEFAULT 'sales_managed',
  admin_notes TEXT,
  managed_by_sales BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id),
  UNIQUE(email)
);

-- Enable RLS on subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all subscribers
CREATE POLICY "Admins can manage all subscribers" 
  ON public.subscribers 
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  ));

-- Policy for restaurant owners to view their own subscription
CREATE POLICY "Restaurant owners can view their subscription" 
  ON public.subscribers 
  FOR SELECT 
  USING (auth.uid() = restaurant_id);

-- Add trigger to update updated_at column
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial admin user (replace with your actual email)
INSERT INTO public.admin_users (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'menuhubafrica@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
