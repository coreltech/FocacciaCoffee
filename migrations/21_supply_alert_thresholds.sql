-- MIGRATION 21: Stock Alert Thresholds
-- Adds a customizable threshold for low stock alerts on supplies.

ALTER TABLE public.supplies 
ADD COLUMN IF NOT EXISTS min_stock_threshold NUMERIC(12,4) DEFAULT 1000; -- Default 1kg/1unit

COMMENT ON COLUMN public.supplies.min_stock_threshold IS 'Umbral para alertas de stock bajo (en unidades mínimas)';

NOTIFY pgrst, 'reload schema';
