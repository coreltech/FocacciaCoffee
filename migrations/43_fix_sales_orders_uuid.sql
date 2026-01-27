-- MIGRATION 43: Complete UUID Alignment for Sales Orders
-- Description: Converts sales_orders.product_id to UUID to match the catalog (sales_prices). 
-- WARNING: This will set product_id to NULL for old records with integer IDs that cannot be cast to UUID.

DO $$ 
BEGIN
    -- 1. Drop Foreign Key on sales_orders.product_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='sales_orders' AND constraint_name='sales_orders_product_id_fkey') THEN
        ALTER TABLE public.sales_orders DROP CONSTRAINT sales_orders_product_id_fkey;
    END IF;

    -- 2. Convert product_id to UUID safely
    -- If it's already UUID, this does nothing (or re-casts). 
    -- If it's BigInt/Text, it forces conversion. Non-UUID strings become NULL.
    ALTER TABLE public.sales_orders 
        ALTER COLUMN product_id TYPE UUID USING (
            CASE 
                -- Regex check for valid UUID format (8-4-4-4-12 hex digits)
                WHEN product_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                THEN product_id::text::uuid 
                ELSE NULL 
            END
        );

    -- 3. Restore Foreign Key to sales_prices
    -- We assume sales_prices.id is already UUID (verified by diagnostic).
    ALTER TABLE public.sales_orders 
        ADD CONSTRAINT sales_orders_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE SET NULL;

    -- 4. Verify/Fix inventory_transactions.product_id just in case (Redundancy from Migration 20)
    -- If Migration 20 failed or was skipped, this ensures it works.
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='inventory_transactions' AND constraint_name='inventory_transactions_product_id_fkey') THEN
        ALTER TABLE public.inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
    END IF;

    ALTER TABLE public.inventory_transactions 
        ALTER COLUMN product_id TYPE UUID USING (
            CASE 
                WHEN product_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                THEN product_id::text::uuid 
                ELSE NULL 
            END
        );
        
    ALTER TABLE public.inventory_transactions 
        ADD CONSTRAINT inventory_transactions_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE SET NULL;

END $$;
