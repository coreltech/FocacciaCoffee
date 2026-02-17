
-- 1. Create Settlements Table
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    total_income NUMERIC(15,2) DEFAULT 0,
    total_outcome NUMERIC(15,2) DEFAULT 0,
    net_utility NUMERIC(15,2) DEFAULT 0,
    
    fund_amount NUMERIC(15,2) DEFAULT 0,
    partner_a_amount NUMERIC(15,2) DEFAULT 0,
    partner_b_amount NUMERIC(15,2) DEFAULT 0,
    
    notes TEXT
);

-- 2. Add settlement_id to Sales
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES settlements(id);

-- 3. Add settlement_id to Purchases
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES settlements(id);

-- 4. Add settlement_id to Expenses
ALTER TABLE investment_expenses 
ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES settlements(id);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_settlement ON sales_orders(settlement_id);
CREATE INDEX IF NOT EXISTS idx_purchases_settlement ON purchases(settlement_id);
CREATE INDEX IF NOT EXISTS idx_expenses_settlement ON investment_expenses(settlement_id);
