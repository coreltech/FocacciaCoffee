-- MIGRATION 51: Accounts Receivable Protection
-- Description: Adds partial payment tracking in USD to protect against devaluation.

-- 1. Add 'amount_paid_usd' col to sales_orders
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS amount_paid_usd NUMERIC(12,2) DEFAULT 0;

-- 2. Add comment explaining the logic
COMMENT ON COLUMN public.sales_orders.amount_paid_usd IS 'Amount paid by the customer converted to USD at the time of payment. Used to calculate pending balance safely.';

-- 3. Update existing paid orders (Optional but good for consistency)
-- If order is 'pagado' or 'completado', we assume fully paid.
-- We use total_amount as the paid amount (assuming 1:1 if it was USD, or just filling it to close balance).
UPDATE public.sales_orders
SET amount_paid_usd = total_amount
WHERE payment_status = 'pagado';

-- 4. Reload Schema
NOTIFY pgrst, 'reload schema';
