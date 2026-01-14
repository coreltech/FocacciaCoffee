-- MIGRATION 32: ERP View Restoration & Schema Stability
-- Restores core views dropped during Migration 31 in order to fix ERP "Module Load Failure".

-- 1. Restore v_recipe_items_detailed (Required for Recetas and Catalogo)
CREATE OR REPLACE VIEW public.v_recipe_items_detailed AS
SELECT 
    ri.id,
    ri.recipe_id,
    ri.is_base,
    ri.unit_type,
    ri.quantity,
    ri.percentage,
    ri.supply_id,
    ri.sub_recipe_id,
    CASE 
        WHEN ri.supply_id IS NOT NULL THEN s.name 
        ELSE r_sub.name 
    END as name,
    CASE 
        WHEN ri.supply_id IS NOT NULL THEN (s.last_purchase_price / NULLIF(s.equivalence, 0))
        WHEN ri.sub_recipe_id IS NOT NULL THEN (public.fn_get_recipe_cost(ri.sub_recipe_id) / 1000.0)
        ELSE 0 
    END as cost_per_unit_min,
    s.min_unit
FROM recipe_items ri
LEFT JOIN supplies s ON ri.supply_id = s.id
LEFT JOIN recipes r_sub ON ri.sub_recipe_id = r_sub.id;

-- 2. Restore v_production_costs (Required for Config Productos)
CREATE OR REPLACE VIEW public.v_production_costs AS
SELECT 
    r.id as recipe_id,
    r.name as recipe_name,
    public.fn_get_recipe_cost(r.id) as total_estimated_cost_1kg_base
FROM recipes r;

-- 3. Restore v_catalog_costs (Required for Profit Analysis)
CREATE OR REPLACE VIEW public.v_catalog_costs AS
WITH component_costs AS (
    SELECT 
        cc.catalog_id,
        cc.quantity,
        CASE 
            WHEN cc.recipe_id IS NOT NULL THEN (public.fn_get_recipe_cost(cc.recipe_id) / 1000.0)
            WHEN cc.supply_id IS NOT NULL THEN (SELECT last_purchase_price / NULLIF(equivalence, 0) FROM supplies s WHERE s.id = cc.supply_id)
            ELSE 0 
        END as cost_per_unit
    FROM catalog_composition cc
)
SELECT 
    sp.id as catalog_id,
    sp.product_name,
    sp.precio_venta_final as sale_price_usd,
    COALESCE(SUM(c.quantity * c.cost_per_unit), 0) as production_cost_usd,
    (sp.precio_venta_final - COALESCE(SUM(c.quantity * c.cost_per_unit), 0)) as margin_usd
FROM sales_prices sp
LEFT JOIN component_costs c ON sp.id = c.catalog_id
GROUP BY sp.id, sp.product_name, sp.precio_venta_final;

-- 4. Restore Cash & Sales Reporting Views
CREATE OR REPLACE VIEW public.v_daily_cash_closure AS
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

CREATE OR REPLACE VIEW public.v_product_sales_summary AS
SELECT 
    (sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date as sale_day,
    product_name,
    SUM(quantity) as total_qty,
    SUM(total_amount) as total_usd,
    COUNT(*) as order_count
FROM sales_orders
GROUP BY 1, 2
ORDER BY 1 DESC, total_qty DESC;

-- 5. Restore Inventory & Production Views
CREATE OR REPLACE VIEW public.v_unified_inputs AS
SELECT 
    id, 
    name, 
    category as tipo,
    min_unit as unit, 
    last_purchase_price / NULLIF(equivalence, 0) as unit_cost_usd,
    stock_min_units as stock_actual
FROM public.supplies;

CREATE OR REPLACE VIEW public.v_stock_movements AS
SELECT 
    it.id,
    it.product_id,
    it.supply_id,
    it.transaction_type,
    it.quantity,
    it.reference_id,
    it.created_at,
    CASE 
        WHEN it.product_id IS NOT NULL THEN (SELECT product_name FROM sales_prices WHERE id = it.product_id)
        WHEN it.supply_id IS NOT NULL THEN (SELECT name FROM supplies WHERE id = it.supply_id)
        ELSE 'Otro/Kardex'
    END as item_name
FROM inventory_transactions it;

-- 6. Restore Permissions
GRANT SELECT ON public.v_recipe_items_detailed TO anon, authenticated, service_role;
GRANT SELECT ON public.v_production_costs TO anon, authenticated, service_role;
GRANT SELECT ON public.v_catalog_costs TO anon, authenticated, service_role;
GRANT SELECT ON public.v_daily_cash_closure TO anon, authenticated, service_role;
GRANT SELECT ON public.v_product_sales_summary TO anon, authenticated, service_role;
GRANT SELECT ON public.v_unified_inputs TO anon, authenticated, service_role;
GRANT SELECT ON public.v_stock_movements TO anon, authenticated, service_role;

-- 7. Final Schema Refresh
NOTIFY pgrst, 'reload schema';
