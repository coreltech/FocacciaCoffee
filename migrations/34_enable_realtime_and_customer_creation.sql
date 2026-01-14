-- MIGRATION 34: Real-time Sales & Customer Creation Access
-- Enables automatic UI updates for web orders and grants 'asistente' role permission to register customers.

-- 1. Enable Supabase Realtime for the sales and customer tables
-- MODERN WAY: Add tables to the 'supabase_realtime' publication
-- If they are already in the publication, this might show a notice/error which is fine.
BEGIN;
  -- If the publication doesn't exist, this creates it, but it usually exists in Supabase by default
  -- CREATE PUBLICATION supabase_realtime FOR TABLE public.sales_orders, public.customers;
  
  -- Safer approach: Add them individually. If they fail because they exist, it's okay.
  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_orders;
  EXCEPTION WHEN others THEN 
    RAISE NOTICE 'Table sales_orders already in publication or error: %', SQLERRM;
  END $$;

  DO $$ 
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
  EXCEPTION WHEN others THEN 
    RAISE NOTICE 'Table customers already in publication or error: %', SQLERRM;
  END $$;
COMMIT;

-- 2. Update RLS policies for Customers
-- Previously, only 'director' and 'gerente' could manage customers.
-- We now allow 'asistente' to at least INSERT new customers.

-- Relax the management policy or add an explicit INSERT policy
DROP POLICY IF EXISTS "Managers can manage customers" ON public.customers;

-- Re-implement broader management for managers
CREATE POLICY "Managers can manage customers"
    ON public.customers
    FOR ALL
    USING (get_user_role() IN ('director', 'gerente'))
    WITH CHECK (get_user_role() IN ('director', 'gerente'));

-- Add explicit INSERT for asistentes
CREATE POLICY "Asistentes can create customers"
    ON public.customers
    FOR INSERT
    WITH CHECK (get_user_role() = 'asistente');

-- 3. Ensure reload for PostgREST
NOTIFY pgrst, 'reload schema';
