-- MIGRATION: Cleanup Incorrect Inventory Entries
-- v2.4 - 2026-02-27

-- 1. Reset stock for Focaccia de Ajos Confitados
UPDATE public.v2_catalog 
SET stock = 0 
WHERE name ILIKE '%Ajos Confitados%';

-- 2. Subtract 31 units from Focaccia de Tomates Pomodoro Confit
-- Nota: Usamos GREATEST(stock - 31, 0) para no quedar con stock negativo
UPDATE public.v2_catalog 
SET stock = GREATEST(stock - 31, 0)
WHERE name ILIKE '%Tomates Pomodoro%';

-- 3. Registrar ajuste en Kardex para auditoría
INSERT INTO public.v2_inventory_transactions (item_type, item_id, transaction_type, quantity, reason)
SELECT 'CATALOG_ITEM', id, 'ADJUSTMENT', 
       CASE WHEN name ILIKE '%Ajos Confitados%' THEN -1 ELSE -31 END, 
       'Limpieza manual de inventario (error en producción de encargos)'
FROM public.v2_catalog 
WHERE name ILIKE '%Ajos Confitados%' OR name ILIKE '%Tomates Pomodoro%';
