
-- Create table for restaurant notification settings
CREATE TABLE public.restaurant_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES auth.users NOT NULL,
  ringtone TEXT NOT NULL DEFAULT 'classic-bell',
  volume INTEGER NOT NULL DEFAULT 80 CHECK (volume >= 0 AND volume <= 100),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  last_notification_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.restaurant_notification_settings ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can view their notification settings
CREATE POLICY "Restaurant owners can view their notification settings" 
  ON public.restaurant_notification_settings 
  FOR SELECT 
  USING (auth.uid() = restaurant_id);

-- Restaurant owners can create their notification settings
CREATE POLICY "Restaurant owners can create their notification settings" 
  ON public.restaurant_notification_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = restaurant_id);

-- Restaurant owners can update their notification settings
CREATE POLICY "Restaurant owners can update their notification settings" 
  ON public.restaurant_notification_settings 
  FOR UPDATE 
  USING (auth.uid() = restaurant_id);

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_notification_settings_updated_at 
  BEFORE UPDATE ON public.restaurant_notification_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
