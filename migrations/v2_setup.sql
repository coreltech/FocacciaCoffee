-- =====================================================================================
-- FOCACCIA PLUS & COFFEE - SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS V2
-- Opción A: Aislamiento Total. Crea un esquema nuevo y limpio con tablas 'v2_'.
-- =====================================================================================

-- 1. TABLA DE CLIENTES (v2_customers)
CREATE TABLE public.v2_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA CABECERA DE VENTAS (v2_orders)
CREATE TABLE public.v2_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlative TEXT NOT NULL UNIQUE,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    customer_id UUID REFERENCES public.v2_customers(id) ON DELETE SET NULL,
    total_amount NUMERIC(15,2) DEFAULT 0 NOT NULL,
    amount_paid NUMERIC(15,2) DEFAULT 0 NOT NULL,
    balance_due NUMERIC(15,2) DEFAULT 0 NOT NULL,
    payment_status TEXT NOT NULL, -- ej: 'Pagado', 'Deuda'
    payment_methods JSONB DEFAULT '[]'::jsonb,
    is_preorder BOOLEAN DEFAULT FALSE,
    delivery_date DATE,
    status TEXT DEFAULT 'Completada', -- ej: 'Completada', 'Anulada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA CATÁLOGO DE PRODUCTOS (v2_catalog)
CREATE TABLE public.v2_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC(15,2) DEFAULT 0 NOT NULL,
    stock NUMERIC(15,2) DEFAULT 0 NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DETALLE DE VENTAS (v2_order_items)
CREATE TABLE public.v2_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.v2_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.v2_catalog(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Histórico de nombre
    quantity NUMERIC(15,2) DEFAULT 1 NOT NULL,
    unit_price NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_price NUMERIC(15,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE MATERIA PRIMA / INSUMOS (v2_supplies)
CREATE TABLE public.v2_supplies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    measurement_unit TEXT NOT NULL, -- kg, l, un
    stock NUMERIC(15,3) DEFAULT 0 NOT NULL,
    min_stock NUMERIC(15,3) DEFAULT 0 NOT NULL,
    last_price NUMERIC(15,2) DEFAULT 0,
    supplier_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE RECETAS (v2_recipes)
CREATE TABLE public.v2_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    expected_weight NUMERIC(15,2) DEFAULT 0,
    recipe_type TEXT DEFAULT 'Terminado', -- 'Masa', 'Relleno', 'Terminado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE INGREDIENTES DE RECETA (v2_recipe_items)
CREATE TABLE public.v2_recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES public.v2_recipes(id) ON DELETE CASCADE NOT NULL,
    supply_id UUID REFERENCES public.v2_supplies(id) ON DELETE RESTRICT NOT NULL,
    quantity NUMERIC(15,2) NOT NULL, -- Gramos o ml
    percentage NUMERIC(6,2),         -- % panadero
    is_base BOOLEAN DEFAULT FALSE,   -- Si es el ingrediente ancla (100%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA BOM: COMPOSICIÓN DEL CATÁLOGO (v2_catalog_composition)
CREATE TABLE public.v2_catalog_composition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id UUID REFERENCES public.v2_catalog(id) ON DELETE CASCADE NOT NULL,
    recipe_id UUID REFERENCES public.v2_recipes(id) ON DELETE RESTRICT,
    supply_id UUID REFERENCES public.v2_supplies(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,3) DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Validar que o tenga receta o tenga insumo, pero no los dos nulos
    CONSTRAINT chk_composition_source CHECK (recipe_id IS NOT NULL OR supply_id IS NOT NULL)
);

-- 9. TABLA DE LOGS DE PRODUCCIÓN (v2_production_logs)
CREATE TABLE public.v2_production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id UUID REFERENCES public.v2_catalog(id) ON DELETE SET NULL,
    recipe_id UUID REFERENCES public.v2_recipes(id) ON DELETE SET NULL,
    units_produced NUMERIC(15,2) NOT NULL,
    total_cost NUMERIC(15,2) DEFAULT 0,
    production_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA KARDEX / TRANSACCIONES DE INVENTARIO (v2_inventory_transactions)
CREATE TABLE public.v2_inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id UUID, -- No fk estricta porque puede apuntar a orders, production, supplies
    item_type TEXT NOT NULL, -- 'CATALOG_ITEM' o 'SUPPLY_ITEM'
    item_id UUID NOT NULL,   -- ID del producto o insumo
    transaction_type TEXT NOT NULL, -- 'SALE', 'PRODUCTION', 'ADJUSTMENT', 'PURCHASE'
    quantity NUMERIC(15,3) NOT NULL,
    old_stock NUMERIC(15,3),
    new_stock NUMERIC(15,3),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABLA DE CONFIGURACIÓN Y TASAS (v2_settings_rates)
CREATE TABLE public.v2_settings_rates (
    id SERIAL PRIMARY KEY,
    usd_to_ves NUMERIC(10,2) DEFAULT 1 NOT NULL,
    eur_to_usd NUMERIC(10,2) DEFAULT 1 NOT NULL,
    is_manual BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Inicializamos con un valor por si acaso
INSERT INTO public.v2_settings_rates (id, usd_to_ves, eur_to_usd, is_manual) VALUES (1, 40.00, 1.05, true) ON CONFLICT (id) DO NOTHING;

-- 12. TABLA DE HISTORIAL DE TASAS (v2_rates_history)
CREATE TABLE public.v2_rates_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usd_to_ves NUMERIC(10,2) NOT NULL,
    eur_to_usd NUMERIC(10,2) NOT NULL,
    is_manual BOOLEAN DEFAULT TRUE,
    updated_by TEXT DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- Permisos de Fila (RLS - Row Level Security)
-- Habilitar si la BD es pública a cliente. Si se usa el Service Role / Anon Key de V1, 
-- se recomienda permitir acceso total a roles autenticados.
-- =====================================================================================
-- Para simplificar la migración: Permitir todo a roles anónimos u autenticados 
-- (AJUSTAR SEGÚN POLÍTICA DE SEGURIDAD DEL PROYECTO)

-- Las políticas (Policies) dependerán de cómo tengas configurado Supabase. 
-- Aquí un acceso básico si trabajas como la V1 (comentar si usas restricciones estrictas):

/*
ALTER TABLE public.v2_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.v2_customers FOR ALL USING (true);
... repetir para todas las tablas.
*/
