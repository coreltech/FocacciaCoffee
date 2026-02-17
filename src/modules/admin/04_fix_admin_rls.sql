
-- Enable RLS and create policies for Assets and Expenses
-- Created to fix "new row violates row-level security policy" errors

-- 1. Assets Inventory
ALTER TABLE assets_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for anon users" ON assets_inventory
FOR ALL USING (true) WITH CHECK (true);

-- 2. Operational Expenses
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for anon users" ON operational_expenses
FOR ALL USING (true) WITH CHECK (true);

-- 3. Purchases (Just in case, though likely handled)
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all access for anon users" ON purchases FOR ALL USING (true) WITH CHECK (true);
