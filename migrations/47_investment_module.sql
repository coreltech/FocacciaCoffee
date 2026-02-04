-- Migration 47: Investment and Finances Module

-- 1. Table for Capital Entries (Ingresos de Inversión)
CREATE TABLE IF NOT EXISTS public.capital_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL,
    source TEXT NOT NULL, -- Who provided the capital
    notes TEXT
);

-- 2. Table for Investment Expenses (Gastos de Inversión / Facturas Libres)
CREATE TABLE IF NOT EXISTS public.investment_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    provider TEXT, -- Supplier Name
    invoice_number TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb, -- Array of { description, quantity, unit_price, total }
    category TEXT -- Optional category
);

-- 3. Enable RLS (Security)
ALTER TABLE public.capital_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allow all for now, or authenticated)
-- Adjust based on your Auth setup. Assuming authenticated users can manage finances.
CREATE POLICY "Enable all for authenticated users" ON public.capital_entries
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON public.investment_expenses
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions if needed (usually handled by Supabase roles, but good to be explicit for app usages)
GRANT ALL ON public.capital_entries TO authenticated;
GRANT ALL ON public.investment_expenses TO authenticated;
GRANT ALL ON public.capital_entries TO service_role;
GRANT ALL ON public.investment_expenses TO service_role;
