-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - SCRIPT DE INICIALIZACIÓN V2 FASE 2 (COMPRAS)
-- Añade Módulo de Proveedores y Compras
-- =====================================================================================

-- 1. TABLA DE PROVEEDORES
CREATE TABLE public.v2_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modificar v2_supplies (Insumos) para que apunte al nuevo proveedor (Opcional, pero recomendado)
-- ALTER TABLE public.v2_supplies ADD COLUMN supplier_id UUID REFERENCES public.v2_suppliers(id) ON DELETE SET NULL;

-- 2. TABLA CABECERA DE COMPRAS
CREATE TABLE public.v2_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.v2_suppliers(id) ON DELETE RESTRICT NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE NOT NULL,
    document_type TEXT NOT NULL, -- Ej: 'Factura', 'Nota de Entrega'
    document_number TEXT,
    total_usd NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_bs NUMERIC(15,2) DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'Procesada', -- 'Procesada', 'Anulada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DETALLE DE COMPRAS
CREATE TABLE public.v2_purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.v2_purchases(id) ON DELETE CASCADE NOT NULL,
    supply_id UUID REFERENCES public.v2_supplies(id) ON DELETE RESTRICT NOT NULL,
    quantity NUMERIC(15,3) NOT NULL,
    unit_price_usd NUMERIC(15,4) NOT NULL,
    subtotal_usd NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
