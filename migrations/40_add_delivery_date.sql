-- MIGRATION 40: Add Delivery Date to Sales Orders
-- Description: Adds a delivery_date column to track execution/delivery day for pre-orders.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'delivery_date') THEN
        ALTER TABLE sales_orders ADD COLUMN delivery_date DATE;
    END IF;
END $$;
