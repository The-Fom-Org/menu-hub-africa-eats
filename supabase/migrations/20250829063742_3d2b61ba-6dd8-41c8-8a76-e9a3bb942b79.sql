
-- Create customer_leads table for storing lead information
CREATE TABLE public.customer_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  lead_source TEXT NOT NULL, -- 'qr_scan', 'menu_browse', 'pre_checkout', 'post_order', 'exit_intent'
  order_context JSONB DEFAULT '{}'::jsonb, -- cart items, preferences when captured
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  dietary_restrictions TEXT[],
  favorite_cuisines TEXT[],
  dining_frequency TEXT, -- 'weekly', 'monthly', 'occasionally'
  notes TEXT,
  converted_to_order BOOLEAN DEFAULT false,
  first_order_id UUID, -- reference to orders table when they convert
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for customer_leads
ALTER TABLE public.customer_leads ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can view their leads
CREATE POLICY "Restaurant owners can view their leads" 
  ON public.customer_leads 
  FOR SELECT 
  USING (auth.uid() = restaurant_id);

-- Restaurant owners can create leads (though most will come from public forms)
CREATE POLICY "Restaurant owners can create leads" 
  ON public.customer_leads 
  FOR INSERT 
  WITH CHECK (auth.uid() = restaurant_id);

-- Anyone can create leads (for public lead capture)
CREATE POLICY "Anyone can create leads" 
  ON public.customer_leads 
  FOR INSERT 
  WITH CHECK (true);

-- Restaurant owners can update their leads
CREATE POLICY "Restaurant owners can update their leads" 
  ON public.customer_leads 
  FOR UPDATE 
  USING (auth.uid() = restaurant_id);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_leads_updated_at
  BEFORE UPDATE ON public.customer_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_customer_leads_restaurant_id ON public.customer_leads(restaurant_id);
CREATE INDEX idx_customer_leads_created_at ON public.customer_leads(created_at DESC);
CREATE INDEX idx_customer_leads_source ON public.customer_leads(lead_source);
