-- MIGRATION 52: Exchange Rate Automation Support
-- Adds metadata to track manual vs automated updates

ALTER TABLE public.exchange_rates
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_update_source VARCHAR(50) DEFAULT 'INITIAL_SETUP';

-- Log change
NOTIFY pgrst, 'reload schema';
