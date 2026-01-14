-- MIGRATION: Enable Purchase Editing (User Logic)
-- Implements the specific trigger requested by the user to handle INSERT and UPDATE
-- ensuring stock is adjusted by the difference in quantity.

-- 1. Create the Function
CREATE OR REPLACE FUNCTION update_supply_on_purchase_change()
RETURNS TRIGGER AS $$
DECLARE
    v_diff_quantity NUMERIC(12,4);
BEGIN
    -- Si es una EDICIÓN (UPDATE)
    IF (TG_OP = 'UPDATE') THEN
        v_diff_quantity := NEW.quantity - OLD.quantity; -- Calculamos la diferencia
    -- Si es una COMPRA NUEVA (INSERT)
    ELSIF (TG_OP = 'INSERT') THEN
        v_diff_quantity := NEW.quantity;
    END IF;

    -- Actualizamos el supply con la diferencia
    -- Usamos COALESCE para evitar errores con nulos si alguna columna no tuviera valor inicial
    UPDATE public.supplies
    SET 
        stock_min_units = COALESCE(stock_min_units, 0) + v_diff_quantity,
        current_stock = COALESCE(current_stock, 0) + v_diff_quantity,
        last_purchase_price = NEW.unit_price_usd,
        unit_cost = NEW.unit_price_usd, -- User preference: overwrite with new cost
        updated_at = NOW()
    WHERE id = NEW.supply_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop Conflict Triggers (Safe cleanup)
DROP TRIGGER IF EXISTS tr_update_stock_on_purchase ON public.purchase_items;
DROP TRIGGER IF EXISTS trigger_update_supply_on_purchase ON public.purchase_items;

-- 3. Apply the Trigger
CREATE TRIGGER trigger_update_supply_on_purchase
    AFTER INSERT OR UPDATE ON public.purchase_items
    FOR EACH ROW
    EXECUTE FUNCTION update_supply_on_purchase_change();

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
