-- ============================================
-- FIX: Permitir a todos los roles ver el historial de tasas
-- ============================================
-- La tabla rates_history actualmente solo permite acceso a directores
-- Esto debe cambiarse para que todos los roles autenticados puedan ver el historial

-- Eliminar política restrictiva actual
DROP POLICY IF EXISTS "Directors can view rates history" ON public.rates_history;

-- Crear nueva política que permita a todos los roles autenticados ver el historial
CREATE POLICY "All authenticated users can view rates history"
    ON public.rates_history
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Nota: Solo los directores pueden INSERTAR en rates_history (esto ya está manejado por la política de exchange_rates)
