-- DIAGNÓSTICO: Buscar nombres exactos
-- Ejecuta esto y dime qué nombres aparecen

SELECT 'CATÁLOGO' as origen, name, stock FROM public.v2_catalog
UNION ALL
SELECT 'RECETAS' as origen, name, stock FROM public.v2_recipes
ORDER BY name;
