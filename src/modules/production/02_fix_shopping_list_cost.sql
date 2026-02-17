-- MIGRATION: Fix Shopping List Cost Calculation to use Proportional Cost (Usage Cost)
-- User Requirement: "Calculate 6 grams * cost per gram", not "1 pack * cost per pack".

CREATE OR REPLACE VIEW public.v_shopping_list AS
WITH RECURSIVE
orders AS (
    -- Base: Total items ordered that are pending production (THIS WEEK ONLY)
    SELECT product_id, SUM(quantity) as total_qty
    FROM sales_orders
    WHERE fulfillment_status = 'pendiente'
      AND sale_date >= date_trunc('week', CURRENT_DATE) -- Filter out old backlog (Accounts Receivable)
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
    -- 1. Direct Supplies from Catalog Composition
    SELECT
        supply_id,
        required_amount as quantity
    FROM composition_breakdown
    WHERE supply_id IS NOT NULL

    UNION ALL

    -- 2. Ingredients from Recipe Explosion
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
    -- Calculate Packs (kept for reference)
    CEIL(SUM(sr.quantity) / NULLIF(s.equivalence, 0)) as paquetes_a_comprar,
    -- FIX: Calculate Proportional Cost (Usage Cost) instead of Pack Cost
    -- Formula: Quantity * (Last Cost / Equivalence)
    (SUM(sr.quantity) * (s.last_cost_usd / NULLIF(s.equivalence, 1)))::numeric(12,2) as costo_estimado_usd
FROM supply_requirements sr
JOIN supplies s ON sr.supply_id = s.id
GROUP BY s.id, s.name, s.category, s.min_unit, s.equivalence, s.last_cost_usd
ORDER BY s.category, s.name;

-- Grant Permissions
GRANT SELECT ON public.v_shopping_list TO anon, authenticated, service_role;

-- Reload Schema
NOTIFY pgrst, 'reload schema';
