-- Migration 36: Add Product Description Field
-- Adds description column to sales_prices for product details

ALTER TABLE public.sales_prices 
    ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.sales_prices.description IS 'Descripción detallada del producto para mostrar en catálogo web y ERP';

-- Force schema reload
NOTIFY pgrst, 'reload schema';
