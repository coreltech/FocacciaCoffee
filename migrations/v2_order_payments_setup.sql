-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - SCRIPT DE INFRAESTRUCTURA FINANCIERA (LIQUIDACIÓN + PAGOS)
-- Asegura que existan las tablas de Liquidación y Pagos Individuales.
-- =====================================================================================

-- 1. Asegurar tabla de liquidaciones (Por si no se ejecutó la migración previa)
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

-- Asegurar que v2_orders tenga la columna settlement_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='v2_orders' AND column_name='settlement_id') THEN
        ALTER TABLE public.v2_orders ADD COLUMN settlement_id UUID REFERENCES public.v2_settlements(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Crear tabla de pagos individuales (Cash Basis)
CREATE TABLE IF NOT EXISTS public.v2_order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.v2_orders(id) ON DELETE CASCADE NOT NULL,
    amount_usd NUMERIC(15,2) NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    settlement_id UUID REFERENCES public.v2_settlements(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.v2_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_order_payments ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso (Pattern del proyecto)
DO $$ 
BEGIN
    -- Política para Liquidaciones
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v2_settlements' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.v2_settlements FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    -- Política para Pagos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v2_order_payments' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.v2_order_payments FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

COMMENT ON TABLE public.v2_order_payments IS 'Registra cada evento de pago individual para permitir reportes de flujo de caja real (Cash Basis).';
