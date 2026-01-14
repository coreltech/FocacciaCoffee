-- MIGRATION 16: Direct VES Financial Core
-- Refactors rates to be stored as VES equivalents for 1 USD and 1 EUR.

-- 1. Wipe and recreate the exchange_rates table with the correct semantics
DROP TABLE IF EXISTS public.exchange_rates CASCADE;

CREATE TABLE public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL UNIQUE, -- 'USD', 'EUR' (Moneda de referencia)
    rate_to_ves NUMERIC(15,6) NOT NULL,       -- Cantidad de VES por 1 unidad de esta moneda
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Populate with starting rates (Simplified direct VES values)
INSERT INTO public.exchange_rates (currency_code, rate_to_ves) VALUES 
('USD', 43.50),
('EUR', 46.80);

-- 3. Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Authenticated Write" ON public.exchange_rates FOR ALL USING (auth.role() = 'authenticated');
GRANT ALL ON TABLE public.exchange_rates TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
