-- 1. Add payment_date column
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- 2. Backfill payment_date for existing paid sales
-- We assume payment happened on sale_date for historical records
UPDATE sales_orders
SET payment_date = sale_date
WHERE payment_date IS NULL 
  AND (payment_status = 'paid' OR payment_status = 'Pagado' OR payment_status = 'completed');

-- 3. Ensure pending sales have null payment_date
UPDATE sales_orders
SET payment_date = NULL
WHERE payment_status != 'paid' 
  AND payment_status != 'Pagado' 
  AND payment_status != 'completed';
