-- MIGRATION 18: Recursive Cost Engine
-- Implements deep cost calculation for recipes and catalog items.

-- 1. Recursive Function to calculate recipe cost (per 1000g/units)
CREATE OR REPLACE FUNCTION public.fn_get_recipe_cost(p_recipe_id UUID) 
RETURNS NUMERIC AS $$
DECLARE
    v_total_cost NUMERIC := 0;
    item RECORD;
    v_item_unit_cost NUMERIC;
BEGIN
    FOR item IN SELECT * FROM public.recipe_items WHERE recipe_id = p_recipe_id LOOP
        IF item.supply_id IS NOT NULL THEN
            -- Get supply cost per min unit (e.g. $/g)
            SELECT (last_purchase_price / NULLIF(equivalence, 0)) INTO v_item_unit_cost 
            FROM supplies WHERE id = item.supply_id;
            
            IF item.unit_type = '%' THEN
                -- Panadero: Percentage of 1000g base
                v_total_cost := v_total_cost + (item.percentage / 100.0) * 1000 * COALESCE(v_item_unit_cost, 0);
            ELSE
                -- Fixed quantity (assumed in grams/min units)
                v_total_cost := v_total_cost + item.quantity * COALESCE(v_item_unit_cost, 0);
            END IF;
        ELSIF item.sub_recipe_id IS NOT NULL THEN
            -- Recursive call: quantity (kg or ratio) * cost of 1000 units of sub-recipe
            -- Assuming the quantity of sub-recipe is expressed in grams/min units relative to the 1kg base
            v_total_cost := v_total_cost + (item.quantity / 1000.0) * public.fn_get_recipe_cost(item.sub_recipe_id);
        END IF;
    END LOOP;
    RETURN COALESCE(v_total_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- 2. Update v_production_costs to use the recursive function
DROP VIEW IF EXISTS public.v_production_costs CASCADE;
CREATE OR REPLACE VIEW public.v_production_costs AS
SELECT 
    r.id as recipe_id,
    r.name as recipe_name,
    public.fn_get_recipe_cost(r.id) as total_estimated_cost_1kg_base
FROM recipes r;

-- 3. Update v_catalog_costs to use the recursive function
DROP VIEW IF EXISTS public.v_catalog_costs CASCADE;
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

-- 4. Permissions
GRANT ALL ON FUNCTION public.fn_get_recipe_cost(UUID) TO anon, authenticated, service_role;
GRANT SELECT ON public.v_production_costs TO anon, authenticated, service_role;
GRANT SELECT ON public.v_catalog_costs TO anon, authenticated, service_role;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
