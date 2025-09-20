-- Create restaurant_settings table for ordering system toggle
CREATE TABLE public.restaurant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL UNIQUE,
  ordering_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant settings
CREATE POLICY "Restaurant owners can view their settings" 
ON public.restaurant_settings 
FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant owners can create their settings" 
ON public.restaurant_settings 
FOR INSERT 
WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant owners can update their settings" 
ON public.restaurant_settings 
FOR UPDATE 
USING (auth.uid() = restaurant_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_settings_updated_at
BEFORE UPDATE ON public.restaurant_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for existing restaurants
INSERT INTO public.restaurant_settings (restaurant_id, ordering_enabled)
SELECT id, true 
FROM public.restaurants
ON CONFLICT (restaurant_id) DO NOTHING;