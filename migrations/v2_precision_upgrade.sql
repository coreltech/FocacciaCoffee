-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - UPGRADE DE PRECISIÓN DECIMAL V2
-- Cambia la mayoría de las columnas de 2 a 4 decimales
-- =====================================================================================

-- 1. VENTAS
ALTER TABLE public.v2_orders 
    ALTER COLUMN total_amount TYPE NUMERIC(20,4),
    ALTER COLUMN amount_paid TYPE NUMERIC(20,4),
    ALTER COLUMN balance_due TYPE NUMERIC(20,4);

ALTER TABLE public.v2_order_items
    ALTER COLUMN quantity TYPE NUMERIC(20,4),
    ALTER COLUMN unit_price TYPE NUMERIC(20,4),
    ALTER COLUMN total_price TYPE NUMERIC(20,4);

-- 2. CATÁLOGO E INVENTARIO
ALTER TABLE public.v2_catalog
    ALTER COLUMN price TYPE NUMERIC(20,4),
    ALTER COLUMN stock TYPE NUMERIC(20,4);

ALTER TABLE public.v2_supplies
    ALTER COLUMN stock TYPE NUMERIC(20,4),
    ALTER COLUMN min_stock TYPE NUMERIC(20,4),
    ALTER COLUMN last_price TYPE NUMERIC(20,4);

-- 3. RECETAS / COMPOSICIÓN
ALTER TABLE public.v2_recipes
    ALTER COLUMN expected_weight TYPE NUMERIC(20,4);

ALTER TABLE public.v2_recipe_items
    ALTER COLUMN quantity TYPE NUMERIC(20,4),
    ALTER COLUMN percentage TYPE NUMERIC(10,4);

ALTER TABLE public.v2_catalog_composition
    ALTER COLUMN quantity TYPE NUMERIC(20,4);

-- 4. PRODUCCIÓN
ALTER TABLE public.v2_production_logs
    ALTER COLUMN units_produced TYPE NUMERIC(20,4),
    ALTER COLUMN total_cost TYPE NUMERIC(20,4);

-- 5. KARDEX
ALTER TABLE public.v2_inventory_transactions
    ALTER COLUMN quantity TYPE NUMERIC(20,4),
    ALTER COLUMN old_stock TYPE NUMERIC(20,4),
    ALTER COLUMN new_stock TYPE NUMERIC(20,4);

-- 6. TASAS
ALTER TABLE public.v2_settings_rates
    ALTER COLUMN usd_to_ves TYPE NUMERIC(15,4),
    ALTER COLUMN eur_to_usd TYPE NUMERIC(15,4);

ALTER TABLE public.v2_rates_history
    ALTER COLUMN usd_to_ves TYPE NUMERIC(15,4),
    ALTER COLUMN eur_to_usd TYPE NUMERIC(15,4);

-- 7. COMPRAS
ALTER TABLE public.v2_purchases
    ALTER COLUMN total_usd TYPE NUMERIC(20,4),
    ALTER COLUMN total_bs TYPE NUMERIC(20,4);

ALTER TABLE public.v2_purchase_items
    ALTER COLUMN quantity TYPE NUMERIC(20,4),
    ALTER COLUMN unit_price_usd TYPE NUMERIC(20,4), -- Ya era 4 pero unificamos a 20,4
    ALTER COLUMN subtotal_usd TYPE NUMERIC(20,4);

-- 8. TESORERÍA / GASTOS
ALTER TABLE public.v2_operational_expenses
    ALTER COLUMN amount TYPE NUMERIC(20,4),
    ALTER COLUMN reference_rate TYPE NUMERIC(20,4);

ALTER TABLE public.v2_capital_contributions
    ALTER COLUMN amount TYPE NUMERIC(20,4),
    ALTER COLUMN reference_rate TYPE NUMERIC(20,4);

-- 9. LIQUIDACIONES
ALTER TABLE public.v2_settlements
    ALTER COLUMN total_income TYPE NUMERIC(20,4),
    ALTER COLUMN total_outcome TYPE NUMERIC(20,4),
    ALTER COLUMN net_utility TYPE NUMERIC(20,4),
    ALTER COLUMN fund_amount TYPE NUMERIC(20,4),
    ALTER COLUMN partner_a_amount TYPE NUMERIC(20,4),
    ALTER COLUMN partner_b_amount TYPE NUMERIC(20,4);
