-- MIGRATION 15: Cash Closure & Auditing Views
-- Provides high-level summaries for daily operations.

-- 1. Daily Cash Closure (By Currency and Method)
CREATE OR REPLACE VIEW v_daily_cash_closure AS
WITH payment_items AS (
    SELECT 
        (s.sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date as closure_date,
        item->>'method' as method,
        item->>'currency' as currency,
        (item->>'amount_usd')::numeric as amount_usd,
        (item->>'amount_native')::numeric as amount_native
    FROM sales_orders s,
    LATERAL jsonb_array_elements(
        CASE 
            WHEN jsonb_typeof(s.payment_details->'items') = 'array' THEN s.payment_details->'items'
            ELSE '[]'::jsonb
        END
    ) AS item
)
SELECT 
    closure_date,
    method,
    currency,
    SUM(amount_usd) as total_usd,
    SUM(amount_native) as total_native,
    COUNT(*) as transaction_count
FROM payment_items
GROUP BY closure_date, method, currency
ORDER BY closure_date DESC, total_usd DESC;

-- 2. Product Sales Summary (For inventory reconciliation)
CREATE OR REPLACE VIEW v_product_sales_summary AS
SELECT 
    (sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date as sale_day,
    product_name,
    SUM(quantity) as total_qty,
    SUM(total_amount) as total_usd,
    COUNT(*) as order_count
FROM sales_orders
GROUP BY 1, 2
ORDER BY 1 DESC, total_qty DESC;

-- 3. Security
GRANT SELECT ON public.v_daily_cash_closure TO anon, authenticated, service_role;
GRANT SELECT ON public.v_product_sales_summary TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
