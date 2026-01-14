-- MIGRATION 14: Financial Core (Multi-Currency)
-- Establishes the foundation for tracking rates and converting currencies.

-- 1. Create a modern exchange rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL, -- 'VES', 'EUR'
    rate_to_usd NUMERIC(15,6) NOT NULL, -- High precision for devaluations
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Populate with initial rates (Migration from old global_config)
INSERT INTO public.exchange_rates (currency_code, rate_to_usd)
SELECT 'VES', tasa_usd_ves FROM global_config WHERE id = 'current_rates'
ON CONFLICT DO NOTHING;

INSERT INTO public.exchange_rates (currency_code, rate_to_usd)
SELECT 'EUR', (tasa_usd_ves / NULLIF(tasa_eur_ves, 0)) FROM global_config WHERE id = 'current_rates'
ON CONFLICT DO NOTHING;

-- 3. Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Authenticated Write" ON public.exchange_rates FOR ALL USING (auth.role() = 'authenticated');
GRANT ALL ON TABLE public.exchange_rates TO anon, authenticated, service_role;

-- 4. Notify to refresh cache
NOTIFY pgrst, 'reload schema';
