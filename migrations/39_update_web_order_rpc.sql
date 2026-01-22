-- MIGRATION 39: Update Web Order RPC for Enhanced Client Mgmt
-- Description: Update registrar_pedido_web_v3 to use phone/email for customer lookup/creation

CREATE OR REPLACE FUNCTION registrar_pedido_web_v3(
    p_items jsonb,
    p_metadata jsonb,
    p_rate numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id bigint;
    v_order_group_id uuid;
    v_sale_id bigint;
    v_total_usd numeric(12,2) := 0;
    v_item jsonb;
    v_qty numeric;
    v_price numeric;
    v_subtotal numeric;
    v_product_id bigint;
    v_current_stock numeric;
    v_new_stock numeric;
    v_recipe_id bigint;
    
    -- Metadata extraction
    v_client_name text;
    v_client_phone text;
    v_client_email text;
    v_order_type text;
    v_address text;
    v_payment_method text;

    -- Output
    v_result jsonb;
BEGIN
    -- 1. Extract Metadata
    v_client_name := COALESCE(p_metadata->>'client', 'Cliente Web');
    v_client_phone := NULLIF(TRIM(p_metadata->>'phone'), '');
    v_client_email := NULLIF(TRIM(p_metadata->>'email'), '');
    v_order_type := COALESCE(p_metadata->>'order_type', 'pickup');
    v_address := p_metadata->>'address';
    v_payment_method := COALESCE(p_metadata->>'payment', 'Efectivo $');

    -- 2. Customer Strategy (Robust)
    --    a) If phone provided, try to find customer
    --    b) If found -> use ID
    --    c) If not found -> Create new customer with Name, Phone, Email
    --    d) If no phone -> Fallback to Generic "Cliente Web" or simple name match (weak)

    IF v_client_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE phone = v_client_phone LIMIT 1;
        
        IF v_customer_id IS NULL THEN
            INSERT INTO customers (name, phone, email)
            VALUES (v_client_name, v_client_phone, v_client_email)
            RETURNING id INTO v_customer_id;
        ELSE
            -- Optional: Update email/name if missing
            UPDATE customers 
            SET email = COALESCE(email, v_client_email),
                name = COALESCE(name, v_client_name) -- Update name? Maybe risky if it overrides legal name. valid for now.
            WHERE id = v_customer_id;
        END IF;
    ELSE
        -- Fallback for legacy/no-phone orders: Try finding by Name or create Generic
        SELECT id INTO v_customer_id FROM customers WHERE name = v_client_name LIMIT 1;
        IF v_customer_id IS NULL THEN
             INSERT INTO customers (name) VALUES (v_client_name) RETURNING id INTO v_customer_id;
        END IF;
    END IF;

    -- 3. Create Order Group (UUID)
    v_order_group_id := gen_random_uuid();

    -- 4. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'id')::bigint;
        v_qty := (v_item->>'qty')::numeric;
        v_price := (v_item->>'price')::numeric;
        v_subtotal := v_qty * v_price;
        v_total_usd := v_total_usd + v_subtotal;

        -- A. Verify Stock
        SELECT stock_disponible INTO v_current_stock 
        FROM sales_prices WHERE id = v_product_id FOR UPDATE;

        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Producto no encontrado: %', v_product_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'STOCK_INSUFICIENTE', 
                'message', 'No hay suficiente stock para ' || (v_item->>'name')
            );
        END IF;

        -- B. Update Stock
        v_new_stock := v_current_stock - v_qty;
        UPDATE sales_prices SET stock_disponible = v_new_stock WHERE id = v_product_id;

        -- C. Insert into Sales Orders (Individual Items for now, grouped by ID)
        INSERT INTO sales_orders (
            sale_date,
            customer_id,
            total_amount,
            amount_paid, -- Paid 0 technically until confirmed, but we mark as paid/pending based on method? 
                         -- Web orders usually imply intent to pay. Let's mark PENDING unless logic changes.
            payment_status,
            payment_details,
            product_id,
            product_name, -- Snapshot name
            notes
        ) VALUES (
            now(),
            v_customer_id,
            v_subtotal, -- Item Subtotal
            0, -- Amount Paid (Verification needed)
            'Pendiente',
            jsonb_build_object(
                'source', 'WEB',
                'order_group', v_order_group_id,
                'client_name', v_client_name, -- redundancy useful
                'order_type', v_order_type,
                'delivery_address', v_address,
                'payment_method', v_payment_method,
                'tasa_bcv', p_rate,
                'qty', v_qty
            ),
            v_product_id,
            'WEB: ' || (v_item->>'name'), -- Prefix for easy identification
            CASE WHEN v_order_type = 'delivery' THEN 'Delivery a: ' || v_address ELSE 'Pickup' END
        ) RETURNING id INTO v_sale_id;

        -- D. Log Inventory Transaction (Kardex)
        INSERT INTO inventory_transactions (
            product_id,
            transaction_type,
            quantity,
            old_stock,
            new_stock,
            reference_id,
            reason
        ) VALUES (
            v_product_id,
            'VENTA WEB',
            v_qty,
            v_current_stock,
            v_new_stock,
            v_sale_id,
            'Pedido Web: ' || v_order_group_id
        );

    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_group', v_order_group_id,
        'customer_id', v_customer_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
