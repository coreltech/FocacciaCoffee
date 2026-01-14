-- MIGRATION: Purchases Module RLS
-- Enables Row Level Security for Purchases, Suppliers, and related tables.
-- Grants full access to 'director' and 'gerente' roles.

-- 1. Suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage suppliers" ON public.suppliers;
CREATE POLICY "Managers can manage suppliers"
    ON public.suppliers
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- 2. Supplier Locations
ALTER TABLE public.supplier_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage supplier locations" ON public.supplier_locations;
CREATE POLICY "Managers can manage supplier locations"
    ON public.supplier_locations
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- 3. Purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage purchases" ON public.purchases;
CREATE POLICY "Managers can manage purchases"
    ON public.purchases
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- 4. Purchase Items
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage purchase items" ON public.purchase_items;
CREATE POLICY "Managers can manage purchase items"
    ON public.purchase_items
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- 5. Supplies (Update existing policy from 23 to include Gerente if needed)
-- NOTE: Policy "Directors can manage supplies" exists. 
-- We add one for Gerente to at least READ and UPDATE (for stock adjustments via purchases)
DROP POLICY IF EXISTS "Gerentes can view and update supplies" ON public.supplies;
CREATE POLICY "Gerentes can view and update supplies"
    ON public.supplies
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
