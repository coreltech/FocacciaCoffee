-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - ADD BENEFICIARY TO TREASURY
-- =====================================================================================

ALTER TABLE public.v2_operational_expenses ADD COLUMN beneficiary TEXT;
ALTER TABLE public.v2_capital_contributions ADD COLUMN beneficiary TEXT;

COMMENT ON COLUMN public.v2_operational_expenses.beneficiary IS 'A quién se le paga o dónde se hace el gasto';
COMMENT ON COLUMN public.v2_capital_contributions.beneficiary IS 'Entidad u origen del aporte si aplica';
