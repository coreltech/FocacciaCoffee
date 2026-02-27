-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - FIX DE PRECISIÓN ABSOLUTO (V2 ONLY)
-- Ejecutar este script si el sistema sigue redondeando a 2 decimales.
-- =====================================================================================

DO $$ 
BEGIN
    -- 1. Actualizar Insumos V2 (Vital para el reporte del usuario)
    ALTER TABLE public.v2_supplies ALTER COLUMN last_price TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_supplies ALTER COLUMN stock TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_supplies ALTER COLUMN min_stock TYPE NUMERIC(20,4);

    -- 2. Actualizar Compras V2
    ALTER TABLE public.v2_purchase_items ALTER COLUMN unit_price_usd TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_purchase_items ALTER COLUMN subtotal_usd TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_purchases ALTER COLUMN total_usd TYPE NUMERIC(20,4);

    -- 3. Actualizar Recetas V2
    ALTER TABLE public.v2_recipe_items ALTER COLUMN quantity TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_recipe_items ALTER COLUMN percentage TYPE NUMERIC(10,4);

    -- 4. Actualizar Catálogo e Inventario V2
    ALTER TABLE public.v2_catalog ALTER COLUMN price TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_catalog ALTER COLUMN stock TYPE NUMERIC(20,4);
    ALTER TABLE public.v2_catalog_composition ALTER COLUMN quantity TYPE NUMERIC(20,4);

    RAISE NOTICE 'Upgrade de precisión V2 completado con éxito.';
END $$;
