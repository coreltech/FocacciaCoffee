-- Create table for Capital Contributions
CREATE TABLE IF NOT EXISTS capital_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contribution_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    partner_name TEXT NOT NULL CHECK (partner_name IN ('Agustín', 'Juan Manuel', 'Fondo', 'Otro')),
    description TEXT,
    currency TEXT DEFAULT 'USD'
);

-- Enable RLS just in case (though we seem to use anon for now with full access, good practice)
ALTER TABLE capital_contributions ENABLE ROW LEVEL SECURITY;

-- Policy to allow all for anon (dev mode)
CREATE POLICY "Allow all for anon" ON capital_contributions FOR ALL USING (true);
