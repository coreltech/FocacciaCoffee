-- MIGRATION 55: Producción Intermedia y Precisión Quirúrgica V2
-- Habilita stock en recetas, sub-recetas y motor de producción con overrides.

-- 1. Evolución de Tablas Core V2
DO $$ 
BEGIN
    -- Añadir campos de stock a recetas
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'v2_recipes' AND COLUMN_NAME = 'stock') THEN
        ALTER TABLE public.v2_recipes ADD COLUMN stock NUMERIC(20,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'v2_recipes' AND COLUMN_NAME = 'min_stock') THEN
        ALTER TABLE public.v2_recipes ADD COLUMN min_stock NUMERIC(20,4) DEFAULT 0;
    END IF;

    -- Ajustar v2_recipe_items para soportar SUB-RECETAS
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'v2_recipe_items' AND COLUMN_NAME = 'sub_recipe_id') THEN
        ALTER TABLE public.v2_recipe_items ADD COLUMN sub_recipe_id UUID REFERENCES public.v2_recipes(id) ON DELETE RESTRICT;
    END IF;

    -- Hacer que supply_id sea opcional
    ALTER TABLE public.v2_recipe_items ALTER COLUMN supply_id DROP NOT NULL;

    -- Añadir campos de auditoría y rendimiento a logs de producción
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'v2_production_logs' AND COLUMN_NAME = 'expected_quantity') THEN
        ALTER TABLE public.v2_production_logs ADD COLUMN expected_quantity NUMERIC(20,4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'v2_production_logs' AND COLUMN_NAME = 'actual_quantity') THEN
        ALTER TABLE public.v2_production_logs RENAME COLUMN units_produced TO actual_quantity;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'v2_production_logs' AND COLUMN_NAME = 'overrides') THEN
        ALTER TABLE public.v2_production_logs ADD COLUMN overrides JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Función de Deducción Recursiva V2
-- Esta función descuenta del stock de la receta si hay, o "bucea" a los ingredientes si no hay.
CREATE OR REPLACE FUNCTION public.v2_fn_deducir_inventario_recursivo(
    p_recipe_id UUID,
    p_target_qty NUMERIC,
    p_log_id UUID
) RETURNS VOID AS $$
DECLARE
    item RECORD;
    v_available_stock NUMERIC;
    v_qty_from_stock NUMERIC;
    v_qty_to_recurse NUMERIC;
    v_base_weight NUMERIC;
    v_total_percent NUMERIC;
BEGIN
    -- 1. Consultar peso esperado y porcentaje total de la receta para aritmética panadera
    SELECT expected_weight INTO v_base_weight FROM public.v2_recipes WHERE id = p_recipe_id;
    SELECT SUM(percentage) INTO v_total_percent FROM public.v2_recipe_items WHERE recipe_id = p_recipe_id;
    
    IF v_base_weight IS NULL OR v_base_weight = 0 THEN v_base_weight := 1; END IF;
    IF v_total_percent IS NULL OR v_total_percent = 0 THEN v_total_percent := 100; END IF;

    -- 2. Ver si hay stock de la receta ya preparada
    SELECT COALESCE(stock, 0) INTO v_available_stock FROM public.v2_recipes WHERE id = p_recipe_id;

    IF v_available_stock >= p_target_qty THEN
        -- Caso Ideal: Hay stock suficiente ya preparado.
        UPDATE public.v2_recipes SET stock = stock - p_target_qty WHERE id = p_recipe_id;
        
        INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
        VALUES (p_log_id, 'RECIPE_ITEM', p_recipe_id, 'CONSUMO', p_target_qty, 'Consumo de preparación desde stock');
        
        RETURN;
    END IF;

    -- Caso Quirúrgico: No hay stock suficiente, usamos lo que hay y el resto lo "producimos" al vuelo (descontando ingredientes)
    v_qty_from_stock := v_available_stock;
    v_qty_to_recurse := p_target_qty - v_available_stock;

    IF v_qty_from_stock > 0 THEN
        UPDATE public.v2_recipes SET stock = 0 WHERE id = p_recipe_id;
        INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
        VALUES (p_log_id, 'RECIPE_ITEM', p_recipe_id, 'CONSUMO', v_qty_from_stock, 'Consumo parcial stock preparación');
    END IF;

    -- Bucear a los ingredientes por la cantidad faltante
    FOR item IN SELECT * FROM public.v2_recipe_items WHERE recipe_id = p_recipe_id LOOP
        DECLARE
            v_item_qty NUMERIC;
        BEGIN
            -- Calcular cantidad proporcional según fórmula panadera o fija
            IF item.percentage IS NOT NULL AND item.percentage > 0 THEN
                -- Fórmula Panadera: (Cant. a producir / Peso Base de Receta) * (Porcentaje del item / 100) * Peso Base
                -- Simplificado: v_qty_to_recurse * (item.percentage / v_total_percent)
                v_item_qty := v_qty_to_recurse * (item.percentage / v_total_percent);
            ELSE
                v_item_qty := item.quantity * (v_qty_to_recurse / v_base_weight);
            END IF;

            IF item.supply_id IS NOT NULL THEN
                UPDATE public.v2_supplies SET stock = stock - v_item_qty WHERE id = item.supply_id;
                INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
                VALUES (p_log_id, 'SUPPLY_ITEM', item.supply_id, 'CONSUMO', v_item_qty, 'Insumo base en producción recursiva');
            ELSIF item.sub_recipe_id IS NOT NULL THEN
                PERFORM public.v2_fn_deducir_inventario_recursivo(item.sub_recipe_id, v_item_qty, p_log_id);
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Función Maestra de Producción Quirúrgica V2
CREATE OR REPLACE FUNCTION public.v2_rpc_registrar_produccion_quirurgica(
    p_catalog_id UUID DEFAULT NULL,
    p_recipe_id UUID DEFAULT NULL,
    p_actual_qty NUMERIC DEFAULT 0,
    p_expected_qty NUMERIC DEFAULT 0,
    p_total_cost NUMERIC DEFAULT 0,
    p_overrides JSONB DEFAULT '[]'::jsonb
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

    -- C. Entrada de Stock al Destino
    IF p_catalog_id IS NOT NULL THEN
        UPDATE public.v2_catalog SET stock = stock + p_actual_qty WHERE id = p_catalog_id;
        INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
        VALUES (v_log_id, 'CATALOG_ITEM', p_catalog_id, 'PRODUCTION', p_actual_qty, 'Entrada PT: ' || v_name);
    ELSE
        UPDATE public.v2_recipes SET stock = stock + p_actual_qty WHERE id = p_recipe_id;
        INSERT INTO public.v2_inventory_transactions (reference_id, item_type, item_id, transaction_type, quantity, reason)
        VALUES (v_log_id, 'RECIPE_ITEM', p_recipe_id, 'PRODUCTION', p_actual_qty, 'Entrada Preparación: ' || v_name);
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

NOTIFY pgrst, 'reload schema';
