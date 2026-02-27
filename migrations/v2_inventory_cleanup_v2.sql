-- MIGRATION: Cleanup Incorrect Inventory Entries (v2)
-- v2.5 - 2026-02-27

-- 1. Reset stock for Focaccia de Ajos Confitados
UPDATE public.v2_catalog 
SET stock = 0 
WHERE name ILIKE '%ajo%' AND name ILIKE '%confit%';

-- 2. Subtract 31 units from Focaccia de Tomates Pomodoro Confit
UPDATE public.v2_catalog 
SET stock = GREATEST(stock - 31, 0)
WHERE name ILIKE '%tomate%' AND name ILIKE '%pomodoro%';

-- 3. Reset stock for Focaccia de Cebollas Ambar (Solicitado por el usuario)
UPDATE public.v2_catalog 
SET stock = 0 
WHERE name ILIKE '%cebolla%' AND name ILIKE '%ambar%';

-- 4. Registrar ajuste en Kardex para auditoría
INSERT INTO public.v2_inventory_transactions (item_type, item_id, transaction_type, quantity, reason)
SELECT 'CATALOG_ITEM', id, 'ADJUSTMENT', 
       CASE 
         WHEN name ILIKE '%ajo%' THEN -1 
         WHEN name ILIKE '%cebolla%' THEN -3 
         ELSE -31 
       END, 
       'Limpieza manual de inventario v2 (ajuste solicitado por usuario)'
FROM public.v2_catalog 
WHERE (name ILIKE '%ajo%' AND name ILIKE '%confit%') 
   OR (name ILIKE '%tomate%' AND name ILIKE '%pomodoro%')
   OR (name ILIKE '%cebolla%' AND name ILIKE '%ambar%');
