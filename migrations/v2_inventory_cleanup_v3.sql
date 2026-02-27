-- MIGRATION: Cleanup Incorrect Inventory Entries (v3 - Ultra Permissive)
-- v2.6 - 2026-02-27

-- 1. Reset stock for ANY item containing 'ajo' and 'confit'
UPDATE public.v2_catalog 
SET stock = 0 
WHERE name ~* 'ajo' AND name ~* 'confit';

-- 2. Subtract 31 units from ANY item containing 'pomodoro'
UPDATE public.v2_catalog 
SET stock = GREATEST(stock - 31, 0)
WHERE name ~* 'pomodoro';

-- 3. Reset stock for ANY item containing 'cebolla' and 'ambar'
UPDATE public.v2_catalog 
SET stock = 0 
WHERE name ~* 'cebolla' AND name ~* 'ambar';

-- 4. Registrar ajuste en Kardex para auditoría
-- Insertamos solo si el update anterior afectó algo (usamos una subconsulta para IDs)
INSERT INTO public.v2_inventory_transactions (item_type, item_id, transaction_type, quantity, reason)
SELECT 'CATALOG_ITEM', id, 'ADJUSTMENT', 0, 'Limpieza manual v3 (Permisiva)'
FROM public.v2_catalog 
WHERE name ~* 'ajo' OR name ~* 'pomodoro' OR name ~* 'cebolla';
