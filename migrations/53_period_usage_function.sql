-- MIGRATION 53: Period Usage Analysis Function
-- Calculates theoretical supply usage based on sales within a date range

CREATE OR REPLACE FUNCTION public.get_period_usage(p_start_date TIMESTAMP, p_end_date TIMESTAMP)
RETURNS TABLE (
    supply_id UUID,
    insumo_nombre TEXT,
    categoria TEXT,
    cantidad_teorica_usada NUMERIC,
    unidad_medida VARCHAR(20),
    costo_teorico_usd NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE
    orders AS (
        -- Base: Total items sold in period
        SELECT product_id, SUM(quantity) as total_qty
        FROM sales_orders
        WHERE sale_date >= p_start_date AND sale_date <= p_end_date
        GROUP BY product_id
    ),
    composition_breakdown AS (
        -- Level 1: Product -> Catalog Composition
        SELECT
            cc.supply_id,
            cc.recipe_id,
            (orders.total_qty * cc.quantity) as required_amount
        FROM orders
        JOIN catalog_composition cc ON orders.product_id = cc.catalog_id
    ),
    recipe_explosion AS (
        -- Recursive Step for Sub-recipes
        SELECT
            r.id as recipe_id,
            cb.required_amount as amount_needed
        FROM composition_breakdown cb
        JOIN recipes r ON cb.recipe_id = r.id
        
        UNION ALL

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
        -- Direct Supplies
        SELECT
            supply_id,
            required_amount as quantity
        FROM composition_breakdown
        WHERE supply_id IS NOT NULL

        UNION ALL

        -- Recipe Ingredients
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
        ROUND(SUM(sr.quantity), 2) as cantidad_teorica_usada,
        s.min_unit as unidad_medida,
        (SUM(sr.quantity) * (s.last_cost_usd / NULLIF(s.equivalence, 0)))::numeric(12,2) as costo_teorico_usd
    FROM supply_requirements sr
    JOIN supplies s ON sr.supply_id = s.id
    GROUP BY s.id, s.name, s.category, s.min_unit, s.equivalence, s.last_cost_usd
    ORDER BY costo_teorico_usd DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_period_usage(TIMESTAMP, TIMESTAMP) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
