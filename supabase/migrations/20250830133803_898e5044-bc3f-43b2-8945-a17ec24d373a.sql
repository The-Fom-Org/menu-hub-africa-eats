
-- Create table for waiter calls from customers
CREATE TABLE public.waiter_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES auth.users NOT NULL,
  table_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- Anyone can create waiter calls (customers don't need auth)
CREATE POLICY "Anyone can create waiter calls" 
  ON public.waiter_calls 
  FOR INSERT 
  WITH CHECK (true);

-- Restaurant owners can view their waiter calls
CREATE POLICY "Restaurant owners can view their waiter calls" 
  ON public.waiter_calls 
  FOR SELECT 
  USING (auth.uid() = restaurant_id);

-- Restaurant owners can update their waiter calls
CREATE POLICY "Restaurant owners can update their waiter calls" 
  ON public.waiter_calls 
  FOR UPDATE 
  USING (auth.uid() = restaurant_id);

-- Create trigger for updated_at
CREATE TRIGGER update_waiter_calls_updated_at 
  BEFORE UPDATE ON public.waiter_calls 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time for waiter calls
ALTER TABLE public.waiter_calls REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
