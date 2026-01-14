-- MIGRATION: Fix Trigger to Handle DELETE
-- The application replaces items (Delete + Insert) during updates.
-- The previous trigger only handled INSERT and UPDATE, so Deletions were not reverting stock,
-- causing duplication when the new items were Inserted.
-- This update adds DELETE handling to the trigger for full inventory lifecycle management.

CREATE OR REPLACE FUNCTION update_supply_on_purchase_change()
RETURNS TRIGGER AS $$
DECLARE
    v_diff_quantity NUMERIC(12,4);
    v_supply_id UUID;
    v_unit_price NUMERIC(12,2);
BEGIN
    -- 1. Determine Operation Type and Variables
    IF (TG_OP = 'UPDATE') THEN
        v_diff_quantity := NEW.quantity - OLD.quantity;
        v_supply_id := NEW.supply_id;
        v_unit_price := NEW.unit_price_usd;
    ELSIF (TG_OP = 'INSERT') THEN
        v_diff_quantity := NEW.quantity;
        v_supply_id := NEW.supply_id;
        v_unit_price := NEW.unit_price_usd;
    ELSIF (TG_OP = 'DELETE') THEN
        v_diff_quantity := -OLD.quantity; -- Subtract quantity
        v_supply_id := OLD.supply_id;
        v_unit_price := OLD.unit_price_usd;
    END IF;

    -- 2. Update Supply Stock
    -- We use COALESCE to handle potential NULLs safely
    UPDATE public.supplies
    SET 
        stock_min_units = COALESCE(stock_min_units, 0) + v_diff_quantity,
        current_stock = COALESCE(current_stock, 0) + v_diff_quantity,
        -- Only update price/cost on INSERT or UPDATE, not DELETE
        last_purchase_price = CASE WHEN TG_OP = 'DELETE' THEN last_purchase_price ELSE v_unit_price END,
        unit_cost = CASE WHEN TG_OP = 'DELETE' THEN unit_cost ELSE v_unit_price END, 
        updated_at = NOW()
    WHERE id = v_supply_id;

    -- Return appropriate record based on operation
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the Trigger Definition to include DELETE
DROP TRIGGER IF EXISTS trigger_update_supply_on_purchase ON public.purchase_items;

CREATE TRIGGER trigger_update_supply_on_purchase
    AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
    FOR EACH ROW
    EXECUTE FUNCTION update_supply_on_purchase_change();

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
