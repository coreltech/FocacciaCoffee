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
        const { data, error } = await supabase.from('sales_prices').select('*').order('product_name');
        if (error) throw error;
        return data || [];
    },

    async saveCatalogItem(item) {
        const { data, error } = await supabase.from('sales_prices').upsert(item).select().single();
        if (error) throw error;
        return data;
    },

    async deleteCatalogItem(id) {
        const { error } = await supabase.from('sales_prices').delete().eq('id', id);
        if (error) throw error;
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
