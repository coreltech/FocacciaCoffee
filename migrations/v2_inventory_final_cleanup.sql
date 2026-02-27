-- MIGRATION: Cleanup Final (Surgical) - 2026-02-27
-- Este script quita los pedidos de la lista de producción y pone el stock en 0.

-- 1. Marcar los Pedidos (Encargos) como Completados para que desaparezcan de la lista
UPDATE public.v2_orders 
SET status = 'Completada'
WHERE id IN (
    SELECT order_id 
    FROM public.v2_order_items 
    WHERE product_name ILIKE '%Pomodoro%' 
       OR product_name ILIKE '%Cebollas Ámbar%'
       OR product_name ILIKE '%Ajo%'
)
AND status = 'Pendiente';

-- 2. Asegurar Stock en 0 en el Catálogo (Usando IDs exactos de tu diagnóstico)
UPDATE public.v2_catalog 
SET stock = 0 
WHERE id IN (
    'cf22133c-aa19-4a67-8495-3712f18b22c3', -- Focaccia de Cebollas Ámbar
    'ddff527f-a3a4-4363-bff5-4486d09745c2', -- Focaccia de Ajos Confitados
    '095ccab3-e8e9-44b6-8422-4cebfd2654e7'  -- Focaccia Pomodoro Confit
);

-- 3. Registrar ajuste en Kardex para que cuadre todo
INSERT INTO public.v2_inventory_transactions (item_type, item_id, transaction_type, quantity, reason)
SELECT 'CATALOG_ITEM', id, 'ADJUSTMENT', stock * -1, 'Limpieza final de inventario y pedidos históricos'
FROM public.v2_catalog 
WHERE id IN ('cf22133c-aa19-4a67-8495-3712f18b22c3', '095ccab3-e8e9-44b6-8422-4cebfd2654e7');
