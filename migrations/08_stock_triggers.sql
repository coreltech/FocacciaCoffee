-- MIGRATION 08: Stock Synchronization Triggers
-- Automatically syncs catalog stock based on inventory transactions (Production, Sales, Waste).

-- 1. Master Sync Function
CREATE OR REPLACE FUNCTION sync_stock_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a sale or waste (decreases inventory)
    IF NEW.transaction_type IN ('VENTA', 'MERMA') THEN
        UPDATE sales_prices 
        SET stock_disponible = stock_disponible - NEW.quantity
        WHERE id = NEW.product_id;
    
    -- If it's a production or adjustment (increases inventory)
    ELSIF NEW.transaction_type IN ('PRODUCCION', 'AJUSTE') THEN
        UPDATE sales_prices 
        SET stock_disponible = stock_disponible + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. The Trigger
DROP TRIGGER IF EXISTS tr_sync_stock ON inventory_transactions;
CREATE TRIGGER tr_sync_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION sync_stock_after_transaction();
