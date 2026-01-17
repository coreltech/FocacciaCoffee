import { supabase } from '../../core/supabase.js';

export const InventoryService = {
    // --- SUPPLIES (UNIFIED INPUTS) ---
    async getSupplies() {
        const { data, error } = await supabase.from('supplies').select('*').order('name');
        if (error) throw error;
        return data || [];
    },

    async saveSupply(supply) {
        const { data, error } = await supabase.from('supplies').upsert(supply).select().single();
        if (error) throw error;
        return data;
    },

    async deleteSupply(id) {
        const { error } = await supabase.from('supplies').delete().eq('id', id);
        if (error) throw error;
    },

    // --- RECIPES (PRO) ---
    async getRecipes() {
        // Detailed selection using explicit column hint to resolve ambiguity
        const { data, error } = await supabase
            .from('recipes')
            .select('*, items:v_recipe_items_detailed!recipe_id(*)')
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async saveRecipePro(recipe, items) {
        // recipe: { id?, name, tipo_receta, expected_weight, passos_preparacion }
        // items: [{ supply_id, sub_recipe_id, quantity, percentage, unit_type, is_base }]

        // 1. Upsert Header
        const { data: header, error: hErr } = await supabase
            .from('recipes')
            .upsert(recipe)
            .select()
            .single();
        if (hErr) throw hErr;

        // 2. Clear old items
        await supabase.from('recipe_items').delete().eq('recipe_id', header.id);

        // 3. Insert new items
        if (items && items.length > 0) {
            const payload = items.map(i => ({
                recipe_id: header.id,
                supply_id: i.supply_id || null,
                sub_recipe_id: i.sub_recipe_id || null,
                quantity: i.quantity || 0,
                percentage: i.percentage || 0,
                unit_type: i.unit_type || 'g',
                is_base: i.is_base || false
            }));
            const { error: iErr } = await supabase.from('recipe_items').insert(payload);
            if (iErr) throw iErr;
        }
        return header;
    },

    async deleteRecipe(id) {
        // Cascading manually if not set in DB
        await supabase.from('recipe_items').delete().eq('recipe_id', id);
        const { error } = await supabase.from('recipes').delete().eq('id', id);
        if (error) throw error;
    },

    // --- CATALOG (FINISHED GOODS) ---
    async getCatalog() {
        const { data, error } = await supabase
            .from('sales_prices')
            .select('*')
            .eq('esta_activo', true) // Only show active products
            .order('product_name');
        if (error) throw error;
        return data || [];
    },

    async getCatalogWithInactive() {
        const { data, error } = await supabase
            .from('sales_prices')
            .select('*')
            .order('product_name');
        if (error) throw error;
        return data || [];
    },

    async saveCatalogItem(item) {
        // If it has an ID, it's an UPDATE. Otherwise allow UPSERT based on constraints.
        const { data, error } = await supabase.from('sales_prices').upsert(item).select().single();

        if (error) {
            console.error('Supabase Save Error:', error);
            throw error;
        }
        return data;
    },

    async deleteCatalogItem(id) {
        // First, check if the product has related transactions
        const { data: transactions, error: txError } = await supabase
            .from('inventory_transactions')
            .select('id')
            .eq('product_id', id)
            .limit(1);

        if (txError) {
            console.warn('Error checking transactions:', txError);
        }

        const hasTransactions = transactions && transactions.length > 0;

        // If product has transactions, use SOFT DELETE (mark as inactive)
        if (hasTransactions) {
            const { data, error } = await supabase
                .from('sales_prices')
                .update({ esta_activo: false })
                .eq('id', id)
                .select();

            if (error) {
                if (error.code === '42501' || error.message.toLowerCase().includes('policy')) {
                    throw new Error('No tienes permisos suficientes para desactivar productos.');
                }
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('El producto no pudo ser desactivado.');
            }

            // Return special flag to indicate soft delete
            return { ...data[0], _softDeleted: true };
        }

        // If no transactions, proceed with HARD DELETE
        // First, delete related composition items (if any)
        const { error: compError } = await supabase
            .from('catalog_composition')
            .delete()
            .eq('catalog_id', id);

        if (compError) {
            console.warn('Composition delete warning:', compError);
        }

        // Then delete the catalog item
        const { data, error } = await supabase
            .from('sales_prices')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            // Check if it's a foreign key constraint error
            if (error.code === '23503') {
                throw new Error('No se puede eliminar este producto porque tiene registros relacionados. Se marcará como inactivo en su lugar.');
            }

            // Enhance error message for RLS policy violations
            if (error.code === '42501' || error.message.toLowerCase().includes('policy')) {
                throw new Error('No tienes permisos suficientes para eliminar productos.');
            }
            throw error;
        }

        // Verify deletion actually happened
        if (!data || data.length === 0) {
            throw new Error('El producto no pudo ser eliminado. Verifica tus permisos.');
        }

        return data[0];
    },

    async reactivateCatalogItem(id) {
        const { data, error } = await supabase
            .from('sales_prices')
            .update({ esta_activo: true })
            .eq('id', id)
            .select();

        if (error) {
            if (error.code === '42501' || error.message.toLowerCase().includes('policy')) {
                throw new Error('No tienes permisos suficientes para reactivar productos.');
            }
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('El producto no pudo ser reactivado.');
        }

        return data[0];
    },

    async forceDeleteCatalogItem(id) {
        // Get transaction count for confirmation message
        const { data: transactions, error: txError } = await supabase
            .from('inventory_transactions')
            .select('id, transaction_type, quantity, created_at')
            .eq('product_id', id)
            .order('created_at', { ascending: false });

        if (txError) {
            console.warn('Error checking transactions:', txError);
        }

        // First, delete related composition items
        const { error: compError } = await supabase
            .from('catalog_composition')
            .delete()
            .eq('catalog_id', id);

        if (compError) {
            console.warn('Composition delete warning:', compError);
        }

        // Delete all related transactions (DANGEROUS!)
        const { error: txDeleteError } = await supabase
            .from('inventory_transactions')
            .delete()
            .eq('product_id', id);

        if (txDeleteError) {
            throw new Error(`No se pudieron eliminar las transacciones: ${txDeleteError.message}`);
        }

        // Finally, delete the product
        const { data, error } = await supabase
            .from('sales_prices')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            if (error.code === '42501' || error.message.toLowerCase().includes('policy')) {
                throw new Error('No tienes permisos suficientes para eliminar permanentemente.');
            }
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('El producto no pudo ser eliminado permanentemente.');
        }

        return {
            product: data[0],
            deletedTransactions: transactions?.length || 0
        };
    },

    // --- PRODUCT ASSEMBLY (MODERN) ---
    async getCatalogComposition(catalogId) {
        const { data, error } = await supabase
            .from('catalog_composition')
            .select(`
                *,
                recipes(id, name, tipo_receta),
                supplies(id, name, last_purchase_price, equivalence, min_unit),
                components:sales_prices!component_id(id, product_name, precio_venta_final)
            `)
            .eq('catalog_id', catalogId);
        if (error) throw error;
        return data || [];
    },

    async saveCatalogComposition(catalogId, items) {
        // items: [{ recipe_id?, supply_id?, component_id?, quantity }]
        const { error: delError } = await supabase.from('catalog_composition').delete().eq('catalog_id', catalogId);
        if (delError) throw delError;

        if (items && items.length > 0) {
            const payload = items.map(i => ({
                catalog_id: catalogId,
                recipe_id: i.recipe_id || null,
                supply_id: i.supply_id || null,
                component_id: i.component_id || null,
                quantity: i.quantity
            }));
            const { error: insError } = await supabase.from('catalog_composition').insert(payload);
            if (insError) throw insError;
        }
    },

    async getSuppliesByCategory(category) {
        const { data, error } = await supabase
            .from('supplies')
            .select('*')
            .eq('category', category)
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async getRecipeCosts() {
        // Consumes the view we created earlier
        const { data, error } = await supabase.from('v_production_costs').select('*');
        if (error) throw error;
        return data || [];
    },

    async getCatalogCosts() {
        const { data, error } = await supabase.from('v_catalog_costs').select('*').order('product_name');
        if (error) throw error;
        return data || [];
    },

    async uploadProductImage(file) {
        const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
            .from('product-photos').upload(`products/${fileName}`, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('product-photos').getPublicUrl(`products/${fileName}`);
        return data.publicUrl;
    }
};
