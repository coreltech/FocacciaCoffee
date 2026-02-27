-- DIAGNÓSTICO II: Buscar en Órdenes y Catálogo
-- Queremos ver por qué el usuario sigue viendo "31 de pomodoro" y "3 de cebollas"

-- 1. Ver qué órdenes están pendientes (Esto es lo que sale en la lista de producción)
SELECT 
    o.id as order_id, 
    o.status as order_status, 
    oi.product_name, 
    oi.quantity,
    o.is_preorder
FROM public.v2_orders o
JOIN public.v2_order_items oi ON o.id = oi.order_id
WHERE o.status = 'Pendiente'
ORDER BY o.sale_date DESC;

-- 2. Ver el stock real en el catálogo para esos productos específicos
SELECT id, name, stock 
FROM public.v2_catalog 
WHERE name ~* 'pomodoro' OR name ~* 'cebolla' OR name ~* 'ajo';
