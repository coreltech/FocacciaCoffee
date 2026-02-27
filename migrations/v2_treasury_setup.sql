-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - SCRIPT DE INICIALIZACIÓN MÓDULO TESORERÍA V2
-- Gastos Operativos Ordinarios y Aportes de Capital (Prioridad para liquidaciones)
-- =====================================================================================

-- 1. TABLA DE GASTOS OPERATIVOS V2 (v2_operational_expenses)
CREATE TABLE public.v2_operational_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- Ej: 'Sueldos', 'Servicios', 'Alquiler', 'Pasajes', 'Mantenimiento'
    amount NUMERIC(15,2) NOT NULL, -- Monto en Moneda Base (ej. USD)
    reference_rate NUMERIC(15,2), -- Tasa BCV al momento del gasto
    settlement_id UUID, -- NULL si no ha sido liquidado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE APORTES DE CAPITAL V2 (v2_capital_contributions)
CREATE TABLE public.v2_capital_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    partner_name TEXT NOT NULL, -- 'Agustín' o 'Juan'
    description TEXT NOT NULL, -- Razón del préstamo/aporte
    amount NUMERIC(15,2) NOT NULL, -- Monto aportado
    reference_rate NUMERIC(15,2), -- Tasa BCV al momento del aporte
    settlement_id UUID, -- NULL si la empresa aún no le devuelve la plata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PERMISOS RLS (Row Level Security)
-- Ajustar según la estrictez requerida, V2 permite a autenticados tener acceso total por el momento
ALTER TABLE public.v2_operational_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.v2_operational_expenses
    FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.v2_capital_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.v2_capital_contributions
    FOR ALL USING (auth.role() = 'authenticated');
