-- MIGRATION 20: Universal UUID Alignment & Debug Fix
-- Resuelve el error "invalid input syntax for type bigint" en Producción y Kardex.

-- 1. Asegurar que inventory_transactions use UUID para product_id y supply_id
DO $$ 
BEGIN
    -- Eliminar FKs viejas para poder cambiar tipos
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='inventory_transactions' AND constraint_name='inventory_transactions_product_id_fkey') THEN
        ALTER TABLE public.inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
    END IF;
    
    -- Cambiar product_id a UUID
    ALTER TABLE public.inventory_transactions 
        ALTER COLUMN product_id TYPE UUID USING (
            CASE 
                WHEN product_id::text ~ '^[0-9a-fA-F-]{36}$' THEN product_id::text::uuid 
                ELSE NULL 
            END
        );

    -- Cambiar supply_id a UUID (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_transactions' AND column_name='supply_id') THEN
        ALTER TABLE public.inventory_transactions 
            ALTER COLUMN supply_id TYPE UUID USING (
                CASE 
                    WHEN supply_id::text ~ '^[0-9a-fA-F-]{36}$' THEN supply_id::text::uuid 
                    ELSE NULL 
                END
            );
    END IF;
END $$;

-- 2. Asegurar que reference_id pueda manejar tanto IDs numéricos como UUIDs si es necesario
-- Sin embargo, si production_logs y sales_orders usan BIGINT, reference_id debe ser BIGINT.
-- Si el error persiste al insertar v_log_id, es porque production_logs.id es UUID.
-- Vamos a convertir reference_id a TEXT temporalmente para máxima compatibilidad si hay mezcla de tipos.
ALTER TABLE public.inventory_transactions ALTER COLUMN reference_id TYPE TEXT USING reference_id::text;

-- 3. Restaurar FK de product_id
ALTER TABLE public.inventory_transactions 
    ADD CONSTRAINT inventory_transactions_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE RESTRICT;

-- 4. Actualizar la función de producción para ser resiliente a tipos de Log ID
CREATE OR REPLACE FUNCTION public.registrar_produccion_atomica(
    p_catalog_id UUID,
    p_units NUMERIC,
    p_recipe_name TEXT,
    p_total_cost NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_log_id TEXT; -- Usamos TEXT internamente para el ID del Log por si es UUID o BIGINT
    comp RECORD;
BEGIN
    -- A. Insertar Log de Producción
    INSERT INTO public.production_logs (
        recipe_name, cantidad_unidades, costo_total_tanda, fecha_produccion
    ) VALUES (
        p_recipe_name, p_units, p_total_cost, NOW()
    ) RETURNING id::text INTO v_log_id;

    -- B. Descontar Componentes
    FOR comp IN 
        SELECT * FROM public.catalog_composition WHERE catalog_id = p_catalog_id
    LOOP
        IF comp.supply_id IS NOT NULL THEN
            UPDATE public.supplies 
            SET stock_min_units = stock_min_units - (comp.quantity * p_units)
            WHERE id = comp.supply_id;

            INSERT INTO public.inventory_transactions (
                supply_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                comp.supply_id, 'CONSUMO', comp.quantity * p_units, v_log_id, 'Packaging/Directo producción'
            );
        ELSIF comp.recipe_id IS NOT NULL THEN
            PERFORM public.deducir_componentes_receta(comp.recipe_id, comp.quantity * p_units, v_log_id::text);
        END IF;
    END LOOP;

    -- C. Incrementar Stock PT
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
        'message', 'Producción registrada. Inventario actualizado.',
        'log_id', v_log_id
    );

EXCEPTION 
    WHEN check_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'STOCK_INSUFICIENTE', 'message', 'Stock insuficiente.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 5. Ajustar deducir_componentes_receta para aceptar p_log_id como TEXT
CREATE OR REPLACE FUNCTION public.deducir_componentes_receta(
    p_recipe_id UUID,
    p_quantity_batch NUMERIC,
    p_log_id TEXT
) RETURNS VOID AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN 
        SELECT * FROM public.recipe_items WHERE recipe_id = p_recipe_id
    LOOP
        IF item.supply_id IS NOT NULL THEN
            UPDATE public.supplies 
            SET stock_min_units = stock_min_units - (item.quantity * p_quantity_batch)
            WHERE id = item.supply_id;

            INSERT INTO public.inventory_transactions (
                supply_id, transaction_type, quantity, reference_id, reason
            ) VALUES (
                item.supply_id, 'CONSUMO', item.quantity * p_quantity_batch, p_log_id, 'Insumo usado en producción'
            );
        ELSIF item.sub_recipe_id IS NOT NULL THEN
            PERFORM public.deducir_componentes_receta(item.sub_recipe_id, item.quantity * p_quantity_batch, p_log_id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
