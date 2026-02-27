-- MIGRATION: Update Production RPC to handle Order Fulfillment
-- v2.3 - 2026-02-27

CREATE OR REPLACE FUNCTION public.v2_rpc_registrar_produccion_quirurgica(
    p_catalog_id UUID DEFAULT NULL,
    p_recipe_id UUID DEFAULT NULL,
    p_actual_qty NUMERIC DEFAULT 0,
    p_expected_qty NUMERIC DEFAULT 0,
    p_total_cost NUMERIC DEFAULT 0,
    p_overrides JSONB DEFAULT '[]'::jsonb,
    p_order_ids UUID[] DEFAULT NULL,           -- Nuevo: IDs de órdenes a completar
    p_is_fulfilling_order BOOLEAN DEFAULT FALSE -- Nuevo: Si es TRUE, no suma stock al final
) RETURNS JSONB AS $$
DECLARE
    v_log_id UUID;
    v_item RECORD;
    v_name TEXT;
BEGIN
    -- A. Generar Log con Resumen
    IF p_catalog_id IS NOT NULL THEN
        SELECT name INTO v_name FROM public.v2_catalog WHERE id = p_catalog_id;
    ELSE
        SELECT name INTO v_name FROM public.v2_recipes WHERE id = p_recipe_id;
    END IF;

    INSERT INTO public.v2_production_logs (
        catalog_id, recipe_id, actual_quantity, expected_quantity, total_cost, overrides, production_date
    ) VALUES (
        p_catalog_id, p_recipe_id, p_actual_qty, p_expected_qty, p_total_cost, p_overrides, NOW()
    ) RETURNING id INTO v_log_id;

    -- B. Gestión de Descuentos (Manual Overrides o Automático)
    IF jsonb_array_length(p_overrides) > 0 THEN
        -- El usuario ajustó manualmente qué usó
        FOR v_item IN SELECT * FROM jsonb_to_recordset(p_overrides) AS x(id UUID, type TEXT, qty NUMERIC) LOOP
            IF v_item.type = 'SUPPLY' THEN
                UPDATE public.v2_supplies SET stock = stock - v_item.qty WHERE id = v_item.id;
                INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
                VALUES (v_log_id, 'SUPPLY_ITEM', v_item.id, 'CONSUMO', v_item.qty, 'Consumo manual ajustado');
            ELSIF v_item.type = 'RECIPE' THEN
                PERFORM public.v2_fn_deducir_inventario_recursivo(v_item.id, v_item.qty, v_log_id);
            END IF;
        END LOOP;
    ELSE
        -- Deducción Automática Clásica (BOM)
        IF p_catalog_id IS NOT NULL THEN
            FOR v_item IN SELECT * FROM public.v2_catalog_composition WHERE catalog_id = p_catalog_id LOOP
                IF v_item.supply_id IS NOT NULL THEN
                    UPDATE public.v2_supplies SET stock = stock - (v_item.quantity * p_actual_qty) WHERE id = v_item.supply_id;
                    INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
                    VALUES (v_log_id, 'SUPPLY_ITEM', v_item.supply_id, 'CONSUMO', v_item.quantity * p_actual_qty, 'Descuento automático catálogo');
                ELSIF v_item.recipe_id IS NOT NULL THEN
                    PERFORM public.v2_fn_deducir_inventario_recursivo(v_item.recipe_id, v_item.quantity * p_actual_qty, v_log_id);
                END IF;
            END LOOP;
        ELSE
            -- Si es una receta producida directamente (ej: Ajos Confitados)
            PERFORM public.v2_fn_deducir_inventario_recursivo(p_recipe_id, p_expected_qty, v_log_id);
        END IF;
    END IF;

    -- C. Entrada de Stock al Destino (SOLO SI NO ES FULFILLING ORDER)
    IF NOT p_is_fulfilling_order THEN
        IF p_catalog_id IS NOT NULL THEN
            UPDATE public.v2_catalog SET stock = stock + p_actual_qty WHERE id = p_catalog_id;
            INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
            VALUES (v_log_id, 'CATALOG_ITEM', p_catalog_id, 'PRODUCTION', p_actual_qty, 'Entrada PT: ' || v_name);
        ELSE
            UPDATE public.v2_recipes SET stock = stock + p_actual_qty WHERE id = p_recipe_id;
            INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
            VALUES (v_log_id, 'RECIPE_ITEM', p_recipe_id, 'PRODUCTION', p_actual_qty, 'Entrada Preparación: ' || v_name);
        END IF;
    ELSE
        -- Si es fulfilling, registramos la transacción pero sin sumar stock real al catálogo
        INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
        VALUES (v_log_id, 'CATALOG_ITEM', p_catalog_id, 'PRODUCTION_FULFILLMENT', p_actual_qty, 'Ejecución de Pedido: ' || v_name || ' (No suma stock)');
    END IF;

    -- D. Actualizar Estado de Órdenes si aplica
    IF p_order_ids IS NOT NULL THEN
        UPDATE public.v2_orders SET status = 'Completada' WHERE id = ANY(p_order_ids);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Producción registrada con éxito.',
        'log_id', v_log_id,
        'actual_yield', p_actual_qty
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
