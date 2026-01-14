-- NUCLEAR SCHEMA REPAIR V4.1: Type Verification & Cleanup

-- 1. DROP BLOQUEADORES (Vistas) - Vuelvo a asegurar que no haya nada estorbando
DROP VIEW IF EXISTS public.v_daily_cash_closure CASCADE;
DROP VIEW IF EXISTS public.v_product_sales_summary CASCADE;
DROP VIEW IF EXISTS public.v_catalog_costs CASCADE;
DROP VIEW IF EXISTS public.v_production_costs CASCADE;
DROP VIEW IF EXISTS public.v_recipe_items_detailed CASCADE;

-- 2. LIMPIAR FUNCIONES (Asegurar que no quede NINGUNA versión vieja)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as name FROM pg_proc WHERE proname = 'registrar_venta_atomica') 
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.name;
    END LOOP;
END $$;

-- DEFINITIVE FIX: RPC Internal Type Matching (UUID)
-- Resolves "invalid input syntax for type bigint" during RETURNING id.

CREATE OR REPLACE FUNCTION public.registrar_venta_atomica(
    p_product_id uuid, 
    p_quantity numeric,
    p_total_amount numeric,
    p_amount_paid numeric,
    p_payment_status text,
    p_payment_details jsonb,
    p_customer_id uuid,
    p_product_name text
) RETURNS jsonb 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id uuid; -- FIXED: Changed from bigint to uuid
BEGIN
    INSERT INTO sales_orders (
        product_id, product_name, quantity, total_amount, 
        amount_paid, balance_due, payment_status, payment_details, 
        customer_id, sale_date
    )
    VALUES (
        p_product_id, p_product_name, p_quantity, p_total_amount, 
        p_amount_paid, (p_total_amount - p_amount_paid), p_payment_status, p_payment_details, 
        p_customer_id, now()
    )
    RETURNING id INTO v_sale_id;

    INSERT INTO inventory_transactions (
        product_id, transaction_type, quantity, reference_id, reason
    )
    VALUES (
        p_product_id, 'VENTA', p_quantity, v_sale_id::text, 'Venta Web: ' || p_product_name
    );

    RETURN jsonb_build_object('success', true, 'message', 'OK', 'sale_id', v_sale_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.registrar_venta_atomica TO anon, authenticated;

-- 4. VERIFICACIÓN FINAL EXTENDIDA
-- Copia el resultado de esto para confirmar que todo es UUID
SELECT 'TABLA' as tipo, table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sales_orders', 'inventory_transactions', 'sales_prices') 
AND column_name IN ('product_id', 'customer_id', 'id')
UNION ALL
SELECT 'FUNCION' as tipo, proname, 'parámetros', pg_get_function_arguments(oid)
FROM pg_proc 
WHERE proname = 'registrar_venta_atomica';

NOTIFY pgrst, 'reload schema';
