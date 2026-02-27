-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - FIX TREASURY RLS
-- Permite acceso a todos los usuarios (anon y authenticated) para facilitar el desarrollo
-- =====================================================================================

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.v2_operational_expenses;
CREATE POLICY "Enable all for all users" ON public.v2_operational_expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.v2_capital_contributions;
CREATE POLICY "Enable all for all users" ON public.v2_capital_contributions FOR ALL USING (true) WITH CHECK (true);
