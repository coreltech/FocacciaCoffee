-- MIGRATION 38: Add Customer Contact Info
-- Description: Add phone and email to customers table for better identification

DO $$
BEGIN
    -- 1. Add Phone Column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone') THEN
        ALTER TABLE customers ADD COLUMN phone text;
    END IF;

    -- 2. Add Email Column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
        ALTER TABLE customers ADD COLUMN email text;
    END IF;

    -- 3. Create Index on Phone for fast lookup (Unique is tricky if data exists, so just index for now)
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

END $$;
