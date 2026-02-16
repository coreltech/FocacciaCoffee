-- MIGRATION 50: Wednesday Shopping List Engine (Just-In-Time)
-- Description: Adds fulfillment status to orders and creates a Recursive View for raw material planning.

-- 1. Add Status Column to Sales Orders (Fulfillment Workflow)
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pendiente' 
CHECK (fulfillment_status IN ('pendiente', 'en_produccion', 'completado', 'entregado'));

-- OPTIONAL: Backfill existing orders to 'completado' so the shopping list starts fresh? 
-- Decision: We mark orders older than 24 hours as 'completado' to avoid clogging the list with historical data.
-- Only strictly 'pendiente' orders will appear in the list.
UPDATE public.sales_orders 
SET fulfillment_status = 'completado' 
WHERE sale_date < (NOW() - INTERVAL '24 hours') AND fulfillment_status = 'pendiente';

-- 2. Create Planning View (Recursive Explosion)
CREATE OR REPLACE VIEW public.v_shopping_list AS
WITH RECURSIVE
orders AS (
    -- Base: Total items ordered that are pending production
    SELECT product_id, SUM(quantity) as total_qty
    FROM sales_orders
    WHERE fulfillment_status = 'pendiente'
    GROUP BY product_id
),
composition_breakdown AS (
    -- Level 1: Product -> Catalog Composition
    -- Links products to their top-level components (Direct Supplies or Base Recipes)
    SELECT
        cc.supply_id,
        cc.recipe_id,
        (orders.total_qty * cc.quantity) as required_amount -- Quantity in Min Units (e.g., grams)
    FROM orders
    JOIN catalog_composition cc ON orders.product_id = cc.catalog_id
),
recipe_explosion AS (
    -- Recursive Step: Break down Recipes into Sub-recipes and Ingredients
    
    -- Anchor Member: Top-level recipes from Composition
    SELECT
        r.id as recipe_id,
        cb.required_amount as amount_needed -- Grams of this recipe needed
    FROM composition_breakdown cb
    JOIN recipes r ON cb.recipe_id = r.id

    UNION ALL

    -- Recursive Member: Sub-recipes found within recipes
    -- logic: If parent needs X grams, and child is Y% of parent, child needs X*(Y/100).
    -- logic: If child is fixed Z grams (per 1000g batch), child needs (X/1000)*Z.
    SELECT
        ri.sub_recipe_id,
        CASE
            WHEN ri.unit_type = '%' THEN (re.amount_needed * (ri.percentage / 100.0))
            ELSE (re.amount_needed / 1000.0) * ri.quantity
        END as amount_needed
    FROM recipe_explosion re
    JOIN recipe_items ri ON re.recipe_id = ri.recipe_id
    WHERE ri.sub_recipe_id IS NOT NULL
),
supply_requirements AS (
    -- 1. Direct Supplies from Catalog Composition (e.g. Soda cans, napkins)
    SELECT
        supply_id,
        required_amount as quantity
    FROM composition_breakdown
    WHERE supply_id IS NOT NULL

    UNION ALL

    -- 2. Ingredients from Recipe Explosion (e.g. Flour, Salt calculated from recursion)
    SELECT
        ri.supply_id,
        CASE
            WHEN ri.unit_type = '%' THEN (re.amount_needed * (ri.percentage / 100.0))
            ELSE (re.amount_needed / 1000.0) * ri.quantity
        END as quantity
    FROM recipe_explosion re
    JOIN recipe_items ri ON re.recipe_id = ri.recipe_id
    WHERE ri.supply_id IS NOT NULL
)
SELECT
    s.id as supply_id,
    s.name as insumo_nombre,
    s.category as categoria,
    ROUND(SUM(sr.quantity), 2) as cantidad_total_necesaria,
    s.min_unit as unidad_medida,
    -- Calculate Packs to Buy
    CEIL(SUM(sr.quantity) / NULLIF(s.equivalence, 0)) as paquetes_a_comprar,
    -- Calculate Estimated Cost (USD)
    (CEIL(SUM(sr.quantity) / NULLIF(s.equivalence, 0)) * s.last_cost_usd)::numeric(12,2) as costo_estimado_usd
FROM supply_requirements sr
JOIN supplies s ON sr.supply_id = s.id
GROUP BY s.id, s.name, s.category, s.min_unit, s.equivalence, s.last_cost_usd
ORDER BY s.category, s.name;

-- 3. Grant Permissions
GRANT SELECT ON public.v_shopping_list TO anon, authenticated, service_role;

-- 4. Reload Schema
NOTIFY pgrst, 'reload schema';
