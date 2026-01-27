-- MIGRATION 44: Fix RPC Variable Types (Sale ID)
-- Description: Updates registrar_pedido_web_v3 to correct v_sale_id type from bigint to uuid.

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
    v_sale_id uuid; -- CHANGED: bigint -> uuid (Fixes mismatch with sales_orders.id)
    v_total_usd numeric(12,2) := 0;
    v_item jsonb;
    v_qty numeric;
    v_price numeric;
    v_subtotal numeric;
    v_product_id uuid; 
    v_current_stock numeric;
    v_new_stock numeric;
    
    -- Metadata extraction
    v_client_name text;
    v_client_phone text;
    v_client_email text;
    v_order_type text;
    v_address text;
    v_payment_method text;
    v_delivery_date date;

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
    
    -- Parse delivery date if present
    BEGIN
        v_delivery_date := (p_metadata->>'delivery_date')::date;
    EXCEPTION WHEN OTHERS THEN
        v_delivery_date := NULL;
    END;

    -- 2. Customer Strategy
    IF v_client_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE phone = v_client_phone LIMIT 1;
        
        IF v_customer_id IS NULL THEN
            INSERT INTO customers (name, phone, email)
            VALUES (v_client_name, v_client_phone, v_client_email)
            RETURNING id INTO v_customer_id;
        ELSE
            UPDATE customers 
            SET email = COALESCE(email, v_client_email),
                name = COALESCE(name, v_client_name)
            WHERE id = v_customer_id;
        END IF;
    ELSE
        SELECT id INTO v_customer_id FROM customers WHERE name = v_client_name LIMIT 1;
        IF v_customer_id IS NULL THEN
             INSERT INTO customers (name) VALUES (v_client_name) RETURNING id INTO v_customer_id;
        END IF;
    END IF;

    -- 3. Create Order Group
    v_order_group_id := gen_random_uuid();

    -- 4. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'id')::uuid; 
        v_qty := (v_item->>'qty')::numeric;
        v_price := (v_item->>'price')::numeric;
        v_subtotal := v_qty * v_price;
        v_total_usd := v_total_usd + v_subtotal;

        -- STOCK LOGIC:
        -- If v_delivery_date IS NULL (Immediate order) -> Check and Deduct Stock
        -- If v_delivery_date IS NOT NULL (Pre-order) -> SKIP Stock Check, DO NOT Deduct
        
        IF v_delivery_date IS NULL OR v_delivery_date = CURRENT_DATE THEN
            -- A. Verify Stock (Strict)
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
        END IF;

        -- C. Insert into Sales Orders
        INSERT INTO sales_orders (
            sale_date,
            delivery_date,
            customer_id,
            total_amount,
            amount_paid,
            payment_status,
            payment_details,
            product_id,
            product_name,
            notes
        ) VALUES (
            now(),
            v_delivery_date,
            v_customer_id,
            v_subtotal,
            0,
            'Pendiente',
            jsonb_build_object(
                'source', 'WEB',
                'order_group', v_order_group_id,
                'client_name', v_client_name,
                'order_type', v_order_type,
                'delivery_address', v_address,
                'payment_method', v_payment_method,
                'tasa_bcv', p_rate,
                'qty', v_qty,
                'is_preorder', (v_delivery_date IS NOT NULL AND v_delivery_date > CURRENT_DATE)
            ),
            v_product_id,
            CASE 
                WHEN v_delivery_date IS NOT NULL AND v_delivery_date > CURRENT_DATE THEN 'ENCARGO: ' || (v_item->>'name')
                ELSE 'WEB: ' || (v_item->>'name')
            END,
            CASE 
                WHEN v_order_type = 'delivery' THEN 'Delivery a: ' || v_address 
                ELSE 'Pickup' 
            END
        ) RETURNING id INTO v_sale_id;

        -- D. Log Inventory Transaction (Only if stock was actually touched)
        IF v_delivery_date IS NULL OR v_delivery_date = CURRENT_DATE THEN
            -- inventory_transactions.reference_id is TEXT (migrated in 20), so casting uuid to text is safe.
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
                v_sale_id::text, -- Cast UUID to Text for reference
                'Pedido Web: ' || v_order_group_id
            );
        END IF;

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
