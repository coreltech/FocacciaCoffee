-- MIGRATION 33: Atomic Checkout System (Fulfillment Excellence)
-- Implements multi-item order registration to ensure "All-or-Nothing" data integrity.

CREATE OR REPLACE FUNCTION public.registrar_pedido_web_v3(
    p_items jsonb,
    p_metadata jsonb,
    p_rate numeric
) RETURNS jsonb 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item jsonb;
    v_sale_id uuid;
    v_order_group_id text;
    v_total_usd numeric := 0;
BEGIN
    -- 1. Input Validation
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_INPUT', 'message', 'El carrito está vacío');
    END IF;

    IF p_rate <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_INPUT', 'message', 'Tasa de cambio inválida');
    END IF;

    -- 2. Generate a unique group ID for this batch
    -- Use gen_random_uuid() as a reliable way to get random hex without requiring pgcrypto
    v_order_group_id := 'WEB-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12));

    -- 3. Loop through items to validate quantities and calculate total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (v_item->>'qty')::numeric <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'INVALID_INPUT', 'message', 'La cantidad debe ser mayor a cero');
        END IF;
        v_total_usd := v_total_usd + ((v_item->>'qty')::numeric * (v_item->>'price')::numeric);
    END LOOP;

    -- 4. Process each item (Atomic Transaction)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
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
            (v_item->>'id')::uuid,
            'WEB: ' || (v_item->>'name'), -- CRITICAL: 'WEB: ' prefix for ERP visibility
            (v_item->>'qty')::numeric,
            ((v_item->>'qty')::numeric * (v_item->>'price')::numeric),
            ((v_item->>'qty')::numeric * (v_item->>'price')::numeric),
            0,
            'Pagado',
            jsonb_build_object(
                'group_id', v_order_group_id,
                'customer_web', p_metadata->>'client', -- ERP history uses this
                'order_type', p_metadata->>'order_type',
                'delivery_address', p_metadata->>'address', -- ERP view uses this
                'suggested_payment', p_metadata->>'payment',
                'tasa_bcv', p_rate,
                'items', jsonb_build_array( -- ERP summary requires this array for totals
                    jsonb_build_object(
                        'method', p_metadata->>'payment',
                        'amount_usd', ((v_item->>'qty')::numeric * (v_item->>'price')::numeric),
                        'amount_native', ((v_item->>'qty')::numeric * (v_item->>'price')::numeric * p_rate),
                        'currency', CASE WHEN (p_metadata->>'payment') ILIKE '%Bs%' THEN 'VES' ELSE 'USD' END
                    )
                )
            ),
            NULL,
            now()
        )
        RETURNING id INTO v_sale_id;

        INSERT INTO inventory_transactions (
            product_id, 
            transaction_type, 
            quantity, 
            reference_id, 
            reason
        )
        VALUES (
            (v_item->>'id')::uuid,
            'VENTA',
            (v_item->>'qty')::numeric,
            v_sale_id::text,
            'Pedido Web: ' || v_order_group_id
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Pedido registrado correctamente',
        'order_group', v_order_group_id,
        'total_usd', v_total_usd
    );

EXCEPTION 
    WHEN check_violation THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'STOCK_INSUFICIENTE',
            'message', 'No hay suficiente stock para uno o más productos.'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM,
            'message', 'Error interno al procesar el pedido.'
        );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.registrar_pedido_web_v3 TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
