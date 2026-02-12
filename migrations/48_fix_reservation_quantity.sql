-- MIGRATION 48: Fix Missing Quantity in Reservations
-- Description: Restores the 'quantity' column in the INSERT statement of registrar_venta_atomica
-- which was accidentally removed in Migration 46.

CREATE OR REPLACE FUNCTION registrar_venta_atomica(
    p_product_id uuid,
    p_quantity numeric,
    p_total_amount numeric,
    p_amount_paid numeric,
    p_payment_status text,
    p_payment_details jsonb,
    p_customer_id uuid,
    p_product_name text,
    p_delivery_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id uuid;
    v_current_stock numeric;
    v_new_stock numeric;
    v_order_group_id uuid;
    v_product_final_name text;
    v_is_preorder boolean;
BEGIN
    -- 1. Determine if this is a Pre-order (Reservation)
    v_is_preorder := (p_delivery_date IS NOT NULL AND p_delivery_date > CURRENT_DATE);
    v_order_group_id := gen_random_uuid(); -- Generate a group ID for consistency with web orders

    -- 2. Validate Product & Stock Logic
    -- Only check/deduct stock if it is NOT a future reservation (Immediate delivery)
    IF NOT v_is_preorder THEN
        -- Locking for update to prevent race conditions
        SELECT stock_disponible INTO v_current_stock 
        FROM sales_prices WHERE id = p_product_id FOR UPDATE;

        IF v_current_stock IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND', 'message', 'Producto no encontrado');
        END IF;

        IF v_current_stock < p_quantity THEN
            RETURN jsonb_build_object('success', false, 'error', 'STOCK_INSUFICIENTE', 'message', 'Stock insuficiente');
        END IF;

        -- Deduct Stock
        v_new_stock := v_current_stock - p_quantity;
        UPDATE sales_prices SET stock_disponible = v_new_stock WHERE id = p_product_id;
    END IF;

    -- 3. Determine Final Product Name (Add 'RESERVA:' prefix if applicable)
    IF v_is_preorder THEN
        v_product_final_name := 'RESERVA: ' || p_product_name;
    ELSE
        v_product_final_name := p_product_name;
    END IF;

    -- 4. Insert Sale Record (FIX: Added quantity)
    INSERT INTO sales_orders (
        sale_date,
        delivery_date,
        customer_id,
        total_amount,
        amount_paid,
        balance_due,
        payment_status,
        payment_details,
        product_id,
        product_name,
        quantity, -- <--- RESTORED COLUMN
        notes
    ) VALUES (
        now(),
        p_delivery_date,
        p_customer_id,
        p_total_amount,
        p_amount_paid,
        (p_total_amount - p_amount_paid), -- Calculate balance due automatically
        p_payment_status,
        p_payment_details || jsonb_build_object('order_group', v_order_group_id, 'is_preorder', v_is_preorder), -- Merge extra metadata
        p_product_id,
        v_product_final_name,
        p_quantity, -- <--- RESTORED VALUE
        CASE WHEN v_is_preorder THEN 'Reserva para: ' || to_char(p_delivery_date, 'DD/MM/YYYY') ELSE NULL END
    ) RETURNING id INTO v_sale_id;

    -- 5. Log Inventory Transaction (Only if stock was actually touched)
    IF NOT v_is_preorder THEN
        INSERT INTO inventory_transactions (
            product_id,
            transaction_type,
            quantity,
            old_stock,
            new_stock,
            reference_id,
            reason
        ) VALUES (
            p_product_id,
            'VENTA MOSTRADOR',
            p_quantity,
            v_current_stock,
            v_new_stock,
            v_sale_id::text,
            'Venta directa'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
