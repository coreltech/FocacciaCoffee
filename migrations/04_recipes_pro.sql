-- MIGRATION 04: Recipes Pro & Bakers Formula
-- Adds support for percentages, base ingredients, and sub-recipes.

-- 1. Upgrade recipes table
ALTER TABLE recipes 
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS expected_weight numeric(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS category text; 

-- 2. Upgrade recipe_items table
-- We drop old columns or keep them? User said "Don't delete until manual migration".
-- But recipe_items is small usually. Let's add new columns first.
ALTER TABLE recipe_items
    ADD COLUMN IF NOT EXISTS supply_id uuid REFERENCES supplies(id),
    ADD COLUMN IF NOT EXISTS is_base boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS unit_type varchar(10) DEFAULT 'g', -- 'g', 'ml', 'unid', '%'
    ADD COLUMN IF NOT EXISTS percentage numeric(8,4) DEFAULT 0;

-- 3. Create a view for easy cost calculation
-- This view joins recipe items with supply prices
CREATE OR REPLACE VIEW v_recipe_items_detailed AS
SELECT 
    ri.id,
    ri.recipe_id,
    ri.is_base,
    ri.unit_type,
    ri.quantity,
    ri.percentage,
    ri.supply_id,
    ri.sub_recipe_id,
    COALESCE(s.name, r_sub.name) as name,
    COALESCE(s.last_purchase_price / NULLIF(s.equivalence, 0), 0) as cost_per_unit_min,
    s.min_unit
FROM recipe_items ri
LEFT JOIN supplies s ON ri.supply_id = s.id
LEFT JOIN recipes r_sub ON ri.sub_recipe_id = r_sub.id;
