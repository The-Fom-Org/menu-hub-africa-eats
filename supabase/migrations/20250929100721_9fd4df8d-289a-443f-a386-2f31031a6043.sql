-- Create admin settings table for global defaults
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Only admins can manage admin settings" 
ON public.admin_settings 
FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Insert default ordering system setting
INSERT INTO public.admin_settings (setting_key, setting_value, description) 
VALUES (
  'default_ordering_enabled',
  '{"enabled": true}',
  'Default ordering system status for new restaurants'
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();