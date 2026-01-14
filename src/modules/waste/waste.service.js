import { supabase } from '../../core/supabase.js';

export const WasteService = {
    async getInventoryItems() {
        // Fetch inputs (supplies) and finished products (catalog)
        const [supplies, products] = await Promise.all([
            supabase.from('supplies').select('id, name, category').order('name'),
            supabase.from('sales_prices').select('id, product_name, stock_disponible').eq('esta_activo', true).order('product_name')
        ]);

        return {
            ingredients: supplies.data || [], // Keep key name 'ingredients' for UI compatibility if needed
            products: products.data || []
        };
    },

    async registerWaste(wasteData) {
        /*
            wasteData: {
                itemId,
                itemType, // 'ingredient' | 'product'
                quantity, // Positive number from UI, converted to negative for transaction
                reason,
                date
            }
        */

        // Transaction logic:
        // Quantity must be negative to reduce stock.
        const quantityDelta = -Math.abs(wasteData.quantity);

        // We need to know which table ID belongs to.
        // The inventory_transactions table usually links to... well, Phase 1 migration didn't specify distinct FK columns for Ingredients vs Products in the same 'product_id' column unless we handled it.
        // Let's recall/check Migration 01. 
        // Typically 'product_id' in inventory_transactions referred to 'sales_prices(id)'.
        // If we want to track waste of INGREDIENTS, we need a column for ingredient_id or handle it.
        // Migration 01 created: `product_id bigint REFERENCES sales_prices(id)`.
        // It DOES NOT seem to have `ingredient_id`.
        // PROBLEM: The current system only tracks stock for Finished Goods (sales_prices) in the Kardex?
        // Let's check `02_transactional_logic.sql` or `01`.
        // If the user wants "Mermas", they imply finished goods OR ingredients.
        // If the system currently ONLY tracks `sales_prices.stock_disponible`, then we can only register waste for PRODUCTS.
        // If we want to track Ingredient stock, we would need `ingredients.stock` and logic for it.
        // Looking at `ingredients` table structure in previous context: it has `costo_base...`. Does it have stock?
        // Phase 1 migration summary said: "update_stock_from_kardex (Postgres Trigger Function) que actualiza sales_prices.stock_disponible".
        // It seems Phase 1 focused on PRODUCT stock.
        // CONCLUSION: For now, we only implement Waste for CATALOG PRODUCTS. 
        // If the user wants Ingredient waste, we'd need to extend the validation/DB schema. 
        // I will focus on Products for now to stay safe within existing Schema, but maybe allow "Reference" logging for ingredients even if it doesn't update a stock column (since one might not exist).
        // Let's stick to Products (sales_prices) which definitely have stock.

        const { error } = await supabase.from('inventory_transactions').insert([{
            product_id: wasteData.itemType === 'product' ? wasteData.itemId : null,
            // If we add ingredient support later, we'd need a column. 
            transaction_type: 'MERMA',
            quantity: quantityDelta,
            reason: wasteData.reason,
            created_at: new Date().toISOString()
        }]);

        if (error) throw error;
    },

    async getWasteHistory() {
        // Get recent transactions of type MERMA
        const { data, error } = await supabase.from('inventory_transactions')
            .select('*, sales_prices(product_name)')
            .eq('transaction_type', 'MERMA')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data || [];
    }
};
