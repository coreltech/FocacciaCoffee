-- MIGRATION: Fix Purchases Module Schema & Cleanup Triggers
-- Aggressively cleans up legacy triggers and implements correct stock/cost update logic.

-- 1. CLEANUP: Drop ALL existing triggers on affected tables to remove legacy conflicts
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

    -- Drop triggers on supplies (except if we want to keep some, but better to be safe and re-add standard ones)
    -- We will re-add the updated_at trigger below
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

-- 2. Add missing columns to supplies
ALTER TABLE public.supplies
ADD COLUMN IF NOT EXISTS current_stock NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Unidad',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Migrate data from legacy column if exists
-- Assuming 'stock_min_units' was being used as current stock in Inventory module
UPDATE public.supplies 
SET current_stock = stock_min_units 
WHERE current_stock = 0 AND stock_min_units > 0;

-- 4. Restore 'updated_at' trigger for supplies
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

-- 5. Trigger function to handle stock and cost updates on purchase
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
    -- Explicitly using updated_at, NOT last_updated
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

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
