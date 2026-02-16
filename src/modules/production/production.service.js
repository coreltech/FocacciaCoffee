import { supabase } from '../../core/supabase.js';

export const ProductionService = {
    async getData() {
        const [recipes, inputs, catalog, logs] = await Promise.all([
            supabase.from('recipes').select('*').order('name'),
            supabase.from('v_unified_inputs').select('*').order('name'),
            supabase.from('sales_prices').select('*').eq('esta_activo', true).order('product_name'),
            supabase.from('production_logs').select('*').order('fecha_produccion', { ascending: false }).limit(10)
        ]);

        let shoppingList = { data: [] };
        try {
            // Fetch separate to avoid breaking the whole page if view fails
            const res = await supabase.from('v_shopping_list').select('*');
            if (res.error) {
                console.error("Error fetching shopping list:", res.error);
            } else {
                shoppingList = res;
            }
        } catch (err) {
            console.error("Critical error fetching shopping list:", err);
        }

        return {
            recipes: recipes.data || [],
            allInputs: inputs.data || [],
            catalog: catalog.data || [],
            logs: logs.data || [],
            shoppingList: shoppingList.data || []
        };
    },

    async closeWeeklyCycle() {
        const { error } = await supabase
            .from('sales_orders')
            .update({ fulfillment_status: 'en_produccion' })
            .eq('fulfillment_status', 'pendiente');

        if (error) throw error;
        return true;
    },

    async getIngredientCost(id, type) {
        if (type === 'ingrediente' || type === 'insumo') {
            const { data } = await supabase.from('supplies').select('last_purchase_price, equivalence').eq('id', id).single();
            if (!data || !data.equivalence) return 0;
            return data.last_purchase_price / data.equivalence; // USD per min unit
        } else {
            // Receta compuesta (Topping)
            const { data: items } = await supabase.from('recipe_items').select('*, supplies(*)').eq('recipe_id', id);
            if (!items) return 0;
            let cost = 0, weight = 0;
            items.forEach(i => {
                const s = i.supplies;
                const p = s ? (s.last_purchase_price / (s.equivalence || 1)) : 0;
                const g = i.quantity * 10; // Following original logic factor
                cost += (g * p);
                weight += g;
            });
            return weight > 0 ? (cost / weight) : 0;
        }
    },

    async registerProduction(prodData) {
        /*
            prodData: {
                batchName,
                units,
                totalCost,
                catalogId
            }
        */

        // Call the NEW recursive atomic RPC
        const { data, error } = await supabase.rpc('registrar_produccion_atomica', {
            p_catalog_id: prodData.catalogId,
            p_units: prodData.units,
            p_recipe_name: prodData.batchName,
            p_total_cost: prodData.totalCost
        });

        if (error) {
            console.error("Error RPC Production:", error);
            throw new Error(error.message);
        }

        if (!data.success) {
            throw new Error(data.message || data.error);
        }

        return data;
    },

    async deleteLog(logId) {
        return await supabase.from('production_logs').delete().eq('id', logId);
    },

    async checkAssembly(catalogId) {
        const { data } = await supabase.from('catalog_composition')
            .select('id')
            .eq('catalog_id', catalogId)
            .limit(1);
        return data && data.length > 0;
    }
};
