-- MIGRATION 35: Advanced Composition & Nested Stock Deduction (FIXED SYNTAX)
-- Adds support for Products as components and fixes Baker's Formula (%) recursion.

-- 1. Extend catalog_composition to support other Catalog Items (nested products)
ALTER TABLE public.catalog_composition 
    ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES public.sales_prices(id) ON DELETE SET NULL;

-- 2. Clean up existing functions to allow changing parameter names/types
DROP FUNCTION IF EXISTS public.registrar_produccion_atomica(UUID, NUMERIC, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.deducir_componentes_receta(UUID, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.deducir_componentes_receta(UUID, NUMERIC, BIGINT);

-- 3. Improved Recursive Deduction Function
CREATE OR REPLACE FUNCTION public.deducir_componentes_receta(
    p_recipe_id UUID,
    p_target_weight NUMERIC,
    p_log_id TEXT
) RETURNS VOID AS $func$
DECLARE
    v_total_percentage NUMERIC;
    v_recipe_type TEXT;
    item RECORD;
    v_quantity_to_deduct NUMERIC;
BEGIN
    SELECT tipo_receta INTO v_recipe_type FROM public.recipes WHERE id = p_recipe_id;

    IF v_recipe_type = 'MASA' THEN
        SELECT SUM(percentage) INTO v_total_percentage 
        FROM public.recipe_items 
        WHERE recipe_id = p_recipe_id AND unit_type = '%';
        
        IF v_total_percentage IS NULL OR v_total_percentage = 0 THEN
            v_recipe_type := 'TRADICIONAL';
        END IF;
    END IF;

    FOR item IN 
        SELECT * FROM public.recipe_items WHERE recipe_id = p_recipe_id
    LOOP
        IF v_recipe_type = 'MASA' AND item.unit_type = '%' THEN
            v_quantity_to_deduct := (p_target_weight * item.percentage) / v_total_percentage;
        ELSE
            v_quantity_to_deduct := item.quantity * p_target_weight;
        END IF;

        IF item.supply_id IS NOT NULL THEN
            UPDATE public.supplies 
            SET stock_min_units = stock_min_units - v_quantity_to_deduct
            WHERE id = item.supply_id;

            INSERT INTO public.inventory_transactions (
                supply_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                item.supply_id, 'CONSUMO', v_quantity_to_deduct, p_log_id, 'Insumo usado en producción'
            );
        ELSIF item.sub_recipe_id IS NOT NULL THEN
            PERFORM public.deducir_componentes_receta(item.sub_recipe_id, v_quantity_to_deduct, p_log_id);
        END IF;
    END LOOP;
END;
$func$ LANGUAGE plpgsql;

-- 4. Enhanced Atomic Production Entry Point
CREATE OR REPLACE FUNCTION public.registrar_produccion_atomica(
    p_catalog_id UUID,
    p_units NUMERIC,
    p_recipe_name TEXT,
    p_total_cost NUMERIC
) RETURNS JSONB AS $func$
DECLARE
    v_log_id TEXT;
    comp RECORD;
    v_item_name TEXT;
BEGIN
    -- A. Insert Production Log
    INSERT INTO public.production_logs (
        recipe_name, cantidad_unidades, costo_total_tanda, fecha_produccion
    ) VALUES (
        p_recipe_name, p_units, p_total_cost, NOW()
    ) RETURNING id::text INTO v_log_id;

    -- B. Deduct Components
    FOR comp IN 
        SELECT * FROM public.catalog_composition WHERE catalog_id = p_catalog_id
    LOOP
        -- Reset name to identify which one failed if check violation occurs
        v_item_name := 'Componente Desconocido';

        IF comp.supply_id IS NOT NULL THEN
            SELECT name INTO v_item_name FROM public.supplies WHERE id = comp.supply_id;
            UPDATE public.supplies 
            SET stock_min_units = stock_min_units - (comp.quantity * p_units)
            WHERE id = comp.supply_id;

            INSERT INTO public.inventory_transactions (
                supply_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                comp.supply_id, 'CONSUMO', comp.quantity * p_units, v_log_id, 'Packaging/Directo producción'
            );

        ELSIF comp.recipe_id IS NOT NULL THEN
            SELECT name INTO v_item_name FROM public.recipes WHERE id = comp.recipe_id;
            PERFORM public.deducir_componentes_receta(comp.recipe_id, comp.quantity * p_units, v_log_id);

        ELSIF comp.component_id IS NOT NULL THEN
            SELECT product_name INTO v_item_name FROM public.sales_prices WHERE id = comp.component_id;
            UPDATE public.sales_prices 
            SET stock_disponible = stock_disponible - (comp.quantity * p_units)
            WHERE id = comp.component_id;

            INSERT INTO public.inventory_transactions (
                product_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                comp.component_id, 'CONSUMO', comp.quantity * p_units, v_log_id, 'Consumo componente PT en producción'
            );
        END IF;
    END LOOP;

    -- C. Increment stock of the finished product
    UPDATE public.sales_prices 
    SET stock_disponible = stock_disponible + p_units
    WHERE id = p_catalog_id;

    INSERT INTO public.inventory_transactions (
        product_id, transaction_type, quantity, reference_id, reason
    ) VALUES (
        p_catalog_id, 'PRODUCCION', p_units, v_log_id, 'Producción final: ' || p_recipe_name
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Producción registrada. Inventario actualizado.',
        'log_id', v_log_id
    );

EXCEPTION 
    WHEN check_violation THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'STOCK_INSUFICIENTE', 
            'message', 'Stock insuficiente para el componente: ' || v_item_name
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$func$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
