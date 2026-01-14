-- MIGRATION 07: Product Assembly & Cost Traceability
-- Links finished goods (catalog) to their components (recipes/supplies)

-- 1. Create Catalog Composition Table
CREATE TABLE IF NOT EXISTS catalog_composition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id bigint REFERENCES sales_prices(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    supply_id uuid REFERENCES supplies(id) ON DELETE SET NULL,
    quantity numeric(12,4) NOT NULL DEFAULT 0, -- Grams, ml, or units per 1 product unit
    created_at timestamptz DEFAULT now(),
    -- Ensure either recipe or supply is provided
    CONSTRAINT check_composition_source CHECK (
        (recipe_id IS NOT NULL AND supply_id IS NULL) OR 
        (recipe_id IS NULL AND supply_id IS NOT NULL)
    )
);

-- 2. Create View for Real-time Cost and Margin Analysis
-- This view calculates the total production cost per unit and compares it with the sale price.
CREATE OR REPLACE VIEW v_catalog_costs AS
WITH component_costs AS (
    SELECT 
        cc.catalog_id,
        SUM(
            CASE 
                -- If it's a recipe, we use the estimated cost from v_production_costs (scaled to 1g if necessary)
                -- Current v_production_costs gives cost for 1kg base. We'll simplify for now 
                -- by assuming recipes in assembly are fixed recipes (TRADICIONAL) or we scale the MASA cost.
                -- For now, let's treat recipes as traditional cost per gram.
                WHEN cc.recipe_id IS NOT NULL THEN (pc.total_estimated_cost_1kg_base / 1000.0) * cc.quantity
                -- If it's a direct supply (like packaging), use its individual cost
                WHEN cc.supply_id IS NOT NULL THEN (s.last_purchase_price / NULLIF(s.equivalence, 0)) * cc.quantity
                ELSE 0
            END
        ) as total_unit_cost
    FROM catalog_composition cc
    LEFT JOIN v_production_costs pc ON cc.recipe_id = pc.recipe_id
    LEFT JOIN supplies s ON cc.supply_id = s.id
    GROUP BY cc.catalog_id
)
SELECT 
    sp.id,
    sp.product_name,
    sp.precio_venta_final as sale_price_usd,
    COALESCE(ccost.total_unit_cost, 0) as production_cost_usd,
    (sp.precio_venta_final - COALESCE(ccost.total_unit_cost, 0)) as margin_usd,
    CASE 
        WHEN sp.precio_venta_final > 0 
        THEN ((sp.precio_venta_final - COALESCE(ccost.total_unit_cost, 0)) / sp.precio_venta_final) * 100 
        ELSE 0 
    END as margin_percent
FROM sales_prices sp
LEFT JOIN component_costs ccost ON sp.id = ccost.catalog_id;
