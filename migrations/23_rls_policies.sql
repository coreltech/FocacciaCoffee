-- ============================================
-- MIGRATION 23: Row Level Security Policies
-- ============================================
-- Configuración de políticas RLS para seguridad híbrida:
-- - Web Pública: Acceso público a catálogo (sales_prices, catalog_composition)
-- - ERP Privado: Acceso basado en roles (director, gerente, asistente)

-- ============================================
-- PARTE 1: POLÍTICAS PÚBLICAS (Web de Clientes)
-- ============================================

-- 1.1. Habilitar RLS en sales_prices (si no está habilitado)
ALTER TABLE public.sales_prices ENABLE ROW LEVEL SECURITY;

-- 1.2. Permitir SELECT público en sales_prices (para catálogo web)
DROP POLICY IF EXISTS "Public read access for sales_prices" ON public.sales_prices;
CREATE POLICY "Public read access for sales_prices"
    ON public.sales_prices
    FOR SELECT
    USING (true); -- Acceso público total para SELECT

-- 1.3. Habilitar RLS en catalog_composition
ALTER TABLE public.catalog_composition ENABLE ROW LEVEL SECURITY;

-- 1.4. Permitir SELECT público en catalog_composition
DROP POLICY IF EXISTS "Public read access for catalog_composition" ON public.catalog_composition;
CREATE POLICY "Public read access for catalog_composition"
    ON public.catalog_composition
    FOR SELECT
    USING (true);

-- ============================================
-- PARTE 2: POLÍTICAS POR ROL (ERP)
-- ============================================

-- Función auxiliar para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2.1. TABLAS DE COSTOS (Solo Director)
-- ============================================

-- Supplies (Suministros con costos)
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Directors can manage supplies" ON public.supplies;
CREATE POLICY "Directors can manage supplies"
    ON public.supplies
    FOR ALL
    USING (get_user_role() = 'director')
    WITH CHECK (get_user_role() = 'director');

-- Ingredients (Ingredientes legacy con costos)
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Directors can manage ingredients" ON public.ingredients;
CREATE POLICY "Directors can manage ingredients"
    ON public.ingredients
    FOR ALL
    USING (get_user_role() = 'director')
    WITH CHECK (get_user_role() = 'director');

-- ============================================
-- 2.2. TABLAS DE INVENTARIO (Director y Gerente)
-- ============================================

-- Inventory Transactions (Kardex)
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Managers can view inventory transactions"
    ON public.inventory_transactions
    FOR SELECT
    USING (get_user_role() IN ('director', 'gerente'));

DROP POLICY IF EXISTS "Managers can insert inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Managers can insert inventory transactions"
    ON public.inventory_transactions
    FOR INSERT
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Production Logs
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage production" ON public.production_logs;
CREATE POLICY "Managers can manage production"
    ON public.production_logs
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Waste Logs (Mermas)
ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage waste" ON public.waste_logs;
CREATE POLICY "Managers can manage waste"
    ON public.waste_logs
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view recipes" ON public.recipes;
CREATE POLICY "Managers can view recipes"
    ON public.recipes
    FOR SELECT
    USING (get_user_role() IN ('director', 'gerente'));

DROP POLICY IF EXISTS "Managers can manage recipes" ON public.recipes;
CREATE POLICY "Managers can manage recipes"
    ON public.recipes
    FOR INSERT
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

DROP POLICY IF EXISTS "Managers can update recipes" ON public.recipes;
CREATE POLICY "Managers can update recipes"
    ON public.recipes
    FOR UPDATE
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Recipe Items
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage recipe items" ON public.recipe_items;
CREATE POLICY "Managers can manage recipe items"
    ON public.recipe_items
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- ============================================
-- 2.3. TABLAS DE VENTAS (Todos los roles)
-- ============================================

-- Sales Orders
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All roles can view sales" ON public.sales_orders;
CREATE POLICY "All roles can view sales"
    ON public.sales_orders
    FOR SELECT
    USING (get_user_role() IN ('director', 'gerente', 'asistente'));

DROP POLICY IF EXISTS "All roles can create sales" ON public.sales_orders;
CREATE POLICY "All roles can create sales"
    ON public.sales_orders
    FOR INSERT
    WITH CHECK (get_user_role() IN ('director', 'gerente', 'asistente'));

DROP POLICY IF EXISTS "Managers can update sales" ON public.sales_orders;
CREATE POLICY "Managers can update sales"
    ON public.sales_orders
    FOR UPDATE
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All roles can view customers" ON public.customers;
CREATE POLICY "All roles can view customers"
    ON public.customers
    FOR SELECT
    USING (get_user_role() IN ('director', 'gerente', 'asistente'));

DROP POLICY IF EXISTS "Managers can manage customers" ON public.customers;
CREATE POLICY "Managers can manage customers"
    ON public.customers
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- ============================================
-- 2.4. TABLAS FINANCIERAS (Director)
-- ============================================

-- Exchange Rates (Tasas de cambio)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All roles can view rates" ON public.exchange_rates;
CREATE POLICY "All roles can view rates"
    ON public.exchange_rates
    FOR SELECT
    USING (get_user_role() IN ('director', 'gerente', 'asistente'));

DROP POLICY IF EXISTS "Directors can manage rates" ON public.exchange_rates;
CREATE POLICY "Directors can manage rates"
    ON public.exchange_rates
    FOR ALL
    USING (get_user_role() = 'director')
    WITH CHECK (get_user_role() = 'director');

-- Rates History
ALTER TABLE public.rates_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Directors can view rates history" ON public.rates_history;
CREATE POLICY "Directors can view rates history"
    ON public.rates_history
    FOR SELECT
    USING (get_user_role() = 'director');

-- ============================================
-- 2.5. POLÍTICAS PARA MODIFICACIÓN DE CATÁLOGO (Director y Gerente)
-- ============================================

-- Sales Prices - INSERT/UPDATE/DELETE solo para director y gerente
DROP POLICY IF EXISTS "Managers can manage sales_prices" ON public.sales_prices;
CREATE POLICY "Managers can manage sales_prices"
    ON public.sales_prices
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Catalog Composition - INSERT/UPDATE/DELETE solo para director y gerente
DROP POLICY IF EXISTS "Managers can manage catalog_composition" ON public.catalog_composition;
CREATE POLICY "Managers can manage catalog_composition"
    ON public.catalog_composition
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las tablas sales_prices y catalog_composition tienen acceso público para SELECT
--    pero solo director y gerente pueden modificarlas
-- 2. El director tiene acceso completo a todo
-- 3. El gerente puede gestionar inventario, producción y ventas (sin ver costos)
-- 4. El asistente solo puede ver catálogo y crear ventas
-- 5. Las vistas (v_catalog_costs, v_production_costs, etc.) heredan las políticas
--    de las tablas base que consultan
