-- Create table for M-Pesa callback logs
CREATE TABLE public.mpesa_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_request_id TEXT NOT NULL,
  merchant_request_id TEXT,
  result_code INTEGER,
  result_desc TEXT,
  callback_data JSONB,
  success BOOLEAN DEFAULT false,
  amount NUMERIC,
  mpesa_receipt_number TEXT,
  transaction_date BIGINT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_callbacks ENABLE ROW LEVEL SECURITY;

-- Create policies for M-Pesa callbacks (only system can access)
CREATE POLICY "Service role can manage mpesa callbacks"
ON public.mpesa_callbacks
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for efficient lookups
CREATE INDEX idx_mpesa_callbacks_checkout_request_id ON public.mpesa_callbacks(checkout_request_id);
CREATE INDEX idx_mpesa_callbacks_created_at ON public.mpesa_callbacks(created_at DESC);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_mpesa_callbacks_updated_at
BEFORE UPDATE ON public.mpesa_callbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();