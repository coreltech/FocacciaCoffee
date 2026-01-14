-- MIGRATION: Final Purchase Fix (Nuclear Option)
-- 1. Ensure columns exist on ALL relevant tables
-- 2. Drop legacy triggers cleanly
-- 3. Re-apply correct logic

-- 1. Ensure updated_at exists on supplies (and other columns)
ALTER TABLE public.supplies
ADD COLUMN IF NOT EXISTS current_stock NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Unidad',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Ensure updated_at exists on purchase_items (Just in case)
ALTER TABLE public.purchase_items
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Ensure updated_at exists on purchases (Just in case)
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- 4. CLEANUP: Drop ALL existing triggers on affected tables
DO $$
DECLARE
    t_name text;
BEGIN
    -- Drop triggers on purchase_items
    FOR t_name IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'purchase_items'
        AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t_name) || ' ON purchase_items CASCADE';
    END LOOP;

    -- Drop triggers on supplies
    FOR t_name IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'supplies'
        AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t_name) || ' ON supplies CASCADE';
    END LOOP;
END;
$$;


-- 5. Restore 'updated_at' trigger for supplies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supplies_updated_at
    BEFORE UPDATE ON supplies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 6. Trigger function to handle stock and cost updates on purchase
CREATE OR REPLACE FUNCTION fn_handle_purchase_item_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock numeric;
    v_current_cost numeric;
    v_new_stock numeric;
    v_new_cost numeric;
BEGIN
    -- Get current values
    SELECT current_stock, unit_cost
    INTO v_current_stock, v_current_cost
    FROM supplies
    WHERE id = NEW.supply_id;

    -- Handle nulls
    v_current_stock := COALESCE(v_current_stock, 0);
    v_current_cost := COALESCE(v_current_cost, 0);

    -- Calculate new stock
    v_new_stock := v_current_stock + NEW.quantity;

    -- Calculate weighted average cost (only if we have stock)
    IF v_new_stock > 0 THEN
        v_new_cost := ((v_current_stock * v_current_cost) + (NEW.quantity * NEW.unit_price_usd)) / v_new_stock;
    ELSE
        v_new_cost := NEW.unit_price_usd;
    END IF;

    -- Update supplies table
    UPDATE supplies
    SET
        current_stock = v_new_stock,
        unit_cost = v_new_cost,
        last_purchase_price = NEW.unit_price_usd,
        updated_at = now()
    WHERE id = NEW.supply_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_stock_on_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION fn_handle_purchase_item_insert();

-- 7. Reload schema
NOTIFY pgrst, 'reload schema';
