-- MIGRATION 10: FIX UUID vs BIGINT and Sync Schema
-- This script fixes the incompatible data types and ensures total schema sync.

-- 1. Full Cleanup
DROP VIEW IF EXISTS public.v_catalog_costs;
DROP TABLE IF EXISTS public.catalog_composition;

-- 2. Create Table with matching UUID types
CREATE TABLE public.catalog_composition (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    catalog_id UUID NOT NULL REFERENCES public.sales_prices(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    supply_id BIGINT REFERENCES public.supplies(id) ON DELETE SET NULL, -- Supplies uses BIGINT
    quantity NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Either recipe or supply, but not both
    CONSTRAINT recipe_or_supply_check CHECK (
        (recipe_id IS NOT NULL AND supply_id IS NULL) OR
        (recipe_id IS NULL AND supply_id IS NOT NULL)
    )
);

-- 3. Security & Grants
ALTER TABLE public.catalog_composition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.catalog_composition FOR ALL USING (true);
GRANT ALL ON TABLE public.catalog_composition TO anon, authenticated, service_role;

-- 4. Rebuild the Cost View (Real-Time)
CREATE OR REPLACE VIEW public.v_catalog_costs AS
WITH component_costs AS (
    SELECT 
        cc.catalog_id,
        cc.quantity,
        CASE 
            WHEN cc.recipe_id IS NOT NULL THEN (SELECT total_estimated_cost_1kg_base / 1000 FROM v_production_costs vpc WHERE vpc.recipe_id = cc.recipe_id)
            WHEN cc.supply_id IS NOT NULL THEN (SELECT last_purchase_price / equivalence FROM supplies s WHERE s.id = cc.supply_id)
            ELSE 0 
        END as cost_per_unit
    FROM catalog_composition cc
)
SELECT 
    sp.id as catalog_id,
    sp.product_name,
    sp.precio_venta_final,
    COALESCE(SUM(c.quantity * c.cost_per_unit), 0) as total_production_cost
FROM sales_prices sp
LEFT JOIN component_costs c ON sp.id = c.catalog_id
GROUP BY sp.id, sp.product_name, sp.precio_venta_final;

GRANT SELECT ON public.v_catalog_costs TO anon, authenticated, service_role;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
