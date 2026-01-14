-- MIGRATION 05 (CORREGIDA): Limpieza de relaciones y dependencias
-- Esta migración resuelve el error de dependencia con v_production_costs

-- 1. Liberar columnas bloqueadas (Borrar vistas dependientes)
DROP VIEW IF EXISTS v_production_costs;
DROP VIEW IF EXISTS v_recipe_items_detailed;

-- 2. Reestructurar Foreign Keys para eliminar ambigüedad
-- Eliminamos los nombres genéricos que Supabase crea por defecto
ALTER TABLE recipe_items 
    DROP CONSTRAINT IF EXISTS recipe_items_recipe_id_fkey,
    DROP CONSTRAINT IF EXISTS recipe_items_sub_recipe_id_fkey,
    DROP CONSTRAINT IF EXISTS recipe_items_ingredient_id_fkey;

-- Agregamos constraints con nombres EXPLÍCITOS
ALTER TABLE recipe_items
    ADD CONSTRAINT rel_parent_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    ADD CONSTRAINT rel_sub_recipe FOREIGN KEY (sub_recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
    ADD CONSTRAINT rel_supply FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE RESTRICT;

-- 3. Borrar columna legada (Ahora que no tiene dependencias)
ALTER TABLE recipe_items DROP COLUMN IF EXISTS ingredient_id;

-- 4. Recrear Vista v_recipe_items_detailed (Para la App)
CREATE VIEW v_recipe_items_detailed AS
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

-- 5. Recrear Vista v_production_costs (Costos estimados)
-- Adaptada para usar supplies y porcentajes panaderos
CREATE VIEW v_production_costs AS
SELECT 
    r.id as recipe_id,
    r.name as recipe_name,
    SUM(
        CASE 
            WHEN ri.unit_type = '%' THEN (ri.percentage / 100.0) * 1000 * COALESCE(s.last_purchase_price / NULLIF(s.equivalence, 0), 0)
            ELSE ri.quantity * COALESCE(s.last_purchase_price / NULLIF(s.equivalence, 0), 0)
        END
    ) as total_estimated_cost_1kg_base
FROM recipes r
JOIN recipe_items ri ON r.id = ri.recipe_id
LEFT JOIN supplies s ON ri.supply_id = s.id
GROUP BY r.id, r.name;
