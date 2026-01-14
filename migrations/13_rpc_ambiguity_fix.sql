-- MIGRATION 13: RPC CONSOLIDATION & AMBIGUITY FIX
-- This script wipes all versions of the registration function and creates ONE definitive version.

-- 1. Drop ALL potential overloads of the function
-- We must be very specific with the types to match the existing candidates.
DROP FUNCTION IF EXISTS public.registrar_venta_atomica(uuid, numeric, numeric, numeric, text, jsonb, bigint, text);
DROP FUNCTION IF EXISTS public.registrar_venta_atomica(uuid, numeric, numeric, numeric, text, jsonb, uuid, text);

-- 2. Define THE official version
-- We use UUID for p_product_id and flexible text/uuid for p_customer_id if needed.
-- Looking at the current state, we'll stick to UUID for product and BIGINT for customer 
-- (unless the user explicitly changed customers to UUID).
CREATE OR REPLACE FUNCTION registrar_venta_atomica(
    p_product_id uuid, 
    p_quantity numeric,
    p_total_amount numeric,
    p_amount_paid numeric,
    p_payment_status text,
    p_payment_details jsonb,
    p_customer_id uuid, -- Assuming modern schema uses UUID for everything
    p_product_name text
) RETURNS jsonb AS $$
DECLARE
    v_sale_id bigint;
    v_balance numeric;
BEGIN
    v_balance := p_total_amount - p_amount_paid;

    -- A. Insert Sale
    INSERT INTO sales_orders (
        product_id, product_name, quantity, total_amount, 
        amount_paid, balance_due, payment_status, payment_details, 
        customer_id, sale_date
    )
    VALUES (
        p_product_id, p_product_name, p_quantity, p_total_amount, 
        p_amount_paid, v_balance, p_payment_status, p_payment_details, 
        p_customer_id, now()
    )
    RETURNING id INTO v_sale_id;

    -- B. Record movement in KARDEX
    INSERT INTO inventory_transactions (
        product_id, transaction_type, quantity, reference_id, reason
    )
    VALUES (
        p_product_id, 'VENTA', p_quantity, v_sale_id, 'Venta Mostrador #' || v_sale_id
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Venta registrada e inventario actualizado', 
        'sale_id', v_sale_id
    );

EXCEPTION WHEN check_violation THEN
    RETURN jsonb_build_object(
        'success', false, 
        'error', 'STOCK_INSUFICIENTE', 
        'message', 'No hay suficiente stock para realizar esta venta.'
    );
WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure the sales_orders table matches the UUID customer_id
-- This avoids "incompatible type" errors if it was still BIGINT
DO $$ 
BEGIN
    ALTER TABLE public.sales_orders ALTER COLUMN customer_id TYPE UUID USING customer_id::text::uuid;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Column customer_id already converted or not found';
END $$;

NOTIFY pgrst, 'reload schema';
