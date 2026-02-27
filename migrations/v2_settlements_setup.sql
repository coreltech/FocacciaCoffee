-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - SCRIPT DE INICIALIZACIÓN V2 FASE 3 (LIQUIDACIÓN)
-- Gestión de Liquidaciones y Cierre de Periodos
-- =====================================================================================

-- 1. Crear tabla de liquidaciones v2
CREATE TABLE IF NOT EXISTS public.v2_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_income NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_outcome NUMERIC(15,2) DEFAULT 0 NOT NULL,
    net_utility NUMERIC(15,2) DEFAULT 0 NOT NULL,
    fund_amount NUMERIC(15,2) DEFAULT 0 NOT NULL,
    partner_a_amount NUMERIC(15,2) DEFAULT 0 NOT NULL,
    partner_b_amount NUMERIC(15,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Añadir settlement_id a tablas existentes si no lo tienen
-- Ventas
ALTER TABLE public.v2_orders ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.v2_settlements(id) ON DELETE SET NULL;

-- Compras
ALTER TABLE public.v2_purchases ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.v2_settlements(id) ON DELETE SET NULL;

-- Tesorería (Ya lo tienen en su creación original, pero por seguridad)
ALTER TABLE public.v2_operational_expenses ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.v2_settlements(id) ON DELETE SET NULL;
ALTER TABLE public.v2_capital_contributions ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.v2_settlements(id) ON DELETE SET NULL;

-- 3. PERMISOS RLS
ALTER TABLE public.v2_settlements ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'v2_settlements' AND policyname = 'Enable all for authenticated users'
    ) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.v2_settlements
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
