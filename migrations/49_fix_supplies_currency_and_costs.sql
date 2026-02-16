-- MIGRATION 49: Fix Supplies Currency & Cost Engine (Revisión Final)

-- 1. Add Currency Columns to Supplies
ALTER TABLE public.supplies 
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'VES' CHECK (currency_code IN ('USD', 'EUR', 'VES')),
ADD COLUMN IF NOT EXISTS last_cost_usd NUMERIC(12,4) DEFAULT 0;

-- 2. Trigger Function to Auto-Calculate USD Cost (CON PARCHE DE SEGURIDAD)
CREATE OR REPLACE FUNCTION public.calculate_supply_cost_usd()
RETURNS TRIGGER AS $$
DECLARE
    v_rate_usd NUMERIC;
    v_rate_eur NUMERIC;
BEGIN
    -- Get latest rates (Seguro contra múltiples registros)
    SELECT rate_to_ves INTO v_rate_usd FROM public.exchange_rates WHERE currency_code = 'USD' ORDER BY updated_at DESC LIMIT 1;
    SELECT rate_to_ves INTO v_rate_eur FROM public.exchange_rates WHERE currency_code = 'EUR' ORDER BY updated_at DESC LIMIT 1;

    -- Fallback safety
    v_rate_usd := COALESCE(v_rate_usd, 1);
    v_rate_eur := COALESCE(v_rate_eur, 1);

    -- Calculate based on currency
    IF NEW.currency_code = 'USD' THEN
        NEW.last_cost_usd := NEW.last_purchase_price;
    ELSIF NEW.currency_code = 'EUR' THEN
        NEW.last_cost_usd := (NEW.last_purchase_price * v_rate_eur) / v_rate_usd;
    ELSE -- 'VES'
        NEW.last_cost_usd := NEW.last_purchase_price / v_rate_usd;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS tr_calculate_supply_cost_usd ON public.supplies;

CREATE TRIGGER tr_calculate_supply_cost_usd
BEFORE INSERT OR UPDATE OF last_purchase_price, currency_code
ON public.supplies
FOR EACH ROW
EXECUTE FUNCTION public.calculate_supply_cost_usd();

-- 4. Initial Bulk Update (Normalize existing data)
UPDATE public.supplies SET currency_code = 'VES' WHERE currency_code IS NULL;
UPDATE public.supplies SET last_purchase_price = last_purchase_price; 

-- 5. Update Recursive Recipe Cost Function to use USD
CREATE OR REPLACE FUNCTION public.fn_get_recipe_cost(p_recipe_id UUID) 
RETURNS NUMERIC AS $$
DECLARE
    v_total_cost NUMERIC := 0;
    item RECORD;
    v_item_unit_cost NUMERIC;
BEGIN
    FOR item IN SELECT * FROM public.recipe_items WHERE recipe_id = p_recipe_id LOOP
        IF item.supply_id IS NOT NULL THEN
            SELECT (last_cost_usd / NULLIF(equivalence, 0)) INTO v_item_unit_cost 
            FROM supplies WHERE id = item.supply_id;
            
            IF item.unit_type = '%' THEN
                v_total_cost := v_total_cost + (item.percentage / 100.0) * 1000 * COALESCE(v_item_unit_cost, 0);
            ELSE
                v_total_cost := v_total_cost + item.quantity * COALESCE(v_item_unit_cost, 0);
            END IF;
        ELSIF item.sub_recipe_id IS NOT NULL THEN
            v_total_cost := v_total_cost + (item.quantity / 1000.0) * public.fn_get_recipe_cost(item.sub_recipe_id);
        END IF;
    END LOOP;
    RETURN COALESCE(v_total_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- 6. Update View v_catalog_costs (Simplified)
DROP VIEW IF EXISTS public.v_catalog_costs CASCADE;

CREATE OR REPLACE VIEW public.v_catalog_costs AS
WITH component_costs AS (
    SELECT 
        cc.catalog_id,
        cc.quantity,
        CASE 
            WHEN cc.recipe_id IS NOT NULL THEN (public.fn_get_recipe_cost(cc.recipe_id) / 1000.0)
            WHEN cc.supply_id IS NOT NULL THEN (
                SELECT last_cost_usd / NULLIF(equivalence, 0) 
                FROM supplies s WHERE s.id = cc.supply_id
            )
            ELSE 0 
        END as cost_per_unit_usd
    FROM catalog_composition cc
)
SELECT 
    sp.id as catalog_id,
    sp.product_name,
    sp.precio_venta_final as sale_price_usd,
    COALESCE(SUM(c.quantity * c.cost_per_unit_usd), 0) as production_cost_usd,
    (sp.precio_venta_final - COALESCE(SUM(c.quantity * c.cost_per_unit_usd), 0)) as margin_usd,
    CASE 
        WHEN sp.precio_venta_final > 0 THEN 
            ROUND((((sp.precio_venta_final - COALESCE(SUM(c.quantity * c.cost_per_unit_usd), 0)) / sp.precio_venta_final) * 100), 2)
        ELSE 0 
    END as margin_percentage
FROM sales_prices sp
LEFT JOIN component_costs c ON sp.id = c.catalog_id
GROUP BY sp.id, sp.product_name, sp.precio_venta_final;

-- 7. Grant Permissions
GRANT ALL ON FUNCTION public.calculate_supply_cost_usd() TO anon, authenticated, service_role;
GRANT SELECT ON public.v_catalog_costs TO anon, authenticated, service_role;

-- 8. Reload Schema
NOTIFY pgrst, 'reload schema';