-- =====================================================
-- RESET TOTAL DE DATOS - Focaccia Plus & Coffee ERP
-- =====================================================
-- ADVERTENCIA: Este script elimina TODOS los registros
-- de las tablas operacionales y reinicia los IDs a 1.
-- La estructura (tablas, vistas, funciones, triggers)
-- se mantiene intacta.
-- =====================================================

-- Deshabilitar temporalmente las restricciones de FK para evitar conflictos
SET session_replication_role = 'replica';

-- 1. LIMPIAR VENTAS (Sales Orders)
TRUNCATE TABLE sales_orders RESTART IDENTITY CASCADE;

-- 2. LIMPIAR TRANSACCIONES DE INVENTARIO (Kardex)
TRUNCATE TABLE inventory_transactions RESTART IDENTITY CASCADE;

-- 3. LIMPIAR LOGS DE PRODUCCIÓN
TRUNCATE TABLE production_logs RESTART IDENTITY CASCADE;

-- 4. LIMPIAR COMPOSICIÓN DE CATÁLOGO
TRUNCATE TABLE catalog_composition RESTART IDENTITY CASCADE;

-- 5. LIMPIAR PRECIOS DE VENTA (Catálogo)
TRUNCATE TABLE sales_prices RESTART IDENTITY CASCADE;

-- 6. LIMPIAR ITEMS DE RECETAS
TRUNCATE TABLE recipe_items RESTART IDENTITY CASCADE;

-- 7. LIMPIAR RECETAS
TRUNCATE TABLE recipes RESTART IDENTITY CASCADE;

-- 8. LIMPIAR SUMINISTROS (Insumos)
TRUNCATE TABLE supplies RESTART IDENTITY CASCADE;

-- Rehabilitar las restricciones de FK
SET session_replication_role = 'origin';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Confirmar que las tablas están vacías
SELECT 'sales_orders' as tabla, COUNT(*) as registros FROM sales_orders
UNION ALL
SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
UNION ALL
SELECT 'production_logs', COUNT(*) FROM production_logs
UNION ALL
SELECT 'catalog_composition', COUNT(*) FROM catalog_composition
UNION ALL
SELECT 'sales_prices', COUNT(*) FROM sales_prices
UNION ALL
SELECT 'recipe_items', COUNT(*) FROM recipe_items
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'supplies', COUNT(*) FROM supplies;
