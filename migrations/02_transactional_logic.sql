-- MIGRATION 02: Lógica Transaccional (Triggers & RPC)
-- Ejecutar DESPUÉS de 01_core_structure.sql

-- 1. Trigger para Actualización Automática de Stock
-- Este trigger "escucha" inserciones en inventory_transactions y actualiza sales_prices.
-- Si la actualización viola el CHECK (stock < 0), la transacción falla y hace rollback automático.

CREATE OR REPLACE FUNCTION update_stock_from_kardex() RETURNS TRIGGER AS $$
DECLARE
    v_current_stock numeric;
BEGIN
    -- Obtenemos stock actual para guardarlo en el histórico (snapshot)
    SELECT stock_disponible INTO v_current_stock FROM sales_prices WHERE id = NEW.product_id;
    
    -- Actualizamos la tabla maestra de precios/stock
    IF NEW.transaction_type IN ('VENTA', 'MERMA', 'AJUSTE_NEGATIVO') THEN
        UPDATE sales_prices 
        SET stock_disponible = stock_disponible - NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF NEW.transaction_type IN ('PRODUCCION', 'AJUSTE_POSITIVO', 'DEVOLUCION') THEN
        UPDATE sales_prices 
        SET stock_disponible = stock_disponible + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock ON inventory_transactions;
CREATE TRIGGER tr_update_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_stock_from_kardex();


-- 2. Función RPC para Venta Atómica (Backend For Frontend)
-- Esta función recibe todo el objeto de venta y realiza todo en UNA sola transacción.

CREATE OR REPLACE FUNCTION registrar_venta_atomica(
    p_product_id bigint,
    p_quantity numeric,
    p_total_amount numeric,
    p_amount_paid numeric,
    p_payment_status text,
    p_payment_details jsonb,
    p_customer_id bigint,
    p_product_name text -- Backup texto por si se borra el catálogo
) RETURNS jsonb AS $$
DECLARE
    v_sale_id bigint;
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
    -- Esto disparará el Trigger tr_update_stock.
    -- Si el stock baja de 0, el constraint 'check_stock_no_negativo' saltará y
    -- toda la función hará ROLLBACK, cancelando la venta.
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
    -- Capturamos el error específico de violación de constraint (stock negativo)
    RETURN jsonb_build_object(
        'success', false, 
        'error', 'STOCK_INSUFICIENTE', 
        'message', 'No hay suficiente stock para realizar esta venta.'
    );
WHEN OTHERS THEN
    -- Cualquier otro error
    RETURN jsonb_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
