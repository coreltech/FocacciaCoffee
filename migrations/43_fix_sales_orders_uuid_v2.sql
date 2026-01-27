-- MIGRATION 43 (v2): Complete UUID Alignment for Sales Orders & Inventory
-- Description: Converts sales_orders.product_id and inventory_transactions.product_id to UUID.
-- Handles view dependencies by dropping and recreating v_stock_movements.

DO $$ 
BEGIN
    -- 1. Drop dependent view
    DROP VIEW IF EXISTS public.v_stock_movements;

    -- 2. SALES_ORDERS: Convert product_id to UUID
    -- Drop FK first
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='sales_orders' AND constraint_name='sales_orders_product_id_fkey') THEN
        ALTER TABLE public.sales_orders DROP CONSTRAINT sales_orders_product_id_fkey;
    END IF;

    -- Convert column safely
    ALTER TABLE public.sales_orders 
        ALTER COLUMN product_id TYPE UUID USING (
            CASE 
                WHEN product_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                THEN product_id::text::uuid 
                ELSE NULL 
            END
        );

    -- Restore FK
    ALTER TABLE public.sales_orders 
        ADD CONSTRAINT sales_orders_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE SET NULL;

    -- 3. INVENTORY_TRANSACTIONS: Convert product_id to UUID
    -- Drop FK first
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='inventory_transactions' AND constraint_name='inventory_transactions_product_id_fkey') THEN
        ALTER TABLE public.inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
    END IF;

    -- Convert column safely
    ALTER TABLE public.inventory_transactions 
        ALTER COLUMN product_id TYPE UUID USING (
            CASE 
                WHEN product_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                THEN product_id::text::uuid 
                ELSE NULL 
            END
        );
        
    -- Restore FK
    ALTER TABLE public.inventory_transactions 
        ADD CONSTRAINT inventory_transactions_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.sales_prices(id) ON DELETE SET NULL;

END $$;

-- 4. Recreate View: v_stock_movements
CREATE OR REPLACE VIEW public.v_stock_movements AS
SELECT 
    it.id,
    it.product_id,
    it.supply_id,
    it.transaction_type,
    it.quantity,
    it.reference_id,
    it.created_at,
    CASE 
        WHEN it.product_id IS NOT NULL THEN (SELECT product_name FROM sales_prices WHERE id = it.product_id)
        WHEN it.supply_id IS NOT NULL THEN (SELECT name FROM supplies WHERE id = it.supply_id)
        ELSE 'Otro/Kardex'
    END as item_name
FROM inventory_transactions it;

-- 5. Restore Permissions
GRANT SELECT ON public.v_stock_movements TO anon, authenticated, service_role;

-- 6. Refresh Schema
NOTIFY pgrst, 'reload schema';
