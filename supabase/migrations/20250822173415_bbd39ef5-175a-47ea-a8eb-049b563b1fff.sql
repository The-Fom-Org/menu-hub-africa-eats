
-- Add table_number column to orders table to support manual table entry
ALTER TABLE public.orders ADD COLUMN table_number TEXT;

-- Add index for better performance when filtering by table number
CREATE INDEX idx_orders_table_number ON public.orders(table_number);

-- Add index for better performance when filtering by restaurant and table
CREATE INDEX idx_orders_restaurant_table ON public.orders(restaurant_id, table_number);
