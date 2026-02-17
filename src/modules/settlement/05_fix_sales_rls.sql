
-- Enable RLS and create policies for Sales and Customers
-- Ensures that the Settlement module can read sales and customer names

-- 1. Sales Orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for anon users" ON sales_orders;
CREATE POLICY "Enable all access for anon users" ON sales_orders
FOR ALL USING (true) WITH CHECK (true);

-- 2. Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for anon users" ON customers;
CREATE POLICY "Enable all access for anon users" ON customers
FOR ALL USING (true) WITH CHECK (true);

-- 3. Capital Contributions (Just to be sure)
ALTER TABLE capital_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for anon users" ON capital_contributions;
CREATE POLICY "Enable all access for anon users" ON capital_contributions
FOR ALL USING (true) WITH CHECK (true);
