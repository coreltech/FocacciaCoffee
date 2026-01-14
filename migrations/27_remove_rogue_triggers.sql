-- MIGRATION: Remove Rogue updated_at Triggers
-- The error "record 'new' has no field 'updated_at'" implies a trigger is trying to set updated_at on a table that doesn't have it.
-- Purchases and Purchase Items are transactional (immutable mostly), so they don't strictly need updated_at triggers causing issues.
-- This migration removes those specific triggers to clear the error.

-- 1. Drop potential updated_at triggers from purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS set_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS handle_updated_at ON public.purchases;

-- 2. Drop potential updated_at triggers from purchase_items
DROP TRIGGER IF EXISTS update_purchase_items_updated_at ON public.purchase_items;
DROP TRIGGER IF EXISTS set_updated_at ON public.purchase_items;
DROP TRIGGER IF EXISTS handle_updated_at ON public.purchase_items;

-- 3. Ensure supplies (which NEEDS it) works
ALTER TABLE public.supplies
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Re-assert the trigger ONLY for supplies
DROP TRIGGER IF EXISTS update_supplies_updated_at ON public.supplies;
CREATE TRIGGER update_supplies_updated_at
    BEFORE UPDATE ON supplies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
