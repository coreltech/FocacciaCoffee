-- MIGRATION 12: Sales & Kardex UUID Alignment
-- Ensures that the Sales module can correctly reference UUID-based catalog and transactions.

-- 1. Update inventory_transactions to use UUID for product_id
-- We must drop the FK first if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'inventory_transactions_product_id_fkey') THEN
        ALTER TABLE public.inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
    END IF;
END $$;

ALTER TABLE public.inventory_transactions ALTER COLUMN product_id TYPE UUID USING product_id::text::uuid;
ALTER TABLE public.inventory_transactions ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE RESTRICT;

-- 2. Update sales_orders to use UUID for product_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sales_orders_product_id_fkey') THEN
        ALTER TABLE public.sales_orders DROP CONSTRAINT sales_orders_product_id_fkey;
    END IF;
END $$;

ALTER TABLE public.sales_orders ALTER COLUMN product_id TYPE UUID USING product_id::text::uuid;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE SET NULL;

-- 3. Redefine registrar_venta_atomica for UUID
CREATE OR REPLACE FUNCTION registrar_venta_atomica(
    p_product_id uuid, -- Changed from bigint
    p_quantity numeric,
    p_total_amount numeric,
    p_amount_paid numeric,
    p_payment_status text,
    p_payment_details jsonb,
    p_customer_id bigint,
    p_product_name text
) RETURNS jsonb AS $$
DECLARE
    v_sale_id bigint; -- sales_orders.id remains bigint usually, unless user changed it
    v_balance numeric;
BEGIN
    v_balance := p_total_amount - p_amount_paid;

    -- 1. Insertar Venta
    INSERT INTO sales_orders (
        product_id, 
        product_name, 
        quantity, 
        total_amount, 
        amount_paid, 
        balance_due, 
        payment_status, 
        payment_details, 
        customer_id, 
        sale_date
    )
    VALUES (
        p_product_id, 
        p_product_name, 
        p_quantity, 
        p_total_amount, 
        p_amount_paid, 
        v_balance, 
        p_payment_status, 
        p_payment_details, 
        p_customer_id, 
        now()
    )
    RETURNING id INTO v_sale_id;

    -- 2. Insertar movimiento en KARDEX
    INSERT INTO inventory_transactions (
        product_id, 
        transaction_type, 
        quantity, 
        reference_id, 
        reason
    )
    VALUES (
        p_product_id, 
        'VENTA', 
        p_quantity, 
        v_sale_id, 
        'Venta Mostrador #' || v_sale_id
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Venta registrada y stock descontado', 
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

-- 4. Reload PostgREST
NOTIFY pgrst, 'reload schema';
