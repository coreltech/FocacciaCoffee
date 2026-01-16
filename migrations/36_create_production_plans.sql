CREATE TABLE production_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    planned_date DATE DEFAULT CURRENT_DATE,
    items JSONB DEFAULT '[]'::jsonb, -- Array of {catalog_id, quantity}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;

-- Policies (Accessible to authenticated users, assuming roles handled in UI or basic auth for now)
CREATE POLICY "Enable all for authenticated users" ON production_plans
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
