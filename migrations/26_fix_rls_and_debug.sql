-- MIGRATION 26: Fix RLS Permissions and Debugging
-- Redefines get_user_role to ensure it bypasses RLS correctly.

-- 1. Redefine get_user_role with strict settings
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
    v_role text;
BEGIN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure permissions
ALTER FUNCTION public.get_user_role() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;

-- 3. Debug Function (Safe to expose, just returns current role)
CREATE OR REPLACE FUNCTION public.get_my_debug_role()
RETURNS jsonb AS $$
DECLARE
    v_role text;
    v_uid uuid;
BEGIN
    v_uid := auth.uid();
    v_role := public.get_user_role();
    
    RETURN jsonb_build_object(
        'uid', v_uid,
        'role_from_db', v_role,
        'is_director', v_role = 'director'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Re-apply policies for Suppliers (Just to be safe/refresh)
DROP POLICY IF EXISTS "Managers can manage suppliers" ON public.suppliers;
CREATE POLICY "Managers can manage suppliers"
    ON public.suppliers
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- 5. Re-apply policies for Purchases
DROP POLICY IF EXISTS "Managers can manage purchases" ON public.purchases;
CREATE POLICY "Managers can manage purchases"
    ON public.purchases
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

NOTIFY pgrst, 'reload schema';
