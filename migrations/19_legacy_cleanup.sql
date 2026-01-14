-- MIGRATION 19: Final Legacy Cleanup & Formula Standardization
-- Purging 'ingredients' references and ensuring 'supplies' is the single source of truth.

-- 1. Redefine Unified Inputs View (Point exclusively to supplies)
DROP VIEW IF EXISTS public.v_unified_inputs CASCADE;
CREATE OR REPLACE VIEW public.v_unified_inputs AS
SELECT 
    id, 
    name, 
    category as tipo, -- Maintain 'tipo' field for JS compatibility
    min_unit as unit, 
    last_purchase_price / NULLIF(equivalence, 0) as unit_cost_usd,
    stock_min_units as stock_actual
FROM public.supplies;

-- 2. Ensure v_recipe_items_detailed is clean (No components from ingredients)
-- (Already handled by Migration 05, but re-applying to be 100% sure)
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
        ELSE 0 
    END as cost_per_unit_min,
    s.min_unit
FROM recipe_items ri
LEFT JOIN supplies s ON ri.supply_id = s.id
LEFT JOIN recipes r_sub ON ri.sub_recipe_id = r_sub.id;

-- 3. Rename Legacy Table to avoid "Noisy" suggestions or accidental use
-- Using a DO block to make it re-runnable
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients' AND table_schema = 'public') THEN
        ALTER TABLE public.ingredients RENAME TO zzz_ingredients_legacy;
    END IF;
END $$;

-- 4. Permissions
GRANT SELECT ON public.v_unified_inputs TO anon, authenticated, service_role;
GRANT SELECT ON public.v_recipe_items_detailed TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
