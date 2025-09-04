-- Create waiter_calls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  table_number TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for waiter calls
CREATE POLICY "Waiter calls are viewable by restaurant owners" 
ON public.waiter_calls 
FOR SELECT 
USING (auth.uid() = restaurant_id);

CREATE POLICY "Anyone can insert waiter calls" 
ON public.waiter_calls 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Restaurant owners can update their waiter calls" 
ON public.waiter_calls 
FOR UPDATE 
USING (auth.uid() = restaurant_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_waiter_calls_updated_at
BEFORE UPDATE ON public.waiter_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime functionality
ALTER TABLE public.waiter_calls REPLICA IDENTITY FULL;
SELECT pg_catalog.setval('public.waiter_calls_id_seq', 1, false);