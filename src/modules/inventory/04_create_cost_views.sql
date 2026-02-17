
-- 1. Vista de Costos de Producción (Recetas)
-- Calcula el costo total de sumistros y sub-recetas para cada receta
CREATE OR REPLACE VIEW v_production_costs AS
WITH recipe_details AS (
    SELECT 
        r.id AS recipe_id,
        r.name AS recipe_name,
        r.expected_weight,
        ri.supply_id,
        ri.sub_recipe_id,
        ri.quantity,
        s.last_purchase_price AS supply_price,
        s.equivalence AS supply_equiv,
        -- Costo si es suministro: (Precio / Equivalencia) * Cantidad
        CASE 
            WHEN ri.supply_id IS NOT NULL THEN 
                (COALESCE(s.last_purchase_price, 0) / NULLIF(s.equivalence, 0)) * ri.quantity
            ELSE 0 
        END AS supply_cost
    FROM recipes r
    JOIN recipe_items ri ON r.id = ri.recipe_id
    LEFT JOIN supplies s ON ri.supply_id = s.id
)
SELECT 
    recipe_id,
    recipe_name,
    SUM(supply_cost) AS total_cost_usd,
    expected_weight,
    -- Costo por gramo (o unidad de peso esperada)
    CASE 
        WHEN expected_weight > 0 THEN SUM(supply_cost) / expected_weight 
        ELSE 0 
    END AS cost_per_unit
FROM recipe_details
GROUP BY recipe_id, recipe_name, expected_weight;


-- 2. Vista de Costos de Catálogo (Productos de Venta)
-- Calcula el costo basado en la composición (recetas + insumos directos)
CREATE OR REPLACE VIEW v_catalog_costs AS
SELECT 
    sp.id AS product_id,
    sp.product_name,
    sp.precio_venta_final AS sale_price,
    COALESCE(SUM(
        CASE 
            -- Si es una receta: Costo por gramo * Cantidad (gramos)
            WHEN cc.recipe_id IS NOT NULL THEN 
                (vpc.cost_per_unit * cc.quantity)
            -- Si es un insumo directo (ej: bebida): (Precio / Equiv) * Cantidad
            WHEN cc.supply_id IS NOT NULL THEN 
                (COALESCE(s.last_purchase_price, 0) / NULLIF(s.equivalence, 0)) * cc.quantity
            -- Si es otro componente (combo): 0 por ahora para evitar recursión compleja
            ELSE 0 
        END
    ), 0) AS cost_usd,
    
    -- Margen Teórico
    (sp.precio_venta_final - COALESCE(SUM(
        CASE 
            WHEN cc.recipe_id IS NOT NULL THEN (vpc.cost_per_unit * cc.quantity)
            WHEN cc.supply_id IS NOT NULL THEN (COALESCE(s.last_purchase_price, 0) / NULLIF(s.equivalence, 0)) * cc.quantity
            ELSE 0 
        END
    ), 0)) AS margin_usd

FROM sales_prices sp
LEFT JOIN catalog_composition cc ON sp.id = cc.catalog_id
LEFT JOIN v_production_costs vpc ON cc.recipe_id = vpc.recipe_id
LEFT JOIN supplies s ON cc.supply_id = s.id
WHERE sp.esta_activo = true
GROUP BY sp.id, sp.product_name, sp.precio_venta_final;
