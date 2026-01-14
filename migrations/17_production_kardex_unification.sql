-- MIGRATION 17: Production & Kardex Unification
-- Ensures atomic production with recursive ingredient deduction.

-- 1. Upgrade inventory_transactions to support Supplies
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS supply_id BIGINT REFERENCES public.supplies(id);

-- 2. Ensure supplies cannot have negative stock (Integrity Guard)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_supply_stock_no_negativo') THEN
        ALTER TABLE public.supplies ADD CONSTRAINT check_supply_stock_no_negativo CHECK (stock_min_units >= 0);
    END IF;
END $$;

-- 3. Recursive Function to Deduct Recipe Components
CREATE OR REPLACE FUNCTION public.deducir_componentes_receta(
    p_recipe_id UUID,
    p_quantity_batch NUMERIC,
    p_log_id BIGINT
) RETURNS VOID AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN 
        SELECT * FROM public.recipe_items WHERE recipe_id = p_recipe_id
    LOOP
        IF item.supply_id IS NOT NULL THEN
            -- Deduct Supply
            UPDATE public.supplies 
            SET stock_min_units = stock_min_units - (item.quantity * p_quantity_batch)
            WHERE id = item.supply_id;

            -- Log in Kardex (CONSUMO)
            INSERT INTO public.inventory_transactions (
                supply_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                item.supply_id, 'CONSUMO', item.quantity * p_quantity_batch, p_log_id, 'Insumo usado en producción'
            );
        ELSIF item.sub_recipe_id IS NOT NULL THEN
            -- Recursive call for sub-recipe (nested logic)
            PERFORM public.deducir_componentes_receta(item.sub_recipe_id, item.quantity * p_quantity_batch, p_log_id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Main Production Function (Atomic Entry Point)
CREATE OR REPLACE FUNCTION public.registrar_produccion_atomica(
    p_catalog_id UUID,
    p_units NUMERIC,
    p_recipe_name TEXT,
    p_total_cost NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_log_id BIGINT;
    comp RECORD;
BEGIN
    -- A. Insert Production Log
    INSERT INTO public.production_logs (
        recipe_name, cantidad_unidades, costo_total_tanda, fecha_produccion
    ) VALUES (
        p_recipe_name, p_units, p_total_cost, NOW()
    ) RETURNING id INTO v_log_id;

    -- B. Deduct Components (from catalog_composition)
    FOR comp IN 
        SELECT * FROM public.catalog_composition WHERE catalog_id = p_catalog_id
    LOOP
        IF comp.supply_id IS NOT NULL THEN
            -- Direct Supply (Packaging, etc.)
            UPDATE public.supplies 
            SET stock_min_units = stock_min_units - (comp.quantity * p_units)
            WHERE id = comp.supply_id;

            INSERT INTO public.inventory_transactions (
                supply_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                comp.supply_id, 'CONSUMO', comp.quantity * p_units, v_log_id, 'Packaging/Directo producción'
            );
        ELSIF comp.recipe_id IS NOT NULL THEN
            -- Deduct Recipe Ingredients (Recursive)
            PERFORM public.deducir_componentes_receta(comp.recipe_id, comp.quantity * p_units, v_log_id);
        END IF;
    END LOOP;

    -- C. Increment Catalog Stock (Finished Good)
    UPDATE public.sales_prices 
    SET stock_disponible = stock_disponible + p_units
    WHERE id = p_catalog_id;

    INSERT INTO public.inventory_transactions (
        product_id, transaction_type, quantity, reference_id, reason
    ) VALUES (
        p_catalog_id, 'PRODUCCION', p_units, v_log_id, 'Entrada PT: ' || p_recipe_name
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Producción registrada exitosamente. Inventario y Kardex actualizados.',
        'log_id', v_log_id
    );

EXCEPTION 
    WHEN check_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'STOCK_INSUFICIENTE',
            'message', 'No hay suficientes ingredientes o insumos para completar esta producción.'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
